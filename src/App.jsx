import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Setup from "./Setup"; // NEW
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // NEW
  const [profileLoading, setProfileLoading] = useState(true); // NEW

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

  // NEW: load the profile once we know who is logged in
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

  if (loading) return <p>Loading...</p>;

  if (!session) return <Login />;

  // NEW
  if (profileLoading) return <p>Loading...</p>;

  // NEW
  if (!profile)
    return (
      <Setup
        userId={userId}
        onSaved={setProfile}
      />
    );

  return (
    <div>
      <p>Logged in as {session.user.email}</p>
      {/* NEW: temporary, just to see the saved data */}
      <p>Baseline: {profile.baseline_count} per day</p>
      <p>Pack price: {profile.pack_price} €</p>
      <p>
        Day: {profile.wake_time} – {profile.sleep_time}
      </p>
      <button onClick={() => supabase.auth.signOut()}>Log out</button>
    </div>
  );
}

export default App;
