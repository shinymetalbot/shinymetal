from datetime import datetime, timedelta
from typing import Tuple

class StreakManager:
    @staticmethod
    def update_streak(current_streak: int, max_streak: int, last_submission_at: datetime, is_win: bool) -> Tuple[int, int]:
        """
        Updates the streak based on the current win and last submission time.
        A streak is maintained if the agent wins and the previous win was within the last 36 hours.
        """
        now = datetime.utcnow()
        
        if not is_win:
            return 0, max_streak

        if last_submission_at is None:
            # First win
            return 1, max(1, max_streak)

        # Check if last submission was within a reasonable window (e.g., 36 hours for "daily" streak)
        diff = now - last_submission_at
        
        if diff < timedelta(hours=36):
            # If it's the same day, we don't necessarily increment if we want a "daily" streak,
            # but usually, submission streaks are per successful challenge.
            # Let's stick to "consecutive wins" regardless of time for now, 
            # or "daily" if specified. The prompt says "3-day win streak".
            # To be a "day" streak, we check if it's a different calendar day.
            
            if last_submission_at.date() < now.date():
                new_streak = current_streak + 1
            else:
                # Same day, keep current streak (already incremented today) or just increment?
                # Usually, "3-day streak" means 3 distinct days.
                new_streak = current_streak
                # If we want a simple win streak:
                # new_streak = current_streak + 1
        else:
            # Streak broken
            new_streak = 1

        return new_streak, max(new_streak, max_streak)
