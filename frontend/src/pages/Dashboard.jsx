import { useEffect, useState } from "react";
import HabitCalendar from "../components/HabitCalendar";

import {
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getYearlyAnalytics,
  getHabitHeatmap,
} from "../services/api";

import "../App.css";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const [data, setData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);

  const [selectedPeriod, setSelectedPeriod] = useState("weekly");

  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("");

  const [habits, setHabits] = useState([]);
  const [completedHabits, setCompletedHabits] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [previousMonthlyData, setPreviousMonthlyData] = useState(null);
  const [previousYearlyData, setPreviousYearlyData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  // ==============================
  // Weekly Analytics
  // ==============================

  useEffect(() => {
    const today = new Date();

    const day = today.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + difference);

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const date = String(monday.getDate()).padStart(2, "0");

    const mondayString = `${year}-${month}-${date}`;

    getWeeklyAnalytics(mondayString)
      .then((result) => {
        setData(result);
      })
      .catch((error) => {
        console.error("Error fetching weekly analytics:", error);
      });
  }, []);

  // ==============================
  // Monthly Analytics
  // ==============================

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    getMonthlyAnalytics(year, month)
      .then((result) => {
        setMonthlyData(result);
      })
      .catch((error) => {
        console.error("Error fetching monthly analytics:", error);
      });
  }, []);

  // ==============================
  // Yearly Analytics
  // ==============================

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();

    getYearlyAnalytics(year)
      .then((result) => {
        setYearlyData(result);
      })
      .catch((error) => {
        console.error("Error fetching yearly analytics:", error);
      });
  }, []);
  // ==============================
// Previous Period Analytics
// ==============================

useEffect(() => {
  const today = new Date();

  const day = today.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + difference);

  const previousMonday = new Date(monday);
  previousMonday.setDate(monday.getDate() - 7);

  const year = previousMonday.getFullYear();
  const month = String(previousMonday.getMonth() + 1).padStart(2, "0");
  const date = String(previousMonday.getDate()).padStart(2, "0");

  const previousMondayString =
    `${year}-${month}-${date}`;

  getWeeklyAnalytics(previousMondayString)
    .then((result) => {
      setPreviousData(result);
    })
    .catch((error) => {
      console.error(
        "Error fetching previous weekly analytics:",
        error
      );
    });

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let previousMonth = currentMonth - 1;
  let previousMonthYear = currentYear;

  if (previousMonth === 0) {
    previousMonth = 12;
    previousMonthYear--;
  }

  getMonthlyAnalytics(
    previousMonthYear,
    previousMonth
  )
    .then((result) => {
      setPreviousMonthlyData(result);
    })
    .catch((error) => {
      console.error(
        "Error fetching previous monthly analytics:",
        error
      );
    });

  getYearlyAnalytics(currentYear - 1)
    .then((result) => {
      setPreviousYearlyData(result);
    })
    .catch((error) => {
      console.error(
        "Error fetching previous yearly analytics:",
        error
      );
    });
}, []);
// ==============================
// Habit Heatmap
// ==============================

