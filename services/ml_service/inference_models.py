from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.title() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class SourceItem(ApiModel):
    id: str = Field(min_length=1, max_length=200)
    title: str | None = Field(default=None, max_length=500)
    text: str = Field(min_length=1, max_length=4_000)
    occurred_at: str | None = None
    source_type: str | None = Field(default=None, max_length=100)


class InferenceInput(ApiModel):
    items: list[SourceItem] = Field(min_length=1, max_length=40)
    focus: str | None = Field(default=None, max_length=500)
    objective: str | None = Field(default=None, max_length=500)


class InferenceRequest(ApiModel):
    request_id: str = Field(min_length=1, max_length=200)
    task: Literal["summarization", "research_synthesis", "commitment_candidates"]
    input: InferenceInput


class SummaryOutput(ApiModel):
    summary: str = Field(min_length=1, max_length=4_000)
    key_points: list[Annotated[str, Field(min_length=1, max_length=500)]] = Field(max_length=12)
    evidence_ids: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(
        min_length=1, max_length=40
    )


class Candidate(ApiModel):
    title: str = Field(min_length=1, max_length=300)
    rationale: str = Field(min_length=1, max_length=1_000)
    evidence_ids: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(
        min_length=1, max_length=20
    )
    confidence: float = Field(ge=0, le=1)


class SynthesisOutput(ApiModel):
    synthesis: str = Field(min_length=1, max_length=4_000)
    candidates: list[Candidate] = Field(max_length=12)


class CommitmentCandidate(ApiModel):
    kind: Literal["task", "calendar"]
    title: str = Field(min_length=1, max_length=300)
    notes: str = Field(default="", max_length=1_000)
    due_at: str | None = None
    starts_at: str | None = None
    ends_at: str | None = None
    reason: str = Field(min_length=1, max_length=1_000)
    evidence_ids: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(
        min_length=1, max_length=20
    )
    confidence: float = Field(ge=0, le=1)


class CommitmentOutput(ApiModel):
    candidates: list[CommitmentCandidate] = Field(max_length=12)


class ModelSuccess(ApiModel):
    status: Literal["success"]
    confidence: float = Field(ge=0, le=1)
    output: SummaryOutput | SynthesisOutput | CommitmentOutput


class ModelAbstention(ApiModel):
    status: Literal["abstained"]
    reason: Literal["insufficient_evidence", "unsafe_content", "model_abstained"]


ModelDecision = Annotated[
    ModelSuccess | ModelAbstention,
    Field(discriminator="status"),
]


class InferenceSuccess(ApiModel):
    status: Literal["success"]
    provider: Literal["anthropic"]
    model: str
    model_version: str
    output: SummaryOutput | SynthesisOutput | CommitmentOutput
    confidence: float
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    pricing_configured: bool


class InferenceAbstention(ApiModel):
    status: Literal["abstained"]
    provider: Literal["anthropic"]
    model: str
    model_version: str
    reason: Literal["insufficient_evidence", "unsafe_content", "model_abstained"]
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    pricing_configured: bool


InferenceResponse = InferenceSuccess | InferenceAbstention
