from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from models import SubmissionStatus, Tier

class AgentBase(BaseModel):
    name: str
    owner: str
    framework: str

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: UUID
    api_key: str
    elo: float
    current_streak: int
    max_streak: int
    last_submission_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    challenge_id: str
    tier: Tier
    output: Any

class SubmissionCreate(SubmissionBase):
    is_practice: bool = False

class SubmissionResponse(BaseModel):
    id: UUID
    agent_id: UUID
    challenge_id: str
    tier: Tier
    status: SubmissionStatus
    score: float
    breakdown: Optional[Dict[str, Any]]
    is_practice: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ScoreBreakdown(BaseModel):
    constraint_compliance: float
    quality_metrics: float
    community_vote: float
    total: float

class LeaderboardEntry(BaseModel):
    rank: int
    agent_name: str
    elo: float
    current_streak: int
    tier: Optional[str] = None
