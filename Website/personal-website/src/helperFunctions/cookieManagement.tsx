import { useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified: boolean;
}

/**
 * The signed-in user, read from the `profile` cookie.
 *
 * The result is memoised against the cookie contents. Returning a fresh object
 * on every render would make this unusable as a `useEffect` dependency: the
 * effect would see a new identity each pass, and any `setState` holding the
 * object would never bail out, so the component would re-render forever.
 */
export function CurrentUserCookieInfo(): UserInfo | null {
  const [cookies] = useCookies(["profile"]);
  const profile = cookies.profile;

  // Serialised rather than joined, so a value containing a space (a display
  // name, most obviously) survives the round trip intact.
  const identity = Array.isArray(profile) ? JSON.stringify(profile) : "";

  return useMemo(() => {
    if (!identity) return null;
    const parts = JSON.parse(identity) as unknown[];
    return {
      id: String(parts[0] ?? ""),
      email: String(parts[1] ?? ""),
      name: String(parts[2] ?? ""),
      picture: String(parts[3] ?? ""),
      verified: Boolean(parts[4]),
    };
  }, [identity]);
}

export function CurrentUserId(): string {
  const [cookies] = useCookies(["profile"]);
  return Array.isArray(cookies.profile) ? String(cookies.profile[0] ?? "") : "";
}

/**
 * False during the server render and the first client render, true afterwards.
 *
 * Cookies are only readable in the browser, so anything that branches on the
 * signed-in user has to wait for hydration or React will warn about a mismatch.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
