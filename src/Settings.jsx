import { useState } from "react";
import { supabase } from "./supabaseClient";

function Settings({ profile, onSaved, onReset }) {
  const [packPrice, setPackPrice] = useState(String(profile.pack_price));
  // Supabase gives "06:00:00", the time input wants "06:00"
  const [wakeTime, setWakeTime] = useState(profile.wake_time.slice(0, 5));
  const [sleepTime, setSleepTime] = useState(profile.sleep_time.slice(0, 5));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        pack_price: Number(packPrice),
        wake_time: wakeTime,
        sleep_time: sleepTime,
      })
      .eq("id", profile.id)
      .select()
      .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }

    // no row came back = Row Level Security didn't allow the update
    if (!data) {
      setError(
        "Couldn't save. The profiles table needs an update policy in Supabase.",
      );
      return;
    }

    onSaved(data);
    setSaved(true);
  }

  // Deletes all logs, phases and the profile, so the app starts again at Setup
  async function handleReset() {
    setResetError("");
    setResetting(true);

    const logsResult = await supabase
      .from("logs")
      .delete()
      .eq("user_id", profile.id);
    const phasesResult = await supabase
      .from("phases")
      .delete()
      .eq("user_id", profile.id);
    const profileResult = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile.id)
      .select();

    setResetting(false);

    const error = logsResult.error || phasesResult.error || profileResult.error;
    if (error) {
      setResetError(error.message);
      return;
    }

    // no row came back = Row Level Security didn't allow deleting the profile
    if (profileResult.data.length === 0) {
      setResetError(
        "Logs and targets were deleted, but not the profile. The profiles table needs a delete policy in Supabase.",
      );
      return;
    }

    onReset();
  }

  return (
    <>
      <section className="card">
        <h2>Settings</h2>

        <form onSubmit={handleSubmit}>
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

          {saved && <p className="success">Saved.</p>}
          {error && <p className="error">{error}</p>}
        </form>

        <p className="muted">
          You started at {profile.baseline_count} cigarettes a day. Money saved
          is always calculated with the current pack price.
        </p>
      </section>

      <section className="card danger-zone">
        <h2>Start over</h2>
        <p className="muted">
          Deletes all your logged cigarettes, targets and settings. You start
          again at the setup screen.
        </p>

        {confirmReset ? (
          <>
            <p className="error">
              Are you sure? This deletes everything and can't be undone.
            </p>
            <div className="button-row">
              <button
                className="danger-button"
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting ? "Deleting..." : "Yes, delete everything"}
              </button>
              <button
                className="secondary-button"
                onClick={() => setConfirmReset(false)}
                disabled={resetting}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            className="danger-button"
            onClick={() => setConfirmReset(true)}
          >
            Reset everything
          </button>
        )}

        {resetError && <p className="error">{resetError}</p>}
      </section>
    </>
  );
}

export default Settings;