useEffect(() => {
  getHabitHeatmap()
    .then((result) => {
      setHeatmapData(result);
    })
    .catch((error) => {
      console.error("Error fetching habit heatmap:", error);
    });
}, []);

  // ==============================
  // Fetch Habits and Today's Logs
  // ==============================

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    Promise.all([
      fetch("http://127.0.0.1:8000/habits").then((response) =>
        response.json()
      ),

      fetch("http://127.0.0.1:8000/habit-logs").then((response) =>
        response.json()
      ),
    ])
      .then(([habitResult, logResult]) => {
        setHabits(habitResult);

        const completedToday = logResult
          .filter(
            (log) =>
              log.date === todayString &&
              log.completed === true
          )
          .map((log) => log.habit_id);

        setCompletedHabits(completedToday);
      })
      .catch((error) => {
        console.error(
          "Error fetching habits and logs:",
          error
        );
      });
  }, []);

  // ==============================
  // Add New Habit
  // ==============================

  const addHabit = async () => {
    if (!habitName.trim()) {
      alert("Please enter habit name");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/habits",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: habitName,
            category: "General",
            frequency: "daily",
            target: 1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add habit");
      }

      setHabitName("");
      setCategory("");

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Could not add habit");
    }
  };

  // ==============================
  // Mark / Unmark Habit
  // ==============================

  const markHabitCompleted = async (habitId) => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    const alreadyCompleted =
      completedHabits.includes(habitId);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/habit-logs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            habit_id: habitId,
            date: todayString,
            completed: !alreadyCompleted,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update habit");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Could not update habit");
    }
  };

  // ==============================
  // Delete Habit
  // ==============================

  const deleteHabit = async (habitId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this habit?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/habits/${habitId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete habit");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Could not delete habit");
    }
  };

  // ==============================
  // Loading
  // ==============================

  if (!data) {
    return (
      <div className="dashboard-loading">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const streak = data.streak_data[0];

  const currentCompletionRate =
    selectedPeriod === "weekly"
      ? data.completion_rate
      : selectedPeriod === "monthly"
      ? monthlyData?.completion_rate ?? 0
      : yearlyData?.completion_rate ?? 0;

  const currentCompletedCount = completedHabits.length;

  const currentTotalHabits = habits.length;

  const todayProgress =
    currentTotalHabits > 0
      ? Math.round(
          (currentCompletedCount / currentTotalHabits) * 100
        )
      : 0;
  const automaticInsights = [];

  

if (selectedPeriod === "weekly" && previousData && data) {
  const difference =
    data.completion_rate - previousData.completion_rate;

  if (difference > 0) {
    automaticInsights.push(
      `Your completion rate improved by ${difference.toFixed(
        2
      )} percentage points compared with last week.`
    );
  } else if (difference < 0) {
    automaticInsights.push(
      `Your completion rate decreased by ${Math.abs(
        difference
      ).toFixed(2)} percentage points compared with last week.`
    );
  } else {
    automaticInsights.push(
      "Your completion rate is unchanged compared with last week."
    );
  }
}

if (currentTotalHabits > 0) {
  automaticInsights.push(
    `You completed ${currentCompletedCount} of ${currentTotalHabits} habits today.`
  );
}

if (streak?.current_streak > 0) {
  automaticInsights.push(
    `You currently have a ${streak.current_streak}-day streak.`
  );
}

if (data && data.completion_rate >= 80) {
  automaticInsights.push(
    "Your overall completion rate is currently strong."
  );
} else if (data && data.completion_rate < 40) {
  automaticInsights.push(
    "Your recent completion rate shows room for improvement."
  );
}

// ==============================
// Habit Trend Detection
// ==============================

let habitTrend = "No clear trend yet.";

if (
  selectedPeriod === "weekly" &&
  data &&
  data.daily_data &&
  data.daily_data.length >= 3
) {
  const dailyRates = data.daily_data.map(
    (day) => day.completion_rate
  );

  const firstRate = dailyRates[0];
  const lastRate = dailyRates[dailyRates.length - 1];

  if (lastRate > firstRate) {
    habitTrend = "Your habit completion is trending upward.";
  } else if (lastRate < firstRate) {
    habitTrend = "Your habit completion is trending downward.";
  } else {
    habitTrend = "Your habit completion is relatively stable.";
  }
}

  // ==============================
  // Dashboard UI
  // ==============================

  return (
    <div className="dashboard">

      {/* Header */}

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">PRODUCTIVITY</p>

          <h1>Habit Tracker</h1>

          <p className="dashboard-subtitle">
            Track your daily habits and understand your progress.
          </p>
        </div>
      </header>

      {/* Overview */}

      <section className="overview-section">

        <div className="section-heading">
          <div>
            <p className="section-label">OVERVIEW</p>
            <h2>Your Progress</h2>
          </div>
        </div>

        <div className="summary-cards">

          <div className="summary-card">
            <p className="summary-card-label">
              {selectedPeriod === "weekly"
                ? "Weekly Progress"
                : selectedPeriod === "monthly"
                ? "Monthly Progress"
                : "Yearly Progress"}
            </p>

            <p className="summary-card-value">
              {currentCompletionRate}%
            </p>

            <p className="summary-card-description">
              Overall completion rate
            </p>
          </div>

          <div className="summary-card">
            <p className="summary-card-label">
              Current Streak
            </p>

            <p className="summary-card-value">
              {streak?.current_streak || 0}
            </p>

            <p className="summary-card-description">
              Consecutive completed days
            </p>
          </div>

          <div className="summary-card">
            <p className="summary-card-label">
              Best Streak
            </p>

            <p className="summary-card-value">
              {streak?.best_streak || 0}
            </p>

            <p className="summary-card-description">
              Longest completed streak
            </p>
          </div>

          <div className="summary-card">
            <p className="summary-card-label">
              Completed Days
            </p>

            <p className="summary-card-value">
              {streak?.completed_days || 0}
            </p>

            <p className="summary-card-description">
              Total completed days
            </p>
          </div>

        </div>

      </section>


      {/* Habit Insights */}

      <section className="insights-section">
        <h2 className="section-heading">Habit Insights</h2>

        <div className="insight-cards">
          <div className="insight-card">
            <p className="insight-label">
              Improvement Compared With Previous Period
            </p>

            {selectedPeriod === "weekly" && previousData && data ? (
              <>
                <p className="insight-value">
                  {(
                    data.completion_rate -
                    previousData.completion_rate
                  ).toFixed(2)}
                  %
                </p>

                <p className="insight-description">
                  {data.completion_rate >= previousData.completion_rate
                    ? "Improvement from the previous week"
                    : "Decrease from the previous week"}
                </p>
              </>
            ) : selectedPeriod === "monthly" &&
              previousMonthlyData &&
              monthlyData ? (
              <>
                <p className="insight-value">
                  {(
                    monthlyData.completion_rate -
                    previousMonthlyData.completion_rate
                  ).toFixed(2)}
                  %
                </p>

                <p className="insight-description">
                  {monthlyData.completion_rate >=
                  previousMonthlyData.completion_rate
                    ? "Improvement from the previous month"
                    : "Decrease from the previous month"}
                </p>
              </>
            ) : selectedPeriod === "yearly" &&
              previousYearlyData &&
              yearlyData ? (
              <>
                <p className="insight-value">
                  {(
                    yearlyData.completion_rate -
                    previousYearlyData.completion_rate
                  ).toFixed(2)}
                  %
                </p>

                <p className="insight-description">
                  {yearlyData.completion_rate >=
                  previousYearlyData.completion_rate
                    ? "Improvement from the previous year"
                    : "Decrease from the previous year"}
                </p>
              </>
            ) : (
              <p className="insight-description">
                Calculating comparison...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Automatic Insights */}

      <section className="automatic-insights-section">
        <div className="section-heading">
          <div>
            <p className="section-label">INSIGHTS</p>
            <h2>Automatic Insights</h2>
            <p>
              Observations generated from your habit activity.
            </p>
          </div>
        </div>

        <div className="automatic-insights-list">
          {automaticInsights.length === 0 ? (
            <p className="insight-empty">
              Not enough data to generate insights yet.
            </p>
          ) : (
            automaticInsights.map((insight, index) => (
              <div
                className="automatic-insight-card"
                key={index}
              >
                <p>{insight}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Habit Trend */}

      <section className="trend-section">
        <div className="section-heading">
          <div>
            <p className="section-label">TREND</p>
            <h2>Habit Trend</h2>
            <p>
              Your recent habit completion pattern.
            </p>
          </div>
        </div>

        <div className="trend-card">
          <p>{habitTrend}</p>
        </div>
      </section>
     

      {/* Today's Habits */}

      <section className="today-habits">

        <div className="section-heading">

          <div>
            <p className="section-label">TODAY</p>

            <h2>Today's Habits</h2>

            <p>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="today-progress">

            <p className="today-progress-label">
              Today's Completion
            </p>

            <p className="today-progress-value">
              {todayProgress}%
            </p>

            <p className="today-progress-count">
              {currentCompletedCount} of{" "}
              {currentTotalHabits} habits completed
            </p>

          </div>

        </div>

        {habits.length === 0 ? (

          <div className="empty-state">
            <h3>No habits yet</h3>

            <p>
              Add your first habit above to begin tracking
              your progress.
            </p>
          </div>

        ) : (

          <div className="habit-list">

            {habits.map((habit) => {

              const habitAnalytics =
                data.habit_data.find(
                  (item) =>
                    item.habit_id === habit.id
                );

              const habitStreak =
                data.streak_data.find(
                  (item) =>
                    item.habit_id === habit.id
                );

              const completionRate =
                habitAnalytics?.completion_rate ?? 0;

              const completedDays =
                habitAnalytics?.completed_days ?? 0;

              const isCompleted =
                completedHabits.includes(habit.id);

              return (

                <div
                  className="habit-card"
                  key={habit.id}
                >

                  <div className="habit-card-main">

                    <div className="habit-card-header">

                      <div>
                        <h3>{habit.name}</h3>

                        <p className="habit-frequency">
                          Daily habit
                        </p>
                      </div>

                      <div
                        className={
                          isCompleted
                            ? "habit-status completed"
                            : "habit-status"
                        }
                      >
                        {isCompleted
                          ? "Completed"
                          : "Pending"}
                      </div>

                    </div>

                    <div className="habit-stat-row">

                      <div>
                        <span>Weekly completion</span>
                        <strong>
                          {completionRate}%
                        </strong>
                      </div>

                      <div>
                        <span>Current streak</span>
                        <strong>
                          {habitStreak?.current_streak ?? 0} days
                        </strong>
                      </div>

                      <div>
                        <span>Best streak</span>
                        <strong>
                          {habitStreak?.best_streak ?? 0} days
                        </strong>
                      </div>

                      <div>
                        <span>Completed days</span>
                        <strong>
                          {completedDays}
                        </strong>
                      </div>

                    </div>

                    <div className="habit-progress">

                      <div className="habit-progress-header">

                        <span>Weekly progress</span>

                        <span>
                          {completionRate}%
                        </span>

                      </div>

                      <div className="progress-track">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${completionRate}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>

                  <div className="habit-actions">

                    <button
                      className={
                        isCompleted
                          ? "complete-button completed"
                          : "complete-button"
                      }
                      onClick={() =>
                        markHabitCompleted(habit.id)
                      }
                    >
                      {isCompleted
                        ? "Completed"
                        : "Mark Completed"}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={async () => {

                        const newName =
                          window.prompt(
                            "Enter new habit name:",
                            habit.name
                          );

                        if (
                          !newName ||
                          !newName.trim()
                        ) {
                          return;
                        }

                        try {

                          const response =
                            await fetch(
                              `http://127.0.0.1:8000/habits/${habit.id}`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type":
                                    "application/json",
                                },
                                body: JSON.stringify({
                                  name:
                                    newName.trim(),
                                  category:
                                    "General",
                                  frequency:
                                    "daily",
                                  target: 1,
                                }),
                              }
                            );

                          if (!response.ok) {
                            throw new Error(
                              "Failed to update habit"
                            );
                          }

                          window.location.reload();

                        } catch (error) {

                          console.error(error);

                          alert(
                            "Could not update habit"
                          );

                        }

                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteHabit(habit.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </section>

      {/* Calendar */}

      <section className="calendar-wrapper">

        <button
          className="calendar-button"
          onClick={() =>
            setShowCalendar(!showCalendar)
          }
        >
          {showCalendar
            ? "Hide Calendar"
            : "View Calendar"}
        </button>

        {showCalendar && <HabitCalendar />}

      </section>

      {/* Habit Heatmap */}

        {/* Habit Heatmap */}

      <section className="heatmap-wrapper">
        <button
          className="heatmap-button"
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          {showHeatmap
            ? "Hide Habit Activity"
            : "View Habit Activity"}
        </button>

        {showHeatmap && (
          <div className="heatmap-section">
            <div className="section-heading">
              <div>
                <p className="section-label">ACTIVITY</p>
                <h2>Habit Activity</h2>
                <p>
                  Your daily habit completion over the last 12 weeks.
                </p>
              </div>
            </div>

            <div className="heatmap">
              {heatmapData.map((day) => {
                let intensity = "heatmap-empty";

                if (day.completion_rate === 100) {
                  intensity = "heatmap-full";
                } else if (day.completion_rate >= 50) {
                  intensity = "heatmap-medium";
                } else if (day.completion_rate > 0) {
                  intensity = "heatmap-low";
                }

                return (
                  <div
                    key={day.date}
                    className={`heatmap-cell ${intensity}`}
                    title={`${day.date} - ${day.completion_rate}% completed`}
                  />
                );
              })}
            </div>

            <div className="heatmap-legend">
              <span>Less</span>
              <span className="legend-box heatmap-empty"></span>
              <span className="legend-box heatmap-low"></span>
              <span className="legend-box heatmap-medium"></span>
              <span className="legend-box heatmap-full"></span>
              <span>More</span>
            </div>
          </div>
        )}
      </section>

      {/* Analytics */}

      <section className="analytics-section">

        <div className="section-heading">

          <div>
            <p className="section-label">
              ANALYTICS
            </p>

            <h2>Progress Analysis</h2>

            <p>
              Review your habit completion over different
              periods.
            </p>
          </div>

        </div>

        {/* Period Selector */}

        <div className="period-selector">

          <button
            className={
              selectedPeriod === "weekly"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setSelectedPeriod("weekly")
            }
          >
            Weekly
          </button>

          <button
            className={
              selectedPeriod === "monthly"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setSelectedPeriod("monthly")
            }
          >
            Monthly
          </button>

          <button
            className={
              selectedPeriod === "yearly"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setSelectedPeriod("yearly")
            }
          >
            Yearly
          </button>

        </div>

        {/* Weekly */}

        {selectedPeriod === "weekly" && (

          <div className="chart-card">

            <div className="chart-header">

              <div>
                <h3>Weekly Progress</h3>

                <p>
                  Completion rate for the current week
                </p>
              </div>

              <strong>
                {data.completion_rate}%
              </strong>

            </div>

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={data.daily_data}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="date" />

                <YAxis domain={[0, 100]} />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="completion_rate"
                  stroke="#111827"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        )}

        {/* Monthly */}

        {selectedPeriod === "monthly" &&
          monthlyData && (

            <div className="chart-card">

              <div className="chart-header">

                <div>
                  <h3>Monthly Progress</h3>

                  <p>
                    Daily completion rate for the current
                    month
                  </p>
                </div>

                <strong>
                  {monthlyData.completion_rate}%
                </strong>

              </div>

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <LineChart
                  data={monthlyData.daily_data}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="date" />

                  <YAxis domain={[0, 100]} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="completion_rate"
                    stroke="#111827"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        {/* Yearly */}

        {selectedPeriod === "yearly" &&
          yearlyData && (

            <div className="chart-card">

              <div className="chart-header">

                <div>
                  <h3>Yearly Progress</h3>

                  <p>
                    Monthly completion rate for the year
                  </p>
                </div>

                <strong>
                  {yearlyData.completion_rate}%
                </strong>

              </div>

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <BarChart
                  data={yearlyData.monthly_data}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                    tickFormatter={(month) =>
                      new Date(
                        new Date().getFullYear(),
                        month - 1
                      ).toLocaleString(
                        "default",
                        {
                          month: "short",
                        }
                      )
                    }
                  />

                  <YAxis domain={[0, 100]} />

                  <Tooltip />

                  <Bar
                    dataKey="completion_rate"
                    fill="#111827"
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          )}

      </section>

    </div>
  );
}

export default Dashboard;