import { useMemo } from "react";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useQueue } from "@/components/queue/QueueProvider";
import { VideoBox } from "./VideoBox";
import { Skeleton } from "@/components/ui/primitives";

/**
 * The queue rail.
 *
 * Behaves like the "next up" panel in a player: it stays beside the feed, the
 * first entry is what plays next, and each entry can be dropped without
 * leaving the page. Rows animate out on removal so it is obvious which one
 * went; that is the only motion here, and it collapses under reduced motion.
 */
export default function VideoQueue({
  fullVideoDetails,
  isLoading,
}: {
  fullVideoDetails: Array<Array<any>>;
  isLoading: boolean;
}) {
  const queue = useQueue();
  const reduce = useReducedMotion();

  // The queue stores ids; the details come from the videos already loaded for
  // the feed, so this costs no extra request.
  const detailsById = useMemo(() => {
    const map = new Map<string, any>();
    (fullVideoDetails ?? []).forEach((group) => {
      (group ?? []).forEach((details) => {
        if (details?.["videoId"]) map.set(details["videoId"], details);
      });
    });
    return map;
  }, [fullVideoDetails]);

  const entries = useMemo(
    () =>
      queue.ids
        .map((id) => ({ id, details: detailsById.get(id) }))
        .filter((entry) => entry.details),
    [queue.ids, detailsById]
  );

  if (isLoading || queue.status === "loading") {
    return (
      <div className="flex flex-col gap-3 p-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-2.5">
            <Skeleton className="aspect-video w-[104px] shrink-0" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-ink">The queue is empty</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          Use the menu on any video to add it, or describe what you feel like
          watching in the box below.
        </p>
      </div>
    );
  }

  const [first, ...rest] = entries;

  return (
    <div className="flex flex-col">
      {/* Next up is separated out, because it is the one the arrows under the
          player will take you to. */}
      <div className="border-b border-line-subtle p-3">
        {/* <Link
          href={`/custom-youtube/${first.id}`}
          className="group flex items-start gap-2.5"
        >
          <span className="relative aspect-video w-[104px] shrink-0 overflow-hidden rounded-control bg-inset">
            <img
              src={first.details["videoThumbnail"]}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <PlayIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-accent">
              Next up
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[13px] font-medium leading-snug text-ink">
              {first.details["videoTitle"]}
            </span>
          </span>
        </Link> */}
        <span className="block text-[11px] font-medium uppercase tracking-wide text-accent">
          Next up
        </span>
        <VideoBox
          includeDate={false}
          layout="row"
          fullVideoDetails={first.details}
          onRemove={() => queue.remove(first.id)}
        />
      </div>

      <div className="flex flex-col gap-3.5 p-3">
        <AnimatePresence initial={false}>
          {rest.map((entry) => (
            <motion.div
              key={entry.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? undefined : { opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <VideoBox
                includeDate={false}
                layout="row"
                fullVideoDetails={entry.details}
                onRemove={() => queue.remove(entry.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
