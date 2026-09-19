from datetime import date
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
from models import Habit, HabitLog
from schemas import HabitCreate, HabitLogCreate
from analytics import (
    calculate_completion_rate,
    get_daily_completion,
    get_habit_completion,
    get_streak_analysis,
    get_monthly_completion,
    get_yearly_completion
)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Habit Tracker API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Habit Tracker API is running!"
    }


@app.post("/habits")
def create_habit(habit: HabitCreate, db: Session = Depends(get_db)):

    new_habit = Habit(
        name=habit.name,
        category=habit.category,
        frequency=habit.frequency,
        target=habit.target
    )

    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)

    return new_habit
@app.put("/habits/{habit_id}")
def update_habit(
    habit_id: int,
    habit: HabitCreate,
    db: Session = Depends(get_db)
):
    existing_habit = db.query(Habit).filter(
        Habit.id == habit_id
    ).first()

    if not existing_habit:
        return {"message": "Habit not found"}

    existing_habit.name = habit.name

    db.commit()
    db.refresh(existing_habit)

    return existing_habit
@app.get("/habits")
def get_habits(db: Session = Depends(get_db)):
    habits = db.query(Habit).filter(Habit.active == True).all()
    return habits

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()

    if not habit:
        return {"message": "Habit not found"}

    habit.active = False
    db.commit()

    return {"message": "Habit deleted successfully"}

    
@app.post("/habit-logs")
def create_habit_log(
    log: HabitLogCreate,
    db: Session = Depends(get_db)
):
    existing_log = db.query(HabitLog).filter(
        HabitLog.habit_id == log.habit_id,
        HabitLog.date == log.date
    ).first()

    if existing_log:
        existing_log.completed = log.completed
        db.commit()
        db.refresh(existing_log)

        return existing_log

    new_log = HabitLog(
        habit_id=log.habit_id,
        date=log.date,
        completed=log.completed
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log
@app.get("/habit-logs")
def get_habit_logs(db: Session = Depends(get_db)):
    logs = db.query(HabitLog).all()

    return logs
@app.get("/habit-history")
def get_habit_history(db: Session = Depends(get_db)):
    logs = db.query(HabitLog).filter(
        HabitLog.completed == True
    ).order_by(
        HabitLog.date.desc()
    ).all()

    history = []

    for log in logs:
        habit = db.query(Habit).filter(
            Habit.id == log.habit_id
        ).first()

        if habit:
            history.append({
                "date": log.date,
                "habit_name": habit.name
            })

    return history
@app.get("/calendar/{selected_date}")
def get_calendar_data(
    selected_date: date,
    db: Session = Depends(get_db)
):
    from datetime import date as current_date

    # Do not show habit data for future dates
    if selected_date > current_date.today():
        return {
            "date": selected_date,
            "habits": []
        }

    habits = db.query(Habit).all()

    result = []

    for habit in habits:

        # Don't show habits that had not been created yet
        if habit.created_at and habit.created_at.date() > selected_date:
            continue

        log = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date == selected_date
        ).first()

        completed = False

        if log:
            completed = log.completed

        result.append({
            "habit_id": habit.id,
            "habit_name": habit.name,
            "completed": completed
        })

    return {
        "date": selected_date,
        "habits": result
    }
@app.get("/analytics/weekly")
def weekly_analytics(
    start_date: date,
    db: Session = Depends(get_db)
):
    from datetime import timedelta

    end_date = start_date + timedelta(days=6)

    completion_rate = calculate_completion_rate(
        db,
        start_date,
        end_date
    )

    daily_data = get_daily_completion(
        db,
        start_date,
        end_date
    )
    habit_data = get_habit_completion(
    db,
    start_date,
    end_date
    )
    streak_data = []

    for habit in db.query(Habit).all():

        streak = get_streak_analysis(
            db,
            habit.id,
            start_date,
            end_date
        )

        streak_data.append({
            "habit_id": habit.id,
            "habit_name": habit.name,
            **streak
        })

    return {
        "period": "weekly",
        "start_date": start_date,
        "end_date": end_date,
        "completion_rate": completion_rate,
        "daily_data": daily_data,
        "habit_data": habit_data,
        "streak_data": streak_data
    }
@app.get("/analytics/monthly")
def monthly_analytics(
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    return get_monthly_completion(
        db,
        year,
        month
    )
@app.get("/analytics/yearly")
def yearly_analytics(
    year: int,
    db: Session = Depends(get_db)
):
    return get_yearly_completion(
        db,
        year
    )
@app.get("/habit-heatmap")
def get_habit_heatmap(db: Session = Depends(get_db)):
    from datetime import timedelta

    today = date.today()
    start_date = today - timedelta(days=83)

    habits = db.query(Habit).all()

    results = []

    current_date = start_date

    while current_date <= today:
        total_habits = 0
        completed_habits = 0

        for habit in habits:

            # Ignore habits that did not exist on this date
            if habit.created_at and habit.created_at.date() > current_date:
                continue

            total_habits += 1

            log = db.query(HabitLog).filter(
                HabitLog.habit_id == habit.id,
                HabitLog.date == current_date
            ).first()

            if log and log.completed:
                completed_habits += 1

        if total_habits > 0:
            completion_rate = round(
                (completed_habits / total_habits) * 100,
                2
            )
        else:
            completion_rate = 0

        results.append({
            "date": current_date,
            "completion_rate": completion_rate,
            "completed_habits": completed_habits,
            "total_habits": total_habits
        })

        current_date += timedelta(days=1)

    return results