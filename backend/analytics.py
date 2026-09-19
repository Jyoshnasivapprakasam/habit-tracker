from datetime import date
from sqlalchemy.orm import Session

from models import Habit, HabitLog


def calculate_completion_rate(
    db: Session,
    start_date: date,
    end_date: date
):
    habits = db.query(Habit).all()

    if not habits:
        return 0

    total_possible = 0
    total_completed = 0

    for habit in habits:

        logs = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date >= start_date,
            HabitLog.date <= end_date
        ).all()

        total_days = (end_date - start_date).days + 1

        total_possible += total_days

        total_completed += sum(
            1 for log in logs
            if log.completed
        )

    if total_possible == 0:
        return 0

    return round(
        (total_completed / total_possible) * 100,
        2
    )
def get_daily_completion(
    db: Session,
    start_date: date,
    end_date: date
):
    habits = db.query(Habit).all()

    results = []

    current_date = start_date

    while current_date <= end_date:

        total_habits = len(habits)
        completed_habits = 0

        for habit in habits:

            log = db.query(HabitLog).filter(
                HabitLog.habit_id == habit.id,
                HabitLog.date == current_date
            ).first()

            if log and log.completed:
                completed_habits += 1

        if total_habits > 0:
            percentage = round(
                (completed_habits / total_habits) * 100,
                2
            )
        else:
            percentage = 0

        results.append({
            "date": current_date,
            "completion_rate": percentage
        })

        from datetime import timedelta
        current_date += timedelta(days=1)

    return results
def get_habit_completion(
    db: Session,
    start_date: date,
    end_date: date
):
    habits = db.query(Habit).all()

    results = []

    total_days = (end_date - start_date).days + 1

    for habit in habits:

        logs = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date >= start_date,
            HabitLog.date <= end_date
        ).all()

        completed_days = sum(
            1 for log in logs
            if log.completed
        )

        percentage = round(
            (completed_days / total_days) * 100,
            2
        )

        results.append({
            "habit_id": habit.id,
            "habit_name": habit.name,
            "completion_rate": percentage,
            "completed_days": completed_days
        })

    return results
def get_streak_analysis(
    db: Session,
    habit_id: int,
    start_date: date,
    end_date: date
):
    from datetime import timedelta

    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.date >= start_date,
        HabitLog.date <= end_date,
        HabitLog.completed == True
    ).order_by(HabitLog.date).all()

    completed_dates = [log.date for log in logs]

    if not completed_dates:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "completed_days": 0
        }

    # Calculate best streak
    best_streak = 1
    current_streak = 1

    for i in range(1, len(completed_dates)):

        previous_date = completed_dates[i - 1]
        current_date = completed_dates[i]

        if current_date == previous_date + timedelta(days=1):
            current_streak += 1
        else:
            current_streak = 1

        best_streak = max(best_streak, current_streak)

    # Calculate current streak
    current_streak = 1

    for i in range(len(completed_dates) - 1, 0, -1):

        current_date = completed_dates[i]
        previous_date = completed_dates[i - 1]

        if current_date == previous_date + timedelta(days=1):
            current_streak += 1
        else:
            break

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "completed_days": len(completed_dates)
    }
def get_monthly_completion(
    db: Session,
    year: int,
    month: int
):
    from calendar import monthrange

    start_date = date(year, month, 1)

    last_day = monthrange(year, month)[1]
    end_date = date(year, month, last_day)

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

    return {
        "period": "monthly",
        "year": year,
        "month": month,
        "start_date": start_date,
        "end_date": end_date,
        "completion_rate": completion_rate,
        "daily_data": daily_data
    }
def get_yearly_completion(db: Session, year: int):
    from datetime import date

    monthly_data = []

    today = date.today()

    for month in range(1, 13):

        # Don't include future months
        if year == today.year and month > today.month:
            break

        monthly_result = get_monthly_completion(
            db,
            year,
            month
        )

        monthly_data.append({
            "month": month,
            "completion_rate": monthly_result["completion_rate"]
        })

    if monthly_data:
        yearly_rate = round(
            sum(item["completion_rate"] for item in monthly_data)
            / len(monthly_data),
            2
        )
    else:
        yearly_rate = 0

    return {
        "period": "yearly",
        "year": year,
        "completion_rate": yearly_rate,
        "monthly_data": monthly_data
    }