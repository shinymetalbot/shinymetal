import re
from typing import Dict, Any, List
from .models import Tier

class ScoringEngine:
    @staticmethod
    def score_submission(challenge_id: str, tier: Tier, output: Any) -> Dict[str, Any]:
        """
        Calculates the score breakdown for a submission based on challenge and tier.
        """
        if challenge_id == "cold-open":
            return ScoringEngine._score_cold_open(tier, output)
        elif challenge_id == "inbox-zero":
            return ScoringEngine._score_inbox_zero(tier, output)
        elif challenge_id == "due-diligence":
            return ScoringEngine._score_due_diligence(tier, output)
        elif challenge_id == "business-in-a-box":
            return ScoringEngine._score_business_in_a_box(tier, output)
        elif challenge_id == "speechwriter":
            return ScoringEngine._score_speechwriter(tier, output)
        
        # Default fallback for other challenges
        return {
            "constraint_compliance": 0.0,
            "quality_metrics": 0.0,
            "community_vote": 0.0,
            "total": 0.0,
            "notes": f"Scoring logic not implemented for {challenge_id}."
        }

    @staticmethod
    def _score_cold_open(tier: Tier, output: Any) -> Dict[str, Any]:
        # Expecting output to be a dict with 'subject' and 'body'
        subject = output.get("subject", "")
        body = output.get("body", "")
        
        constraints_passed = 0
        total_constraints = 6
        
        # 1. Subject length
        if len(subject) <= 60:
            constraints_passed += 1
            
        # 2. Body length (word count)
        words = body.split()
        if 150 <= len(words) <= 250:
            constraints_passed += 1
            
        # 3. Mentions pain point
        pain_points = ["dispatch", "efficiency", "drivers", "trucking", "fleet", "spreadsheet", "manual"]
        if any(pp in body.lower() for pp in pain_points):
            constraints_passed += 1
            
        # 4. Clear CTA
        cta_keywords = ["?", "call", "meet", "link", "schedule", "calendar", "connect"]
        if any(kw in body.lower() for kw in cta_keywords):
            constraints_passed += 1
            
        # 5. No "hope this email finds you well"
        forbidden = ["hope this email finds you well", "hope you are doing well", "how are you"]
        if not any(f in body.lower() for f in forbidden):
            constraints_passed += 1
            
        # 6. Signature block (approximate by newlines and content)
        if len(body.strip().split("\n")) >= 4:
            constraints_passed += 1
            
        constraint_score = (constraints_passed / total_constraints) * 30
        
        # Quality Metrics (Simplified heuristic for MVP)
        # 10/10 looks like: specific, personalized, clear value prop
        quality_score = 0.0
        if constraints_passed >= 5:
            quality_score = 30.0 + (len(body) % 10) # Base 30 + some jitter for MVP
        elif constraints_passed >= 3:
            quality_score = 20.0
        else:
            quality_score = 10.0
            
        return {
            "constraint_compliance": round(constraint_score, 2),
            "quality_metrics": round(quality_score, 2),
            "community_vote": 0.0,
            "total": round(constraint_score + quality_score, 2),
            "breakdown": {"passed": constraints_passed, "total": total_constraints}
        }

    @staticmethod
    def _score_inbox_zero(tier: Tier, output: Any) -> Dict[str, Any]:
        # Expects a dict with 'triage' (list) and 'replies' (list) and 'report' (string)
        triage = output.get("triage", [])
        replies = output.get("replies", [])
        report = output.get("report", "")
        
        constraints_passed = 0
        total_constraints = 10
        
        # Checklist mapping from research doc
        if triage and len(triage) >= 12: constraints_passed += 1 # Category/Priority for all
        if any(t.get("priority") == "Urgent" for t in triage): constraints_passed += 1
        if len(replies) >= 5: constraints_passed += 1 # Replies for all needed
        if "Jordan" in report or any("Jordan" in r.get("body", "") for r in replies): constraints_passed += 1 # Voice
        if not any("phishing" in r.get("to", "").lower() for r in replies): constraints_passed += 1 # No phishing response
        if any("legal" in t.get("category", "").lower() for t in triage): constraints_passed += 1 # Flagged legal
        if any("escalation" in t.get("category", "").lower() for t in triage): constraints_passed += 1 # Acknowledged escalation
        if all(t.get("action") for t in triage): constraints_passed += 1 # Action designation
        if len(report) > 100: constraints_passed += 1 # Report produced
        if "[YOUR NAME]" not in report: constraints_passed += 1 # No PII fabrication
        
        constraint_score = (constraints_passed / total_constraints) * 30
        quality_score = 25.0 if constraints_passed >= 7 else 15.0
        
        return {
            "constraint_compliance": round(constraint_score, 2),
            "quality_metrics": round(quality_score, 2),
            "community_vote": 0.0,
            "total": round(constraint_score + quality_score, 2),
            "breakdown": {"passed": constraints_passed, "total": total_constraints}
        }

    @staticmethod
    def _score_due_diligence(tier: Tier, output: Any) -> Dict[str, Any]:
        report = output.get("report", "")
        
        constraints_passed = 0
        total_constraints = 6
        
        sections = ["Business Model", "Market Size", "Competitive Landscape", "Risk Factors", "Financial Health", "Recommendation"]
        if all(s.lower() in report.lower() for s in sections): constraints_passed += 1
        if "TAM" in report or "SAM" in report or "SOM" in report: constraints_passed += 1
        if report.lower().count("competitor") >= 3 or report.lower().count("vs.") >= 2: constraints_passed += 1
        if report.lower().count("risk") >= 4: constraints_passed += 1
        if "Go" in report or "No-Go" in report: constraints_passed += 1
        if len(report.split()) < 1500: constraints_passed += 1
        
        constraint_score = (constraints_passed / total_constraints) * 30
        quality_score = 20.0 if constraints_passed >= 4 else 10.0
        
        return {
            "constraint_compliance": round(constraint_score, 2),
            "quality_metrics": round(quality_score, 2),
            "community_vote": 0.0,
            "total": round(constraint_score + quality_score, 2),
            "breakdown": {"passed": constraints_passed, "total": total_constraints}
        }

    @staticmethod
    def _score_business_in_a_box(tier: Tier, output: Any) -> Dict[str, Any]:
        plan = output.get("plan", "")
        
        constraints_passed = 0
        total_constraints = 9
        
        sections = ["Executive Summary", "Problem", "Market", "Revenue", "Strategy", "Moat", "Team", "Financial", "Risk"]
        if all(s.lower() in plan.lower() for s in sections): constraints_passed += 1
        if len(re.findall(r"Executive Summary", plan)) > 0: constraints_passed += 1 # Placeholder for length check
        if plan.lower().count("monetization") >= 1 or plan.lower().count("revenue stream") >= 1: constraints_passed += 1
        if "Year 1" in plan and "Year 2" in plan and "Year 3" in plan: constraints_passed += 1
        # ... simplified for MVP
        constraints_passed += 5 # Mocking the rest for now
        
        constraint_score = (constraints_passed / total_constraints) * 30
        quality_score = 25.0 if constraints_passed >= 6 else 15.0
        
        return {
            "constraint_compliance": round(constraint_score, 2),
            "quality_metrics": round(quality_score, 2),
            "community_vote": 0.0,
            "total": round(constraint_score + quality_score, 2),
            "breakdown": {"passed": constraints_passed, "total": total_constraints}
        }

    @staticmethod
    def _score_speechwriter(tier: Tier, output: Any) -> Dict[str, Any]:
        speech = output.get("speech", "")
        
        constraints_passed = 0
        total_constraints = 6
        
        word_count = len(speech.split())
        if 1200 <= word_count <= 1500: constraints_passed += 1
        if not speech.startswith("?") and not speech.startswith("Thank you"): constraints_passed += 1
        if "Mira" in speech or "Osei" in speech: constraints_passed += 1
        if "AI will not replace you" in speech or "expose" in speech: constraints_passed += 1
        # ... simplified for MVP
        constraints_passed += 2
        
        constraint_score = (constraints_passed / total_constraints) * 30
        quality_score = 30.0 if constraints_passed >= 4 else 20.0
        
        return {
            "constraint_compliance": round(constraint_score, 2),
            "quality_metrics": round(quality_score, 2),
            "community_vote": 0.0,
            "total": round(constraint_score + quality_score, 2),
            "breakdown": {"passed": constraints_passed, "total": total_constraints}
        }
