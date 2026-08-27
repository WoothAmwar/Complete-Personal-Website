import Head from "next/head";
import Link from "next/link";

import { Hero } from "@/components/landing/Hero";
import { FilterStory } from "@/components/landing/FilterStory";
import LoginButton from "@/components/buttons/LoginButton";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

/**
 * What a feed does versus what this does. Set as two plain columns either side
 * of a hairline, because the comparison is the content and a pair of bordered
 * boxes would only get in its way.
 */
const CONTRAST = {
  feed: [
    "Opens on whatever the algorithm is testing today",
    "Constantly updates your video list, incentivizing you to come back again",
    "Shows you videos by upload time, so you scroll to find something you want to watch",
  ],
  here: [
    "Opens on the channels you subscribed to, and nothing else",
    "Checks every channel on a schedule you set, reducing dopamine hits and taking control",
    "Control what content you watch and find the content you want",
  ],
};

/** Capabilities as an editorial list. Term, then one line on what it means. */
const CAPABILITIES = [
  {
    term: "Import",
    body: "Every channel from your YouTube subscriptions, cached so the page opens instantly.",
  },
  {
    term: "Tags",
    body: "color-coded, as many per channel as you need, and the whole page filters to one in a click.",
  },
  {
    term: "Queue",
    body: "Add anything, reorder your evening, play straight through with previous and next.",
  },
  {
    term: "Agent",
    body: "Describe what you feel like watching and it fills the queue for you with videos from your followed channels.",
  },
  {
    term: "Tracker",
    body: "Paste any YouTube link to keep a video outside your subscriptions.",
  },
  {
    term: "Favorites",
    body: "Star a video once and find it on your dashboard for as long as you want it.",
  },
];

/** A real scale, so it is drawn as one. */
const CADENCE = [
  { label: "Daily", body: "You want to watch ASAP" },
  { label: "Weekly", body: "Catch up with on a weekend." },
  { label: "Monthly", body: "Rare posters, worth a watch if it pops up." },
  { label: "Paused", body: "Subscribed on YouTube, quiet here." },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Pure Media</title>
        <meta
          name="description"
          content="Every YouTube channel you follow, grouped the way you think, played from a queue you built. No distractions, only watching."
        />
      </Head>

      <Hero />

      {/* The thesis, as a comparison. */}
      <section id="the-difference" className="scroll-mt-24 pt-32 sm:pt-44">
        <Reveal>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1px_1fr] lg:gap-14">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-ink-muted">
                A feed
              </p>
              <ul className="mt-6 space-y-5">
                {CONTRAST.feed.map((item) => (
                  <li
                    key={item}
                    className="text-[17px] leading-snug text-ink-muted sm:text-lg"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rule-fade-y hidden lg:block" aria-hidden="true" />

            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-accent">
                Pure Media
              </p>
              <ul className="mt-6 space-y-5">
                {CONTRAST.here.map((item) => (
                  <li
                    key={item}
                    className="text-[17px] font-medium leading-snug text-ink sm:text-lg"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* The signature moment: the argument, shown. */}
      <section className="pt-28 sm:pt-40">
        <FilterStory />
      </section>

      {/* Capabilities. A definition list on hairlines, not a grid of tiles. */}
      <section className="pt-24 sm:pt-32">
        <Reveal>
          <h2 className="max-w-[16ch] font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
            Everything it does.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14" stagger={0.06}>
          {CAPABILITIES.map((capability) => (
            <RevealItem key={capability.term}>
              <div className="group grid grid-cols-1 gap-2 border-t border-line-subtle py-7 transition-colors duration-300 ease-pm hover:border-line-strong sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-10">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
                  {capability.term}
                </h3>
                <p className="max-w-prose self-center text-[17px] leading-relaxed text-ink-muted transition-colors duration-300 ease-pm group-hover:text-ink-soft">
                  {capability.body}
                </p>
              </div>
            </RevealItem>
          ))}
          <div className="border-t border-line-subtle" />
        </RevealGroup>
      </section>

      {/* The update cadence, drawn as the scale it is. */}
      <section className="pt-28 sm:pt-40">
        <Reveal>
          <h2 className="max-w-[22ch] font-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
            You decide how often each channel is checked.
          </h2>
          <p className="mt-5 max-w-prose text-[17px] leading-relaxed text-ink-muted">
            A channel that posts twice a year does not need the attention of one
            that posts twice a day. You know what videos will be shown to you when you visit, 
            and it will not update constantly giving you reason to constantly check back.
            Move channels between these four whenever you like.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-surface bg-line-subtle lg:grid-cols-4">
            {CADENCE.map((step, index) => (
              <div key={step.label} className="bg-canvas px-5 py-8 sm:px-6 sm:py-10">
                {/* Opacity steps down across the row, so the scale is legible
                    before a single word is read. */}
                <span
                  className="block font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                  style={{ opacity: 1 - index * 0.18 }}
                >
                  {step.label}
                </span>
                <span className="mt-3 block text-sm leading-relaxed text-ink-muted">
                  {step.body}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Close. */}
      <section className="py-32 sm:py-44">
        <Reveal>
          <hr className="rule-fade mb-16" />
          {/* <h2 className="max-w-[14ch] font-display text-[clamp(2.25rem,6.5vw,5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-ink">
            Bring your subscriptions over.
          </h2> */}
          <p className="mt-6 max-w-prose leading-relaxed text-ink-muted">
            Sign in with the Google account your subscriptions live on. Nothing
            is posted, nothing is changed, and you can sign out from the
            dashboard at any time.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <LoginButton size="lg" />
            <Link
              href="/about"
              className="text-[15px] font-medium text-ink-soft underline-offset-8 transition-colors duration-200 ease-pm hover:text-ink hover:underline"
            >
              Read the setup guide
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
