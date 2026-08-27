import { useEffect, useRef, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

import { useTheme } from "@/components/theme/ThemeProvider";

/**
 * The drifting gradient behind the hero.
 *
 * It has one job: give the near-black ground depth, so the hero reads as a lit
 * room rather than a flat rectangle. It is deliberately held back.
 *
 *   - It bleeds to the viewport edges. Contained inside the content column it
 *     reads as a colored panel someone pasted behind the text.
 *   - Its palette is the accent against a deep indigo and the canvas color,
 *     not a full spectrum. A rainbow mesh is the single most recognisable
 *     generated-page background there is.
 *   - Two scrims sit on top of it: one anchored to the top left, where the
 *     headline lives, and one at the bottom that dissolves it into the page.
 *     The type is therefore always on near-black, and the color is only ever
 *     visible around it.
 *
 * Cost is contained too: it is imported through next/dynamic with ssr:false so
 * three.js never enters the initial bundle, it unmounts once the hero scrolls
 * away, and it never mounts at all under prefers-reduced-motion.
 */

function useNearViewport(ref: React.RefObject<HTMLElement>) {
  const [near, setNear] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "300px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return near;
}

export default function ShaderBackdrop() {
  const host = useRef<HTMLDivElement>(null);
  const near = useNearViewport(host);
  const { resolved } = useTheme();
  const [reduced, setReduced] = useState(true);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setLit(true), 150);
    return () => clearTimeout(timer);
  }, [reduced]);

  const dark = resolved === "dark";

  // WebGL uniforms need literal color strings, so these cannot be var()
  // references the way every other color in the product is. Reading the
  // tokens off the document instead keeps globals.css the single source of
  // truth and stops the shader drifting from the palette.
  const [colors, setColors] = useState({
    color1: "#ff5436",
    color2: "#2a1b5e",
    color3: "#08080b",
  });

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      style.getPropertyValue(name).trim() || fallback;

    setColors({
      color1: read("--shader-1", "#ff5436"),
      color2: read("--shader-2", "#2a1b5e"),
      color3: read("--shader-3", "#08080b"),
    });
  }, [resolved]);

  return (
    <div
      ref={host}
      aria-hidden="true"
      // left-1/2 / w-screen breaks out of the centred content column so the
      // gradient reaches both viewport edges with no seam.
      className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[min(125vh,1150px)] w-screen -translate-x-1/2 overflow-hidden"
    >
      {/* Static stand-in, and what reduced-motion readers get. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 72% 12%, var(--glow), transparent 72%)",
        }}
      />

      {!reduced && near ? (
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-pm"
          style={{ opacity: lit ? (dark ? 0.85 : 0.55) : 0 }}
        >
          <ShaderGradientCanvas
            style={{ width: "100%", height: "100%" }}
            pixelDensity={1}
            fov={40}
          >
            <ShaderGradient
              control="props"
              type="waterPlane"
              animate="on"
              uTime={0}
              uSpeed={0.1}
              uStrength={1.2}
              uDensity={1.1}
              uFrequency={5.5}
              uAmplitude={0}
              positionX={0.9}
              positionY={0}
              positionZ={0}
              rotationX={0}
              rotationY={10}
              rotationZ={50}
              cAzimuthAngle={180}
              cPolarAngle={80}
              cDistance={2.6}
              cameraZoom={9.1}
              brightness={dark ? 0.85 : 1.15}
              grain="on"
              lightType="3d"
              reflection={0.1}
              envPreset="city"
              {...colors}
            />
          </ShaderGradientCanvas>
        </div>
      ) : null}

      {/* Scrim over the top left, where the headline sits. color survives on
          the right and below, the type never competes with it. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, var(--bg-canvas) 12%, rgba(0,0,0,0) 78%)",
        }}
      />

      {/* Dissolves the canvas into the page instead of ending on a hard edge. */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg-canvas) 82%)",
        }}
      />
    </div>
  );
}
