import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

/** A label the reader will go looking for in another product's interface. */
function UILabel({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[5px] bg-inset px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
      {children}
    </span>
  );
}

function Emphasis({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="text-accent underline decoration-accent decoration-1 underline-offset-4 transition-all hover:decoration-2"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

/**
 * A setup sequence.
 *
 * Numbered because the order genuinely matters: each step leaves you on the
 * screen the next one starts from. The number sits out in the margin as quiet
 * display type rather than inside a circle, and steps are separated by
 * hairlines instead of being boxed.
 */
function Sequence({
  title,
  intro,
  steps,
}: {
  title: string;
  intro: string;
  steps: ReactNode[];
}) {
  return (
    <div>
      <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-muted">
        {intro}
      </p>

      <ol className="mt-8">
        {steps.map((step, index) => (
          <li
            key={index}
            className="grid grid-cols-[2rem_1fr] gap-4 border-t border-line-subtle py-4"
          >
            <span className="pt-0.5 font-mono text-[13px] tabular-nums text-ink-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[15px] leading-relaxed text-ink-soft">{step}</span>
          </li>
        ))}
        <li className="border-t border-line-subtle" aria-hidden="true" />
      </ol>
    </div>
  );
}

const API_KEY_STEPS: ReactNode[] = [
  <>
    Open the <OutLink href="https://console.cloud.google.com/">Google Cloud console</OutLink>.
  </>,
  <>
    Search for <UILabel>YouTube Data API</UILabel> and open{" "}
    <Emphasis>YouTube Data API v3</Emphasis>.
  </>,
  <>
    Press <UILabel>Enable</UILabel>.
  </>,
  <>
    In the sidebar of the screen you land on, open <UILabel>Credentials</UILabel>.
  </>,
  <>
    Choose <UILabel>+ Create credentials</UILabel>, then <UILabel>API key</UILabel>.
  </>,
  <>
    Copy the key. You can find it again later under <UILabel>API key 1</UILabel>.
  </>,
  <>
    Paste it into <Emphasis>YouTube Data API key</Emphasis> on your dashboard and save.
  </>,
];

const CHANNEL_ID_STEPS: ReactNode[] = [
  <>
    Go to <OutLink href="https://youtube.com">youtube.com</OutLink> and open your account
    settings from your profile picture.
  </>,
  <>
    Open <UILabel>Advanced settings</UILabel>.
  </>,
  <>Copy the channel ID shown there.</>,
  <>
    Paste it into <Emphasis>Channel ID</Emphasis> on your dashboard and save.
  </>,
];

const PRIVACY_STEPS: ReactNode[] = [
  <>Open your YouTube account settings from your profile picture.</>,
  <>
    Open <UILabel>Privacy</UILabel>.
  </>,
  <>
    Turn off <UILabel>Keep all my subscriptions private</UILabel>.
  </>,
];

export default function About() {
  return (
    <>
      <Head>
        <title>About Pure Media</title>
        <meta
          name="description"
          content="What Pure Media does, and how to connect your YouTube account to it."
        />
      </Head>

      <div className="pb-24">
        <Reveal>
          <header className="max-w-4xl pt-10 sm:pt-16">
            <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-ink">
              A minimal viewer for your video subscriptions.
            </h1>
            <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ink-soft sm:text-xl">
              Pure Media imports the channels you already follow, refreshes them
              on a schedule you choose, and shows you the uploads. No
              recommendation engine, no autoplay into something you did not ask
              for, no home feed.
            </p>
            <p className="mt-6 max-w-prose leading-relaxed text-ink-muted">
              To read your subscriptions it needs two things from your Google
              account: a <Emphasis>YouTube Data API key</Emphasis> and your{" "}
              <Emphasis>channel ID</Emphasis>. Both are below, and neither takes
              more than a couple of minutes.
            </p>

            <p className="mt-4 max-w-prose leading-relaxed text-ink-muted">
              An alternative domain for this website is {""}
              <a className="text-blue-500 inline-flex items-center gap-1" 
                  target="_blank" rel="noopener noreferrer" 
                  href="https://video.anwarkader.com">
                video.anwarkader.com <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true"/>
              </a>
            </p>
          </header>
        </Reveal>

        <hr className="rule-fade my-16 sm:my-24" />

        <RevealGroup className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-16">
          <RevealItem>
            <Sequence
              title="Get an API key"
              intro="The key lets Pure Media read public YouTube data on your behalf. It stays on your Google account and you can revoke it whenever you want."
              steps={API_KEY_STEPS}
            />
          </RevealItem>
          <RevealItem>
            <Sequence
              title="Find your channel ID"
              intro="This is how Pure Media knows whose subscription list to read."
              steps={CHANNEL_ID_STEPS}
            />
          </RevealItem>
        </RevealGroup>

        {/* A blocker rather than a step, so it gets an accent rule and a full
            measure of its own instead of sitting in a third box. */}
        <Reveal>
          <section className="mt-20 border-l-2 border-accent pl-6 sm:mt-28 sm:pl-10">
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-accent">
              Required
            </p>
            <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(1.5rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em] text-ink">
              Make your subscriptions public.
            </h2>
            <p className="mt-4 max-w-prose leading-relaxed text-ink-muted">
              YouTube hides subscription lists by default. While yours is
              private the API returns nothing, and Pure Media has no channels to
              import.
            </p>
            <ol className="mt-7 max-w-prose">
              {PRIVACY_STEPS.map((step, index) => (
                <li
                  key={index}
                  className="grid grid-cols-[2rem_1fr] gap-4 border-t border-line-subtle py-3.5"
                >
                  <span className="pt-0.5 font-mono text-[13px] tabular-nums text-ink-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-relaxed text-ink-soft">{step}</span>
                </li>
              ))}
              <li className="border-t border-line-subtle" aria-hidden="true" />
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-24 sm:mt-32">
            <hr className="rule-fade mb-14" />
            <h2 className="max-w-[16ch] font-display text-[clamp(1.75rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
              Ready to add them?
            </h2>
            <p className="mt-5 max-w-prose leading-relaxed text-ink-muted">
              Both values go in the same place on your dashboard. Save them and
              the first import starts on the next update run.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-12 items-center rounded-control bg-accent px-6 text-[15px] font-medium text-accent-contrast transition-colors duration-200 ease-pm hover:bg-accent-hover active:translate-y-px"
            >
              Open your dashboard
            </Link>
          </section>
        </Reveal>
      </div>
    </>
  );
}
