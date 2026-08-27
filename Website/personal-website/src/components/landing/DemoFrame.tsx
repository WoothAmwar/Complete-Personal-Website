import { useState } from "react";

/**
 * The demo slot on the landing page.
 *
 * Drop a screen recording at `public/demo/pure-media.mp4` (and optionally a
 * still at `public/demo/pure-media-poster.jpg`) and it plays here, muted and
 * looping, as the page's main visual. A `.gif` works too: pass its path as
 * `src`.
 *
 * The recording is presented flat, with a single hairline and no window chrome.
 * A drawn browser frame with traffic-light dots is a stand-in for a real
 * screenshot, and reads as one.
 *
 * Until the file exists the frame renders at the exact final dimensions, so the
 * layout does not shift when the recording lands.
 */
export function DemoFrame({
  src = "/demo/pure-media.mp4",
  poster = "/demo/pure-media-poster.jpg",
}: {
  src?: string;
  poster?: string;
}) {
  const [available, setAvailable] = useState(true);
  const isImage = /\.(gif|png|jpe?g|webp|avif)$/i.test(src);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-surface border border-line-subtle bg-surface">
      {available ? (
        isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Pure Media, showing subscriptions grouped by channel next to the play queue"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setAvailable(false)}
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setAvailable(false)}
            aria-label="Pure Media, showing subscriptions grouped by channel next to the play queue"
          />
        )
      ) : (
        <div className="absolute inset-0">
          {/* A reserved slot should look reserved. The faint rule grid gives
              the frame something to be, so an empty hero does not read as a
              hole in the page while the recording is still being made. */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 45%, var(--accent-soft), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-muted">
              Walkthrough
            </p>
            <p className="max-w-sm text-sm text-ink-muted">
              Add a recording at{" "}
              <span className="font-mono text-ink-soft">public/demo/pure-media.mp4</span>{" "}
              and it plays here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
