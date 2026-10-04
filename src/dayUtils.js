// Everything about "days": a day starts at wake time, not at midnight.

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseTime(time) {
  // Supabase gives times back as "06:00:00"
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

// When did the day that `date` belongs to start?
// Before wake time (e.g. 01:00), the day started yesterday at wake time.
export function getDayStart(wakeTime, date = new Date()) {
  const { hours, minutes } = parseTime(wakeTime);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);

  if (date < start) {
    start.setDate(start.getDate() - 1);
  }

  return start;
}

// When does the day that `date` belongs to end (sleep time)?
// Works when sleep time is after midnight too (e.g. wake 08:00, sleep 01:00).
export function getDayEnd(wakeTime, sleepTime, date = new Date()) {
  const start = getDayStart(wakeTime, date);
  const { hours, minutes } = parseTime(sleepTime);
  const end = new Date(start);
  end.setHours(hours, minutes, 0, 0);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

// A day as a text key like "2026-10-04", based on when that day started
export function getDayKey(wakeTime, date) {
  const start = getDayStart(wakeTime, date);
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${start.getFullYear()}-${month}-${day}`;
}

// { "2026-10-03": 12, "2026-10-04": 9, ... }
export function countPerDay(logs, wakeTime) {
  const counts = {};

  logs.forEach((log) => {
    const key = getDayKey(wakeTime, new Date(log.smoked_at));
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatMoney(amount) {
  return `${amount.toFixed(2)} €`;
}
