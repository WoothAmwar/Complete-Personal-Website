import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";

import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { fetchWithRetry } from "@/helperFunctions/fetchWithRetry";
import { useQueue } from "@/components/queue/QueueProvider";
import { cx } from "@/components/ui/primitives";

/* ==========================================================================
   Queue navigation
   ========================================================================== */

/**
 * Steps through the queue from wherever you are.
 *
 * If the video being watched is in the queue, the arrows are its neighbours.
 * If it is not (a video opened from the tracker, say), forward starts the
 * queue from the top and back is unavailable. Only the arrows live here: the
 * queue itself is shown on the subscriptions page.
 */
function QueueNavigation({ videoId }: { videoId: string }) {
  const queue = useQueue();

  const { previousId, nextId, position } = useMemo(() => {
    const index = queue.ids.indexOf(videoId);
    if (index === -1) {
      return {
        previousId: null,
        nextId: queue.ids[0] ?? null,
        position: null as string | null,
      };
    }
    return {
      previousId: index > 0 ? queue.ids[index - 1] : null,
      nextId: index < queue.ids.length - 1 ? queue.ids[index + 1] : null,
      position: `${index + 1} of ${queue.ids.length}`,
    };
  }, [queue.ids, videoId]);

  const buttonClass =
    "inline-flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-4 " +
    "text-[13px] font-medium text-ink transition-colors duration-200 ease-pm " +
    "hover:border-line-strong hover:bg-hovered active:translate-y-px";

  const disabledClass =
    "inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-control border border-line-subtle " +
    "bg-inset px-4 text-[13px] font-medium text-ink-muted";

  return (
    <nav
      aria-label="Queue navigation"
      className="flex items-center justify-between gap-3"
    >
      {previousId ? (
        <Link href={`/custom-youtube/${previousId}`} className={buttonClass}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Previous
        </span>
      )}

      <span className="flex items-center gap-2 text-[12px] text-ink-muted">
        <QueueListIcon className="h-4 w-4" aria-hidden="true" />
        {position ? (
          <span className="font-mono">{position}</span>
        ) : queue.ids.length > 0 ? (
          <span>Not in the queue</span>
        ) : (
          <span>The queue is empty</span>
        )}
      </span>

      {nextId ? (
        <Link href={`/custom-youtube/${nextId}`} className={buttonClass}>
          Next
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Next
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}

/* ==========================================================================
   Player
   ========================================================================== */

export default function VideoScreen() {
  const router = useRouter();
  const videoId = router.query.videoId?.toString();
  const currentUserGoogleId = CurrentUserId();
  const queue = useQueue();

  const [title, setTitle] = useState("Video");
  const [finished, setFinished] = useState(false);

  // A queued video carries its own title, so it reads correctly even once the
  // video has aged out of the database and the lookups below find nothing.
  useEffect(() => {
    if (!videoId) return;
    const queued = queue.entries.find((entry) => entry.videoId === videoId);
    if (queued) setTitle(queued.videoTitle);
  }, [queue.entries, videoId]);

  const playerRef = useRef<any>(null);

  // Title lookup, unchanged: subscriptions first, then the tracker.
  useEffect(() => {
    if (!videoId || !currentUserGoogleId) return;
    let cancelled = false;

    const headers = {
      "Content-Type": "application/json",
      "x-google-id": currentUserGoogleId.toString(),
    };

    (async () => {
      try {
        const videos = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/videos`, {
          method: "GET",
          mode: "cors",
          headers,
        }).then((response) => response.json());

        for (const group of videos ?? []) {
          for (const video of group ?? []) {
            if (video?.videoId === videoId) {
              if (!cancelled) setTitle(video.videoTitle);
              return;
            }
          }
        }

        const tracked = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/tracker`, {
          method: "GET",
          mode: "cors",
          headers,
        }).then((response) => response.json());

        for (const video of tracked ?? []) {
          if (video?.videoID === videoId) {
            if (!cancelled) setTitle(video.videoTitle);
            return;
          }
        }
      } catch (err) {
        console.error("Could not look up the video title", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserGoogleId, videoId]);

  // Build the YouTube player once per video.
  useEffect(() => {
    if (!videoId) return;
    setFinished(false);

    let cancelled = false;

    const createPlayer = () => {
      if (cancelled) return;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new (window as any).YT.Player("player", {
        // The stage sizes the iframe in CSS, so the player never has to be
        // measured or resized from here.
        height: "100%",
        width: "100%",
        videoId,
        playerVars: { playsinline: 1 },
        events: {
          onReady: (event: any) => event.target.playVideo(),
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              setFinished(true);
            }
          },
        },
      });
    };

    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);

      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="mx-auto max-w-content px-4 py-24 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          No video selected
        </h1>
        <p className="mt-2 text-ink-muted">
          Open a video from your subscriptions or your tracker.
        </p>
        <Link
          href="/custom-youtube"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to subscriptions
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="mx-auto flex w-full max-w-content flex-col gap-5 px-4 py-6 sm:px-6">
        {/* The stage caps its own height so the title and the queue arrows are
            always on screen with the video, whatever the window shape. The
            iframe fills it in CSS.
            Note: sizing it from measured pixels raced the
            player's own creation, and it lost whenever the YouTube API had to
            be fetched first, leaving a small player in the corner until the
            window was resized. */}
        <div
          className="mx-auto aspect-video w-full overflow-hidden rounded-surface bg-black [&>iframe]:h-full [&>iframe]:w-full"
          style={{ maxWidth: "calc((100dvh - 8rem) * 16 / 9)" }}
        >
          <div id="player" />
        </div>

        {/* <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span
            className={cx(
              "text-[12px] transition-opacity duration-300",
              finished ? "text-ink-muted opacity-100" : "opacity-0"
            )}
            aria-live="polite"
          >
            {finished ? "Finished" : ""}
          </span>
        </div> */}

        <div className="border-t border-line-subtle pt-4">
          <QueueNavigation videoId={videoId} />
        </div>

        <Link
          href="/custom-youtube"
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to subscriptions
        </Link>
      </div>
    </>
  );
}
