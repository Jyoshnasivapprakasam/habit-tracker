const API_URL = "http://127.0.0.1:8000";

export async function getWeeklyAnalytics(startDate) {
  const response = await fetch(
    `${API_URL}/analytics/weekly?start_date=${startDate}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weekly analytics");
  }

  return response.json();
}
export async function getMonthlyAnalytics(year, month) {
  const response = await fetch(
    `${API_URL}/analytics/monthly?year=${year}&month=${month}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch monthly analytics");
  }

  return response.json();
}
export async function getYearlyAnalytics(year) {
  const response = await fetch(
    `${API_URL}/analytics/yearly?year=${year}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch yearly analytics");
  }

  return response.json();
}
export async function getHabitHeatmap() {
  const response = await fetch(
    "http://127.0.0.1:8000/habit-heatmap"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch habit heatmap");
  }

  return response.json();
}