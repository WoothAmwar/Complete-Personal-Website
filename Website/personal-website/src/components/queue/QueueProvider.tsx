import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Single source of truth for the play queue.
 *
 * Everything that touches the queue goes through here: the overflow menu on a
 * video card, the queue rail on the YouTube page, and the previous/next arrows
 * under the player. That way an add made in one place is reflected everywhere
 * without a page reload.
 *
 * The API contract is unchanged from before this provider existed:
 *   GET    /api/queue                 -> { queue_list: string[] }
 *   POST   /api/queue  { data: id }   -> append to the queue
 *   DELETE /api/queue  { data: id }   -> remove one occurrence
 *   PUT    /api/queue  { data: text } -> hand a prompt to the agent
 * The route reads the caller from the `profile` cookie, so no headers are added.
 */

type QueueStatus = "idle" | "loading" | "ready" | "error";

interface QueueContextValue {
  /** Ordered video ids, first is next up. */
  ids: string[];
  status: QueueStatus;
  has: (videoId: string) => boolean;
  add: (videoId: string) => Promise<void>;
  remove: (videoId: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Whether the queue rail is showing. Persisted per browser. */
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  /** Ids the user just acted on, so buttons can show in-flight state. */
  pending: ReadonlySet<string>;
}

const PANEL_KEY = "pm-queue-panel";  // used to check state of if open or closed

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [status, setStatus] = useState<QueueStatus>("idle");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpenState] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PANEL_KEY);
      if (stored === "closed") setPanelOpenState(false);
    } catch {
      /* Storage unavailable: the panel just starts open. */
    }
  }, []);

  const setPanelOpen = useCallback((open: boolean) => {
    setPanelOpenState(open);
    try {
      window.localStorage.setItem(PANEL_KEY, open ? "open" : "closed");
    } catch {
      /* Not persisting is fine. */
    }
  }, []);

  const refresh = useCallback(async () => {
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      const response = await fetch("/api/queue");
      if (!response.ok) {
        // 401 simply means nobody is signed in yet on this page.
        if (mounted.current) setStatus(response.status === 401 ? "ready" : "error");
        return;
      }
      const data = await response.json();
      if (!mounted.current) return;
      setIds(Array.isArray(data?.queue_list) ? data.queue_list.map(String) : []);
      setStatus("ready");
    } catch (err) {
      console.error("Could not read the queue", err);
      if (mounted.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markPending = useCallback((videoId: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(videoId);
      else next.delete(videoId);
      return next;
    });
  }, []);

  const add = useCallback(
    async (videoId: string) => {
      if (!videoId) return;
      markPending(videoId, true);
      // Optimistic: the card flips to "queued" immediately, and we reconcile
      // against the server list right after.
      setIds((prev) => (prev.includes(videoId) ? prev : [...prev, videoId]));
      try {
        const response = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: videoId }),
        });
        if (!response.ok) throw new Error(`Queue add failed: ${response.status}`);
        await refresh();
      } catch (err) {
        console.error("Could not add to the queue", err);
        setIds((prev) => prev.filter((id) => id !== videoId));
      } finally {
        markPending(videoId, false);
      }
    },
    [markPending, refresh]
  );

  const remove = useCallback(
    async (videoId: string) => {
      if (!videoId) return;
      markPending(videoId, true);
      const snapshot = ids;
      setIds((prev) => {
        const index = prev.indexOf(videoId);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
      try {
        const response = await fetch("/api/queue", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: videoId }),
        });
        if (!response.ok) throw new Error(`Queue remove failed: ${response.status}`);
        await refresh();
      } catch (err) {
        console.error("Could not remove from the queue", err);
        setIds(snapshot);
      } finally {
        markPending(videoId, false);
      }
    },
    [ids, markPending, refresh]
  );

  const has = useCallback((videoId: string) => ids.includes(videoId), [ids]);

  const value = useMemo(
    () => ({
      ids,
      status,
      has,
      add,
      remove,
      refresh,
      panelOpen,
      setPanelOpen,
      pending,
    }),
    [ids, status, has, add, remove, refresh, panelOpen, setPanelOpen, pending]
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue(): QueueContextValue {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used inside a QueueProvider");
  }
  return context;
}
