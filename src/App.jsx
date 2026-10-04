import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Setup from "./Setup";
import Phase from "./Phase";
import Timer from "./Timer";
import Logs from "./Logs";
import Stats from "./Stats";
import Settings from "./Settings";
import { getDayStart, MS_PER_DAY } from "./dayUtils";
import { getPhaseStatus } from "./phaseStatus";
import { useNow } from "./useNow";
import "./App.css";

// Loads phases (newest first), logs of the last 31 days (newest first)
// and the time of the last cigarette ever
async function fetchData() {
  const since = new Date(Date.now() - 31 * MS_PER_DAY);

  const [phasesResult, logsResult, lastLogResult] = await Promise.all([
    supabase
      .from("phases")
      .select("*")
      .order("started_at", { ascending: false }),
    supabase
      .from("logs")
      .select("*")
      .gte("smoked_at", since.toISOString())
      .order("smoked_at", { ascending: false }),
    supabase
      .from("logs")
      .select("smoked_at")
      .order("smoked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const error = phasesResult.error || logsResult.error || lastLogResult.error;

  return {
    phases: phasesResult.data ?? [],
    logs: logsResult.data ?? [],
    lastLogAt: lastLogResult.data?.smoked_at ?? null,
    error: error ? error.message : "",
  };
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [data, setData] = useState({
    phases: [],
    logs: [],
    lastLogAt: null,
    error: "",
  });
  const [page, setPage] = useState("today");

  // re-render every minute so "today" moves on at wake time
  const now = useNow(60 * 1000);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setProfileLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchData().then(setData);
  }, [userId]);

  // after "Reset everything" in Settings: back to the setup screen
  function handleReset() {
    setProfile(null);
    setData({ phases: [], logs: [], lastLogAt: null, error: "" });
    setPage("today");
  }

  // called by the components after every change
  async function loadData() {
    setData(await fetchData());
  }

  if (loading) return <p className="center">Loading...</p>;

  if (!session) return <Login />;

  if (profileLoading) return <p className="center">Loading...</p>;

  if (!profile) return <Setup userId={userId} onSaved={setProfile} />;

  const { phases, logs, lastLogAt } = data;
  const phase = phases[0] ?? null;
  // the target before this phase (or how much you smoked at the start)
  const previousTarget = phases[1]?.target_count ?? profile.baseline_count;
  const target = phase ? phase.target_count : profile.baseline_count;

  const dayStart = getDayStart(profile.wake_time, now);
  const todayLogs = logs.filter((log) => new Date(log.smoked_at) >= dayStart);

  const status = getPhaseStatus({
    phase,
    previousTarget,
    logs,
    lastLogAt,
    wakeTime: profile.wake_time,
    now,
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smoke Tracker</h1>
        <nav className="tabs">
          <button
            className={page === "today" ? "active" : ""}
            onClick={() => setPage("today")}
          >
            Today
          </button>
          <button
            className={page === "stats" ? "active" : ""}
            onClick={() => setPage("stats")}
          >
            Stats
          </button>
          <button
            className={page === "settings" ? "active" : ""}
            onClick={() => setPage("settings")}
          >
            Settings
          </button>
        </nav>
      </header>

      {data.error && <p className="error">{data.error}</p>}

      {page === "today" && (
        <main>
          <Timer profile={profile} target={target} todayLogs={todayLogs} />
          <Logs
            profile={profile}
            target={target}
            todayLogs={todayLogs}
            onChange={loadData}
          />
          <Phase
            profile={profile}
            phase={phase}
            previousTarget={previousTarget}
            target={target}
            status={status}
            onChange={loadData}
          />
        </main>
      )}

      {page === "stats" && (
        <main>
          <Stats profile={profile} phases={phases} />
        </main>
      )}

      {page === "settings" && (
        <main>
          <Settings
            profile={profile}
            onSaved={setProfile}
            onReset={handleReset}
          />
        </main>
      )}

      <footer className="app-footer">
        <span>{session.user.email}</span>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Log out
        </button>
      </footer>
    </div>
  );
}

export default App;
