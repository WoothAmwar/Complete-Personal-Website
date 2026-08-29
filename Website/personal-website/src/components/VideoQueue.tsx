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
 *
 * Every entry carries its own title and thumbnail, so this renders whatever is
 * in the queue and takes no props. It used to look each id up in the videos
 * loaded for the feed, which meant a video dropped from the database - the
 * feed only keeps the three newest per channel - disappeared from the rail
 * while still counting towards the badge beside the heading.
 */
export default function VideoQueue() {
  const queue = useQueue();
  const reduce = useReducedMotion();

  if (queue.status === "loading") {
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

  if (queue.entries.length === 0) {
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

  const [first, ...rest] = queue.entries;

  return (
    <div className="flex flex-col">
      {/* Next up is separated out, because it is the one the arrows under the
          player will take you to. */}
      <div className="border-b border-line-subtle p-3">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-accent">
          Next up
        </span>
        <VideoBox
          includeDate={false}
          layout="row"
          fullVideoDetails={first}
          onRemove={() => queue.remove(first.videoId)}
        />
      </div>

      <div className="flex flex-col gap-3.5 p-3">
        <AnimatePresence initial={false}>
          {rest.map((entry) => (
            <motion.div
              key={entry.videoId}
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
                fullVideoDetails={entry}
                onRemove={() => queue.remove(entry.videoId)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
