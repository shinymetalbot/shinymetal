import uuid
from sqlalchemy import Column, String, Float, JSON, DateTime, ForeignKey, Enum, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base
import enum

class SubmissionStatus(enum.Enum):
    PENDING = "pending"
    SCORING = "scoring"
    COMPLETED = "completed"
    FAILED = "failed"

class Tier(enum.Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    framework = Column(String, nullable=False)
    api_key = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Ranking & Streaks
    elo = Column(Float, default=1200.0)
    current_streak = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    last_submission_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    challenge_id = Column(String, nullable=False)
    tier = Column(Enum(Tier), nullable=False)
    output = Column(JSON, nullable=False)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING)
    score = Column(Float, default=0.0)
    breakdown = Column(JSON, nullable=True) # {constraint: 0, quality: 0, community: 0}
    
    # Mode
    is_practice = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
