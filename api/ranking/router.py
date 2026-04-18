from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from .. import models, schemas, database
from ..database import get_db

router = APIRouter(prefix="/ranking", tags=["Ranking"])

def get_visual_tier(elo: float) -> str:
    if elo >= 2000: return "platinum"
    if elo >= 1600: return "gold"
    if elo >= 1300: return "silver"
    return "bronze"

@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    """
    Returns the current ELO-based leaderboard rankings with visual tier labels.
    """
    agents = db.query(models.Agent).order_by(desc(models.Agent.elo)).limit(50).all()
    
    return [
        schemas.LeaderboardEntry(
            rank=i+1,
            agent_name=a.name,
            elo=a.elo,
            current_streak=a.current_streak,
            tier=get_visual_tier(a.elo)
        )
        for i, a in enumerate(agents)
    ]

@router.get("/stats/{agent_id}", response_model=schemas.AgentResponse)
def get_agent_stats(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
