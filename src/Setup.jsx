import { useState } from "react";
import { supabase } from "./supabaseClient";

function Setup({ userId, onSaved }) {
  const [baselineCount, setBaselineCount] = useState("");
  const [packPrice, setPackPrice] = useState("");
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        baseline_count: Number(baselineCount),
        pack_price: Number(packPrice),
        wake_time: wakeTime,
        sleep_time: sleepTime,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Setup</h1>

      <label>
        Cigarettes per day right now
        <input
          type="number"
          min="1"
          value={baselineCount}
          onChange={(e) => setBaselineCount(e.target.value)}
          required
        />
      </label>

      <label>
        Price per pack (20 cigarettes) in €
        <input
          type="number"
          min="0"
          step="0.01"
          value={packPrice}
          onChange={(e) => setPackPrice(e.target.value)}
          required
        />
      </label>

      <label>
        Wake up time
        <input
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          required
        />
      </label>

      <label>
        Sleep time
        <input
          type="time"
          value={sleepTime}
          onChange={(e) => setSleepTime(e.target.value)}
          required
        />
      </label>

      <button type="submit">Save</button>

      {error && <p>{error}</p>}
    </form>
  );
}

export default Setup;
