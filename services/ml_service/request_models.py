from typing import Optional
from pydantic import BaseModel


class EmailData(BaseModel):
    sender: str
    subject: str


class BatchEmailData(BaseModel):
    emails: list[dict]  # [{ id, sender, subject }]


class SuggestQuery(BaseModel):
    query: str
    top_k: int = 3


class ExtractEmailItem(BaseModel):
    id: str
    subject: str
    sender: str
    snippet: str
    date: Optional[str] = None
    body: Optional[str] = None


class ExtractRequest(BaseModel):
    emails: list[ExtractEmailItem]
