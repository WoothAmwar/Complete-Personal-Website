import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, SparklesIcon } from "@heroicons/react/20/solid";

import { useQueue } from "@/components/queue/QueueProvider";
import { cx } from "@/components/ui/primitives";

/** How long the form stays locked after a send, so a double tap cannot fire twice. */
const COOLDOWN_MS = 4000;

type SendState = "idle" | "sending" | "sent" | "failed";

const STATUS_COPY: Record<Exclude<SendState, "idle">, string> = {
  sending: "On it...",
  sent: "On it. The queue updates when the agent finishes.",
  failed: "That did not reach the agent. Try again.",
};

/**
 * Hands a plain-language request to the queue agent.
 *
 * The moment Enter is pressed the box locks, the button turns into a status
 * line, and both stay that way through a short cooldown. That gap is the whole
 * point: the agent works in the background, so without it there is nothing to
 * tell you the request was heard.
 */
export function AgentPrompt() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const queue = useQueue();
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const locked = state === "sending" || state === "sent";

  const send = async () => {
    const text = prompt.trim();
    if (!text || locked) return;

    setState("sending");
    try {
      const response = await fetch("/api/queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: text }),
      });
      if (!response.ok) throw new Error(`Agent request failed: ${response.status}`);

      setPrompt("");
      setState("sent");
      // The agent writes to the queue out of band, so pull the list again once
      // it has had a moment to run.
      timers.current.push(setTimeout(() => queue.refresh(), COOLDOWN_MS - 500));
      timers.current.push(setTimeout(() => setState("idle"), COOLDOWN_MS));
    } catch (err) {
      console.error("Could not reach the queue agent", err);
      setState("failed");
      timers.current.push(setTimeout(() => setState("idle"), COOLDOWN_MS));
    }
  };

  return (
    <form
      className="border-t border-line-subtle p-3"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label htmlFor="agent-prompt" className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
        <SparklesIcon className="h-4 w-4 text-accent" aria-hidden="true" />
        Fill the queue
      </label>

      <div
        className={cx(
          "mt-2 rounded-control border bg-surface transition-colors duration-200 ease-pm",
          locked ? "border-line-subtle opacity-70" : "border-line focus-within:border-accent"
        )}
      >
        <textarea
          id="agent-prompt"
          rows={2}
          value={prompt}
          disabled={locked}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends. Shift and Enter keeps writing.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Two short gaming videos and something about cooking"
          className="w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
          <span
            className={cx(
              "text-[12px]",
              state === "failed" ? "text-danger" : "text-ink-muted"
            )}
            role={state === "idle" ? undefined : "status"}
            aria-live="polite"
          >
            {state === "idle" ? "Enter to send" : STATUS_COPY[state]}
          </span>

          <button
            type="submit"
            disabled={locked || prompt.trim().length === 0}
            aria-label="Send to the agent"
            className={cx(
              "flex h-7 w-7 items-center justify-center rounded-control",
              "bg-accent text-accent-contrast transition-all duration-200 ease-pm",
              "hover:bg-accent-hover active:translate-y-px",
              "disabled:pointer-events-none disabled:bg-inset disabled:text-ink-muted"
            )}
          >
            <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  );
}
