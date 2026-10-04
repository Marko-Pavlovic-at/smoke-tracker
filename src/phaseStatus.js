import { getDayStart, MS_PER_DAY } from "./dayUtils";

export const PHASE_DAYS = 14;
export const QUIT_SUCCESS_DAYS = 90;

// Works out where you are in the current phase.
// - The 14 days count from when the phase started.
// - A day where you smoked the old target or more (e.g. 20 when the target is 10)
//   restarts the 14 days, counting from the next day.
// - At target 0 (quit mode) it counts smoke-free days since the last cigarette.
export function getPhaseStatus({ phase, previousTarget, logs, lastLogAt, wakeTime, now }) {
  if (!phase) return null;

  const phaseStart = new Date(phase.started_at);

  // how many cigarettes per day since the phase started, keyed by the day's start time
  const perDay = {};
  logs.forEach((log) => {
    const time = new Date(log.smoked_at);
    if (time < phaseStart) return;
    const dayStart = getDayStart(wakeTime, time).getTime();
    perDay[dayStart] = (perDay[dayStart] || 0) + 1;
  });

  let countingFrom = phaseStart;
  Object.entries(perDay).forEach(([dayStart, count]) => {
    if (count < previousTarget) return;
    const nextDay = new Date(Number(dayStart));
    nextDay.setDate(nextDay.getDate() + 1);
    if (nextDay > countingFrom) countingFrom = nextDay;
  });

  const restartsTomorrow = countingFrom > now;
  const daysDone = restartsTomorrow
    ? 0
    : Math.floor((now - countingFrom) / MS_PER_DAY);

  const smokeFreeSince = lastLogAt ? new Date(lastLogAt) : phaseStart;
  const smokeFreeDays = Math.max(
    0,
    Math.floor((now - smokeFreeSince) / MS_PER_DAY),
  );

  return {
    daysDone,
    restartsTomorrow,
    canLower: !restartsTomorrow && daysDone >= PHASE_DAYS,
    isQuitMode: phase.target_count === 0,
    smokeFreeDays,
    quitSuccess: smokeFreeDays >= QUIT_SUCCESS_DAYS,
  };
}
