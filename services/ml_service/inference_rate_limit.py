import asyncio
import os
import time
from collections import deque


class InferenceRateLimiter:
    def __init__(self) -> None:
        self._request_limit = int(os.getenv("LLM_REQUESTS_PER_MINUTE", "20"))
        self._token_limit = int(os.getenv("LLM_TOKENS_PER_MINUTE", "80000"))
        self._requests: deque[float] = deque()
        self._tokens: deque[tuple[float, int]] = deque()
        self._lock = asyncio.Lock()

    async def acquire(self, estimated_tokens: int) -> bool:
        async with self._lock:
            now = time.monotonic()
            cutoff = now - 60
            while self._requests and self._requests[0] < cutoff:
                self._requests.popleft()
            while self._tokens and self._tokens[0][0] < cutoff:
                self._tokens.popleft()
            token_total = sum(value for _, value in self._tokens)
            if len(self._requests) >= self._request_limit:
                return False
            if token_total + estimated_tokens > self._token_limit:
                return False
            self._requests.append(now)
            self._tokens.append((now, estimated_tokens))
            return True


rate_limiter = InferenceRateLimiter()
