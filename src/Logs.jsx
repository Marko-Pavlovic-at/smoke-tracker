import { useState } from "react";
import { supabase } from "./supabaseClient";
import { getDayStart, formatTime, formatMoney } from "./dayUtils";

function Logs({ profile, target, todayLogs, onChange }) {
  const [pastTime, setPastTime] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveLog(smokedAt) {
    setError("");
    setNotice("");
    setSaving(true);

    const { error } = await supabase
      .from("logs")
      .insert({ smoked_at: smokedAt.toISOString() });

    if (error) {
      setError(error.message);
      setSaving(false);
      return false;
    }

    await onChange();
    setSaving(false);
    return true;
  }

  function handleLog() {
    saveLog(new Date());
  }

  async function handleAddPast(e) {
    e.preventDefault();

    const [hours, minutes] = pastTime.split(":").map(Number);
    const smokedAt = new Date();
    smokedAt.setHours(hours, minutes, 0, 0);

    // A time later than now must mean yesterday (e.g. it's 01:00 and you enter 23:30)
    if (smokedAt > new Date()) {
      smokedAt.setDate(smokedAt.getDate() - 1);
    }

    const saved = await saveLog(smokedAt);
    if (!saved) return;

    setPastTime("");
    if (smokedAt < getDayStart(profile.wake_time)) {
      setNotice("Saved. It was before your wake time, so it counts towards yesterday.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this cigarette?")) return;
    setError("");
    setNotice("");

    const { error } = await supabase.from("logs").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    onChange();
  }

  const count = todayLogs.length;
  const savedToday =
    (profile.baseline_count - count) * (profile.pack_price / 20);

  return (
    <section className="card">
      <button className="big-button" onClick={handleLog} disabled={saving}>
        {saving ? "Saving..." : "Log a cigarette"}
      </button>

      <div className="today-stats">
        <div>
          <p className="stat-number">
            {count}
            <span className="stat-of"> / {target}</span>
          </p>
          <p className="stat-label">smoked today</p>
        </div>
        <div>
          <p className="stat-number">{formatMoney(savedToday)}</p>
          <p className="stat-label">saved today</p>
        </div>
      </div>

      {target > 0 && count > target && (
        <p className="warning">
          You're {count - target} over your target of {target} today.
        </p>
      )}
      {target > 0 && count === target && (
        <p className="info">That was your last one for today.</p>
      )}
      {target === 0 && count > 0 && (
        <p className="warning">
          You smoked today, so the smoke-free counter started over.
        </p>
      )}

      <ul className="log-list">
        {todayLogs.map((log) => (
          <li key={log.id}>
            <span>{formatTime(log.smoked_at)}</span>
            <button className="link danger" onClick={() => handleDelete(log.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form className="inline-form" onSubmit={handleAddPast}>
        <label>
          Forgot one?
          <input
            type="time"
            value={pastTime}
            onChange={(e) => setPastTime(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={saving}>
          Add
        </button>
      </form>

      {notice && <p className="info">{notice}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default Logs;
