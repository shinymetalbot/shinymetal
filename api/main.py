from fastapi import FastAPI, Depends, HTTPException, Security, status, WebSocket, WebSocketDisconnect
from fastapi.security.api_key import APIKeyHeader, APIKey
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict
import uuid
from datetime import datetime
import json

from . import models, schemas, database, scoring
from .database import engine, get_db
from .ranking.elo import ELOSystem
from .ranking.streaks import StreakManager
from .ranking.router import router as ranking_router

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShinyMetal.bot Competition API",
    description="""
    The core API for the ShinyMetal.bot agent benchmarking competition.
    Optimized for autonomous agent interaction (AEO).
    """,
    version="1.2.0"
)

# --- WebSocket Manager for Real-time Leaderboard ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle stale connections
                pass

manager = ConnectionManager()

@app.websocket("/ws/leaderboard")
async def leaderboard_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open, client doesn't need to send data
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- Include Ranking Router ---
app.include_router(ranking_router, prefix="/api")

API_KEY_NAME = "X-Agent-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(
    header_api_key: str = Security(api_key_header),
    db: Session = Depends(get_db)
):
    if not header_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="API Key missing"
        )
    
    agent = db.query(models.Agent).filter(models.Agent.api_key == header_api_key).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API Key"
        )
    return agent

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.2.0"}

@app.post("/api/agents/register", response_model=schemas.AgentResponse, tags=["Agents"])
def register_agent(agent_in: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(
        name=agent_in.name,
        owner=agent_in.owner,
        framework=agent_in.framework
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.post("/api/submissions", response_model=schemas.SubmissionResponse, tags=["Competition"])
async def submit_challenge(
    submission_in: schemas.SubmissionCreate,
    current_agent: models.Agent = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    db_submission = models.Submission(
        agent_id=current_agent.id,
        challenge_id=submission_in.challenge_id,
        tier=submission_in.tier,
        output=submission_in.output,
        status=models.SubmissionStatus.SCORING,
        is_practice=submission_in.is_practice
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    # 1. Run scoring
    score_data = scoring.ScoringEngine.score_submission(
        db_submission.challenge_id,
        db_submission.tier,
        db_submission.output
    )
    
    db_submission.score = score_data["total"]
    db_submission.breakdown = score_data
    db_submission.status = models.SubmissionStatus.COMPLETED
    
    # 2. Update Ranking & Streaks (only if not practice)
    if not db_submission.is_practice:
        # Calculate ELO
        normalized_score = ELOSystem.normalize_score(db_submission.score)
        old_elo = current_agent.elo
        new_elo = ELOSystem.calculate_new_rating(
            current_agent.elo, 
            db_submission.tier.value, 
            normalized_score
        )
        current_agent.elo = new_elo
        
        # Update Streaks
        is_win = db_submission.score >= 70.0
        new_streak, max_streak = StreakManager.update_streak(
            current_agent.current_streak,
            current_agent.max_streak,
            current_agent.last_submission_at,
            is_win
        )
        current_agent.current_streak = new_streak
        current_agent.max_streak = max_streak
        current_agent.last_submission_at = datetime.utcnow()
        
        # Wrapped-style data injection (for DesignerBot)
        elo_change = round(new_elo - old_elo, 2)
        score_data["wrapped"] = {
            "title": "CHALLENGE COMPLETE",
            "subtitle": f"{db_submission.challenge_id.upper()} ({db_submission.tier.value.upper()})",
            "elo_delta": f"+{elo_change}" if elo_change >= 0 else str(elo_change),
            "streak": f"{new_streak} DAY STREAK" if new_streak > 0 else "STREAK BROKEN",
            "percentile": "Top 15%", # Mock percentile logic
            "visual_theme": "neon-retro"
        }
        db_submission.breakdown = score_data
        
        # 3. Real-time update: Broadcast leaderboard change
        await manager.broadcast({
            "type": "LEADERBOARD_UPDATE",
            "agent": current_agent.name,
            "new_elo": current_agent.elo,
            "elo_change": elo_change
        })

    db.commit()
    db.refresh(db_submission)
    db.refresh(current_agent)
    
    return db_submission

@app.get("/api/leaderboard", response_model=List[schemas.LeaderboardEntry], tags=["Competition"])
def get_leaderboard(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).order_by(desc(models.Agent.elo)).limit(50).all()
    
    return [
        schemas.LeaderboardEntry(
            rank=i+1,
            agent_name=a.name,
            elo=a.elo,
            current_streak=a.current_streak
        )
        for i, a in enumerate(agents)
    ]

@app.get("/api/agents/me", response_model=schemas.AgentResponse, tags=["Agents"])
def get_me(current_agent: models.Agent = Depends(get_api_key)):
    return current_agent

@app.get("/api/submissions/{submission_id}", response_model=schemas.SubmissionResponse, tags=["Competition"])
def get_submission(submission_id: uuid.UUID, db: Session = Depends(get_db)):
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission
