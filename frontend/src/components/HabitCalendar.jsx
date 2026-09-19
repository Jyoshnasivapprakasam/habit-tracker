import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function HabitCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habitData, setHabitData] = useState([]);
  const [completedDates, setCompletedDates] = useState([]);

  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Fetch habits for the selected date
  const fetchHabitData = async (date) => {
    try {
      const dateString = getDateString(date);

      const response = await fetch(
        `http://127.0.0.1:8000/calendar/${dateString}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch calendar data");
      }

      const data = await response.json();

      setHabitData(data.habits);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setHabitData([]);
    }
  };

  // Find days where ALL habits were completed
  const fetchCompletedDates = async () => {
    try {
      const [habitResponse, logResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/habits"),
        fetch("http://127.0.0.1:8000/habit-logs"),
      ]);

      if (!habitResponse.ok || !logResponse.ok) {
        throw new Error("Failed to fetch habit data");
      }

      const habits = await habitResponse.json();
      const logs = await logResponse.json();

      if (habits.length === 0) {
        setCompletedDates([]);
        return;
      }

      const completedDates = [];

      // Get unique dates from the logs
      const dates = [
        ...new Set(logs.map((log) => log.date)),
      ];

      dates.forEach((date) => {
        // Get logs for this particular date
        const logsForDate = logs.filter(
          (log) => log.date === date
        );

        // Check whether every habit was completed
        const allCompleted = habits.every((habit) => {
          const log = logsForDate.find(
            (log) => log.habit_id === habit.id
          );

          return log && log.completed === true;
        });

        // Add ONLY fully completed dates
        if (allCompleted) {
          completedDates.push(date);
        }
      });

      setCompletedDates(completedDates);
    } catch (error) {
      console.error(
        "Error fetching completed dates:",
        error
      );
    }
  };

  useEffect(() => {
    fetchHabitData(selectedDate);
    fetchCompletedDates();
  }, [selectedDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const completedHabits = habitData.filter(
    (habit) => habit.completed === true
  );

  const notCompletedHabits = habitData.filter(
    (habit) => habit.completed === false
  );

  return (
    <section className="calendar-section">
      <h2>Habit Calendar</h2>

      <div className="calendar-container">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          tileContent={({ date, view }) => {
            if (view !== "month") {
              return null;
            }

            const dateString = getDateString(date);

            // Show dot ONLY when ALL habits are completed
            if (completedDates.includes(dateString)) {
              return (
                <span className="calendar-dot"></span>
              );
            }

            // No dot for partial or zero completion
            return null;
          }}
        />
      </div>

      <h3 className="selected-date">
        {selectedDate.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </h3>

      <div className="habit-status">
        {habitData.length === 0 ? (
          <p>Habit is not added</p>
        ) : (
          <>
            <div className="completed-list">
              <h3>Completed</h3>

              {completedHabits.length === 0 ? (
                <p>No habits completed.</p>
              ) : (
                completedHabits.map((habit) => (
                  <p key={habit.habit_id}>
                    ✓ {habit.habit_name}
                  </p>
                ))
              )}
            </div>

            <div className="not-completed-list">
              <h3> Not Completed</h3>

              {notCompletedHabits.length === 0 ? (
                <p>All habits completed!</p>
              ) : (
                notCompletedHabits.map((habit) => (
                  <p key={habit.habit_id}>
                    ○ {habit.habit_name}
                  </p>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HabitCalendar;