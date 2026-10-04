import { getDayStart, getDayEnd, formatTime } from "./dayUtils";
import { useNow } from "./useNow";

function formatCountdown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

// next allowed cigarette = last cigarette + (time left until sleep / cigarettes left today)
function Timer({ profile, target, todayLogs }) {
  const now = useNow(1000);

  // quit mode has no timer
  if (target === 0) return null;

  const dayStart = getDayStart(profile.wake_time, now);
  const dayEnd = getDayEnd(profile.wake_time, profile.sleep_time, now);
  const left = target - todayLogs.length;

  if (left <= 0) {
    return (
      <section className="card timer">
        <p className="timer-label">No cigarettes left today</p>
        <p className="timer-big">Done for today</p>
      </section>
    );
  }

  if (now >= dayEnd) {
    return (
      <section className="card timer">
        <p className="timer-label">It's past your sleep time</p>
        <p className="timer-big">See you tomorrow</p>
      </section>
    );
  }

  // logs are newest first, so todayLogs[0] is the last cigarette
  const base = todayLogs.length > 0 ? new Date(todayLogs[0].smoked_at) : dayStart;
  const next = new Date(base.getTime() + (dayEnd - base) / left);

  if (now >= next) {
    return (
      <section className="card timer ready">
        <p className="timer-label">
          {left} left today · allowed since {formatTime(next)}
        </p>
        <p className="timer-big">You can smoke now</p>
      </section>
    );
  }

  return (
    <section className="card timer">
      <p className="timer-label">Next cigarette at {formatTime(next)}</p>
      <p className="timer-big">{formatCountdown(next - now)}</p>
      <p className="timer-label">{left} left today</p>
    </section>
  );
}

export default Timer;
