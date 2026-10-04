import { useState, useEffect } from "react";

// Returns the current time and re-renders the component every `ms` milliseconds
export function useNow(ms) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);

  return now;
}
