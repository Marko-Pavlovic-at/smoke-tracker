import { useState, useEffect } from "react";
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

  return (
    <section>
      <button onClick={handleLog}>Log a cigarette</button>

      <h2>Today: {logs.length}</h2>

      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            {new Date(log.smoked_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </li>
        ))}
      </ul>

      {error && <p>{error}</p>}
    </section>
  );
}

export default Logs;
