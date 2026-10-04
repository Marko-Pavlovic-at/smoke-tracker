import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  getDayStart,
  getDayKey,
  countPerDay,
  formatDate,
  formatMoney,
} from "./dayUtils";

// Supabase returns max 1000 rows per request, so load all logs page by page
async function loadAllLogs() {
  const pageSize = 1000;
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("logs")
      .select("smoked_at")
      .order("smoked_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) return all;
    from += pageSize;
  }
}

function Stats({ profile, phases }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAllLogs()
      .then(setLogs)
      .catch((error) => setError(error.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!logs) return <p className="center">Loading...</p>;

  const wakeTime = profile.wake_time;
  const baseline = profile.baseline_count;
  const pricePerCigarette = profile.pack_price / 20;

  // the first day is whatever came first: the profile, the first phase or the first log
  const firstDates = [
    profile.created_at,
    phases.at(-1)?.started_at,
    logs[0]?.smoked_at,
  ]
    .filter(Boolean)
    .map((date) => new Date(date));

  if (firstDates.length === 0) {
    return (
      <section className="card">
        <p>No data yet. Log your first cigarette on the Today page.</p>
      </section>
    );
  }

  const firstDay = getDayStart(wakeTime, new Date(Math.min(...firstDates)));
  const today = getDayStart(wakeTime);
  const counts = countPerDay(logs, wakeTime);

  // one entry per day from the first day until today
  const days = [];
  for (let day = new Date(firstDay); day <= today; day.setDate(day.getDate() + 1)) {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const smoked = counts[getDayKey(wakeTime, day)] || 0;
    // the target that was active at the end of that day (phases are newest first)
    const phase = phases.find((p) => new Date(p.started_at) < nextDay);
    const target = phase ? phase.target_count : baseline;

    days.push({
      date: new Date(day),
      smoked,
      target,
      saved: (baseline - smoked) * pricePerCigarette,
    });
  }

  const totalSaved = days.reduce((sum, day) => sum + day.saved, 0);
  const totalSmoked = days.reduce((sum, day) => sum + day.smoked, 0);
  const notSmoked = baseline * days.length - totalSmoked;

  const lastWeek = days.slice(-7);
  const lastWeekAverage =
    lastWeek.reduce((sum, day) => sum + day.smoked, 0) / lastWeek.length;
  const lastWeekSaved = lastWeek.reduce((sum, day) => sum + day.saved, 0);

  const newestFirst = [...days].reverse();
  const shownDays = showAll ? newestFirst : newestFirst.slice(0, 14);

  return (
    <>
      <section className="card">
        <h2>Overall</h2>
        <div className="stat-grid">
          <div>
            <p className="stat-number">{formatMoney(totalSaved)}</p>
            <p className="stat-label">saved in total</p>
          </div>
          <div>
            <p className="stat-number">{notSmoked}</p>
            <p className="stat-label">cigarettes not smoked</p>
          </div>
          <div>
            <p className="stat-number">{formatMoney(lastWeekSaved)}</p>
            <p className="stat-label">saved last 7 days</p>
          </div>
          <div>
            <p className="stat-number">
              {lastWeekAverage.toFixed(1)}
              <span className="stat-of"> / {baseline}</span>
            </p>
            <p className="stat-label">per day last 7 days (vs. start)</p>
          </div>
        </div>
        <p className="muted">
          {days.length} days tracked since {formatDate(firstDay)}
        </p>
      </section>

      <section className="card">
        <h2>Per day</h2>
        <table className="day-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Smoked</th>
              <th>Target</th>
              <th>Saved</th>
            </tr>
          </thead>
          <tbody>
            {shownDays.map((day) => (
              <tr key={day.date.toISOString()}>
                <td>{formatDate(day.date)}</td>
                <td className={day.smoked > day.target ? "over" : ""}>
                  {day.smoked}
                </td>
                <td>{day.target}</td>
                <td>{formatMoney(day.saved)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {days.length > 14 && (
          <button className="link" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show less" : `Show all ${days.length} days`}
          </button>
        )}
      </section>

      <section className="card">
        <h2>Targets</h2>
        <ul className="log-list">
          <li>
            <span>Start</span>
            <span>{baseline} per day</span>
          </li>
          {[...phases].reverse().map((phase) => (
            <li key={phase.id}>
              <span>{formatDate(phase.started_at)}</span>
              <span>{phase.target_count} per day</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default Stats;
