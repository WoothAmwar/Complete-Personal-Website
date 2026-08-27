import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

/**
 * The one scroll-driven section on the site.
 *
 * It exists because the product's whole argument is hard to say in a sentence
 * and trivial to show: a feed hands you a wall of everything, and this hands
 * you the few things you chose. So the wall is built for real, then most of it
 * is taken away as the reader scrolls, and the headline changes underneath.
 * The motion is the argument, which is the only reason to pin a section.
 *
 * Under prefers-reduced-motion nothing is pinned and the section renders its
 * resolved state, so the point still lands without any scroll hijacking.
 */

const COLUMNS = 6;
const ROWS = 3;
const TILE_COUNT = COLUMNS * ROWS;

/** The tiles that survive the filter. Scattered, not a neat block. */
const SIGNAL = new Set([3, 7, 10, 14, 16]);

export function FilterStory() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const tiles = useMemo(
    () =>
      Array.from({ length: TILE_COUNT }, (_, index) => ({
        index,
        signal: SIGNAL.has(index),
        // Seeded so the wall is identical on every render and between sessions.
        src: `https://picsum.photos/seed/pm-wall-${index}/320/180`,
        // Drawn under the image. Photography is remote and may be slow or
        // blocked, and a grid of empty rectangles would break the whole point
        // of the section, so every tile keeps a tint of its own to fall back
        // to. Built from surface tokens rather than fixed colors, so it stays
        // neutral in both themes instead of leaving dark plates on a light page.
        tint: `linear-gradient(${140 + ((index * 23) % 80)}deg, var(--bg-hover), var(--bg-inset))`,
      })),
    []
  );

  useEffect(() => {
    const node = wrapper.current;
    if (!node || reduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: "+=1100",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(
          "[data-tile='noise']",
          {
            opacity: 0.04,
            scale: 0.86,
            duration: 1,
            ease: "power2.inOut",
            // Random order, so the wall thins out rather than wiping.
            stagger: { amount: 0.55, from: "random" },
          },
          0
        )
        .to(
          "[data-tile='signal']",
          { scale: 1.06, duration: 1, ease: "power2.inOut" },
          0.1
        )
        // The two headlines overlap deliberately. Sequenced back to back there
        // is a stretch of scroll with no text at all, and the section reads as
        // a wall of photos with a caption missing.
        .to("[data-copy='before']", { opacity: 0, y: -20, duration: 0.35 }, 0.05)
        .fromTo(
          "[data-copy='after']",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.35 },
          0.3
        );
    }, node);

    return () => context.revert();
  }, [reduced]);

  return (
    <div
      ref={wrapper}
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden pb-16 pt-28"
    >
      <div className="relative">
        {/* Both headlines occupy the same space; the scrub crossfades them. */}
        <div className="relative mx-auto mb-10 h-[8.5rem] max-w-3xl text-center sm:mb-12 sm:h-[9.5rem]">
          <div
            data-copy="before"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={reduced ? { opacity: 0 } : undefined}
          >
            <h2 className="font-display text-[clamp(1.9rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
              A feed shows you everything.
            </h2>
            <p className="text-ink-muted">Most of it from channels you never chose.</p>
          </div>

          <div
            data-copy="after"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={reduced ? undefined : { opacity: 0 }}
          >
            <h2 className="font-display text-[clamp(1.9rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
              This shows you what you chose.
            </h2>
            <p className="text-ink-muted">Your subscriptions. Filtered in the order you want them.</p>
          </div>
        </div>

        <div
          className={`grid gap-2 sm:gap-3 ${reduced ? "" : "fade-to-canvas"}`}
          style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          {tiles.map((tile) => (
            <div
              key={tile.index}
              data-tile={tile.signal ? "signal" : "noise"}
              className={
                "relative aspect-video overflow-hidden rounded-[6px] bg-inset sm:rounded-[10px] " +
                (tile.signal ? "ring-1 ring-accent" : "")
              }
              style={{
                backgroundImage: tile.tint,
                ...(reduced && !tile.signal ? { opacity: 0.12 } : null),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tile.src}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
