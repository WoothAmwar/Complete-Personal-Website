import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { animate, stagger } from "animejs";

import LoginButton from "@/components/buttons/LoginButton";
import { DemoFrame } from "./DemoFrame";

// three.js and the shader stay out of the initial bundle and off the server.
const ShaderBackdrop = dynamic(() => import("./ShaderBackdrop"), { ssr: false });

/** Split so each line can be revealed on its own beat. */
const HEADLINE = ["Watch what you", "subscribed to.", "Nothing else."];

/**
 * Landing hero.
 *
 * One orchestrated moment, and the only place on the site where anything is
 * choreographed on load. anime.js drives it because the effect is a per-line
 * mask reveal with a shared easing curve, which is exactly what its stagger
 * primitive is for. The shader canvas underneath is a separate subtree with no
 * other animation library inside it.
 *
 * Under prefers-reduced-motion the timeline never runs and every element is
 * already in its final position, so nothing depends on the animation finishing.
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lines = node.querySelectorAll<HTMLElement>("[data-line-inner]");
    const rest = node.querySelectorAll<HTMLElement>("[data-hero-reveal]");

    // Elements start hidden only once JS has confirmed it will animate them, so
    // a failed script leaves readable content rather than a blank hero.
    lines.forEach((line) => {
      line.style.transform = "translateY(110%)";
      line.style.opacity = "0";
    });
    rest.forEach((element) => {
      element.style.transform = "translateY(14px)";
      element.style.opacity = "0";
    });

    const headline = animate(lines, {
      translateY: ["110%", "0%"],
      opacity: [0, 1],
      duration: 900,
      delay: stagger(90),
      ease: "cubicBezier(0.16, 1, 0.3, 1)",
    });

    const supporting = animate(rest, {
      translateY: ["14px", "0px"],
      opacity: [0, 1],
      duration: 700,
      delay: stagger(90, { start: 380 }),
      ease: "cubicBezier(0.16, 1, 0.3, 1)",
    });

    return () => {
      headline.pause();
      supporting.pause();
    };
  }, []);

  return (
    <section ref={scope} className="relative isolate">
      <ShaderBackdrop />

      <div className="pt-16 sm:pt-24">
        <h1 className="font-display text-[clamp(2.75rem,8.5vw,6.5rem)] font-semibold leading-[0.94] tracking-[-0.04em] text-ink">
          {HEADLINE.map((line, index) => (
            // Each line is its own overflow-hidden band, so the reveal reads as
            // type rising into place rather than a block fading in.
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <span
                data-line-inner
                className={index === 2 ? "block text-ink-soft" : "block"}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-8 flex flex-col gap-8 sm:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <p
            data-hero-reveal
            className="max-w-[46ch] text-lg leading-relaxed text-ink-soft sm:text-xl"
          >
            Every channel you follow, grouped the way you think, played from a
            queue you built. No distractions, just watching.
          </p>
          <div data-hero-reveal className="flex shrink-0 items-center gap-3">
            <LoginButton size="lg" />
            <a
              href="#the-difference"
              className="text-[15px] font-medium text-ink-soft underline-offset-8 transition-colors duration-200 ease-pm hover:text-ink hover:underline"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* The product itself is the hero image. It sits wide and casts light on
            the page, which is what replaces a drop shadow on a dark ground. */}
        <div data-hero-reveal className="cast-glow mt-14 sm:mt-20">
          <DemoFrame />
        </div>
      </div>
    </section>
  );
}
