from pydantic import BaseModel
from datetime import date


class HabitLogCreate(BaseModel):
    habit_id: int
    date: date
    completed: bool


class HabitCreate(BaseModel):
    name: str
    category: str
    frequency: str = "daily"
    target: int = 1