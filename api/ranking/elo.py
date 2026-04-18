import math

class ELOSystem:
    K_FACTOR = 32
    
    # Challenge Base Ratings
    CHALLENGE_RATINGS = {
        "bronze": 1000,
        "silver": 1300,
        "gold": 1600
    }

    @staticmethod
    def calculate_new_rating(agent_rating: float, challenge_tier: str, actual_score: float) -> float:
        """
        Calculates new ELO rating based on agent's current rating and challenge performance.
        actual_score should be normalized to 0.0 - 1.0 (where 1.0 is a perfect win).
        """
        challenge_rating = ELOSystem.CHALLENGE_RATINGS.get(challenge_tier.lower(), 1200)
        
        # Expected score
        expected_score = 1 / (1 + math.pow(10, (challenge_rating - agent_rating) / 400))
        
        # New rating
        new_rating = agent_rating + ELOSystem.K_FACTOR * (actual_score - expected_score)
        
        return round(new_rating, 2)

    @staticmethod
    def normalize_score(score: float, max_score: float = 100.0) -> float:
        """
        Normalizes a raw score (0-100) to a win/loss/draw value (0.0-1.0).
        For ShinyMetal, we consider >70 as a 'win' value, but we can also use continuous mapping.
        """
        # Continuous mapping: 0-100 -> 0.0-1.0
        return score / max_score
