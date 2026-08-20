import hmac
import json
import os

import httpx
from anthropic_inference import (
    MalformedProviderOutputError,
    ProviderRateLimitError,
    ProviderUnavailableError,
    infer_with_anthropic,
)
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from inference_models import InferenceRequest, InferenceResponse
from inference_rate_limit import rate_limiter
from pydantic import ValidationError

router = APIRouter(prefix="/v1")


@router.get("/ready")
async def inference_ready() -> JSONResponse:
    state = {
        "ready": bool(os.getenv("ML_SERVICE_TOKEN")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
    }
    return JSONResponse(state, status_code=200 if all(state.values()) else 503)


@router.post("/inference", response_model=InferenceResponse)
async def inference(
    request: InferenceRequest,
    authorization: str | None = Header(default=None),
) -> InferenceResponse:
    authenticate(authorization)
    serialized_length = len(request.input.model_dump_json())
    if serialized_length > 100_000:
        raise HTTPException(status_code=413, detail="input_too_large")
    estimated_tokens = max(1, serialized_length // 4) + 1_500
    if not await rate_limiter.acquire(estimated_tokens):
        raise HTTPException(status_code=429, detail="rate_limited")
    try:
        return await infer_with_anthropic(request)
    except ProviderRateLimitError as error:
        raise HTTPException(status_code=429, detail="rate_limited") from error
    except ProviderUnavailableError as error:
        raise HTTPException(status_code=503, detail="provider_unavailable") from error
    except MalformedProviderOutputError as error:
        raise HTTPException(status_code=502, detail="malformed_output") from error
    except (TimeoutError, httpx.TimeoutException, json.JSONDecodeError) as error:
        raise HTTPException(status_code=504, detail="provider_timeout") from error
    except ValidationError as error:
        raise HTTPException(status_code=502, detail="malformed_output") from error


def authenticate(authorization: str | None) -> None:
    expected = os.getenv("ML_SERVICE_TOKEN")
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="unauthorized")
