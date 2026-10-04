import { useState, useEffect, use } from "react";
import { supabase } from "./supabaseClient";

// The day starts at wake time, not midnight.
// Before wake time (e.g. 01:00), the day started yesterday at wake time.
function getDayStart(wakeTime) {
  const [hours, minutes] = wakeTime.split(":").map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);

  if (new Date() < start) {
    start.setDate(start.getDate() - 1);
  }

  return start;
}

function Logs({ profile }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [pastTime, setPastTime] = useState("");

  useEffect(() => {
    const dayStart = getDayStart(profile.wake_time);

    supabase
      .from("logs")
      .select("*")
      .gte("smoked_at", dayStart.toISOString())
      .order("smoked_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setLogs(data);
      });
  }, [profile.wake_time]);

  async function handleLog() {
    setError("");

    const { data, error } = await supabase
      .from("logs")
      .insert({ smoked_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setLogs([data, ...logs]);
  }

  async function handleDelete(id) {
    setError("");

    const { error } = await supabase.from("logs").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setLogs(logs.filter((log) => log.id !== id));
  }

  async function handleAddPast(e) {
    e.preventDefault();
    setError("");

    const [hours, minutes] = pastTime.split(":").map(Number);
    const smokedAt = new Date();
    smokedAt.setHours(hours, minutes, 0, 0);

    // A time later than now must mean yesterday (e.g. it's 01:00 and you enter 23:30)
    if (smokedAt > new Date()) {
      smokedAt.setDate(smokedAt.getDate() - 1);
    }

    const { data, error } = await supabase
      .from("logs")
      .insert({ smoked_at: smokedAt.toISOString() })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    // newest first, same order as the list from Supabase
    const newLogs = [...logs, data].sort(
      (a, b) => new Date(b.smoked_at) - new Date(a.smoked_at),
    );
    setLogs(newLogs);
    setPastTime("");
  }
  const savedToday =
    (profile.baseline_count - logs.length) * (profile.pack_price / 20);

  return (
    <section>
      <button onClick={handleLog}>Log a cigarette</button>

      <form onSubmit={handleAddPast}>
        <label>
          Forgot one? Time
          <input
            type="time"
            value={pastTime}
            onChange={(e) => setPastTime(e.target.value)}
            required
          />
        </label>
        <button type="submit">Add</button>
      </form>

      <h2>Today: {logs.length}</h2>
      <p>Saved today: {savedToday.toFixed(2)} €</p>

      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            {new Date(log.smoked_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <button onClick={() => handleDelete(log.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {error && <p>{error}</p>}
    </section>
  );
}

export default Logs;
