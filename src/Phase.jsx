import { useState } from "react";
import { supabase } from "./supabaseClient";
import { formatDate } from "./dayUtils";
import { PHASE_DAYS, QUIT_SUCCESS_DAYS } from "./phaseStatus";

function Phase({ profile, phase, previousTarget, target, status, onChange }) {
  const [newTarget, setNewTarget] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const value = Number(newTarget);
    if (value >= target) {
      setError(`Pick a number below ${target}.`);
      return;
    }

    const { error } = await supabase
      .from("phases")
      .insert({ target_count: value });

    if (error) {
      setError(error.message);
      return;
    }

    setNewTarget("");
    onChange();
  }

  const targetForm = (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label>
        New target per day
        <input
          type="number"
          min="0"
          max={target - 1}
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
          required
        />
      </label>
      <button type="submit">Set target</button>
    </form>
  );

  // no phase yet: pick the first target
  if (!phase) {
    return (
      <section className="card">
        <h2>Your target</h2>
        <p>
          Right now you smoke {profile.baseline_count} a day. Pick a lower
          number to start with. You can lower it again after {PHASE_DAYS} days.
        </p>
        {targetForm}
        {error && <p className="error">{error}</p>}
      </section>
    );
  }

  // target 0: count smoke-free days
  if (status.isQuitMode) {
    return (
      <section className="card">
        <h2>Smoke-free</h2>
        {status.quitSuccess ? (
          <p className="success">
            {status.smokeFreeDays} days without a cigarette. You did it! 🎉
          </p>
        ) : (
          <>
            <p className="stat-number">
              {status.smokeFreeDays}
              <span className="stat-of"> / {QUIT_SUCCESS_DAYS} days</span>
            </p>
            <progress value={status.smokeFreeDays} max={QUIT_SUCCESS_DAYS} />
            <p className="muted">
              {QUIT_SUCCESS_DAYS} days without a cigarette is the goal. Any
              cigarette starts the count over.
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Target: {phase.target_count} per day</h2>
      <p className="muted">Since {formatDate(phase.started_at)}</p>

      {status.restartsTomorrow ? (
        <p className="warning">
          You smoked {previousTarget} or more today (your old target). The{" "}
          {PHASE_DAYS} days start over tomorrow.
        </p>
      ) : status.canLower ? (
        <>
          <p className="success">
            {PHASE_DAYS} days done. You can lower your target now.
          </p>
          {targetForm}
        </>
      ) : (
        <>
          <progress value={status.daysDone} max={PHASE_DAYS} />
          <p className="muted">
            Day {status.daysDone + 1} of {PHASE_DAYS}. Smoking {previousTarget}{" "}
            or more in one day restarts the {PHASE_DAYS} days.
          </p>
        </>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default Phase;
