import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { googleLogout } from "@react-oauth/google";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";

import ProfilePicture from "@/components/uiComponents/ProfilePicture";
import { VideoBox, getFavoriteVideos } from "@/components/VideoBox";
import { useQueue } from "@/components/queue/QueueProvider";
import { CurrentUserCookieInfo, CurrentUserId } from "@/helperFunctions/cookieManagement";
import {
  Button,
  EmptyState,
  INPUT_CLASS,
  LinkButton,
  Skeleton,
  cx,
} from "@/components/ui/primitives";

type SaveState = "idle" | "saving" | "saved" | "failed";

const SAVE_COPY: Record<Exclude<SaveState, "idle">, string> = {
  saving: "Saving...",
  saved: "Saved",
  failed: "Could not save",
};

/**
 * One credential field. The value is masked by default because these are
 * secrets that get read out over a shared screen more often than they get
 * typed, and the reveal toggle is right next to it when you do need to check.
 */
function CredentialField({
  id,
  label,
  hint,
  placeholder,
  onSave,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    if (state !== "saved" && state !== "failed") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  const save = async () => {
    if (!value.trim()) return;
    setState("saving");
    try {
      await onSave(value.trim());
      setState("saved");
      setValue("");
    } catch {
      setState("failed");
    }
  };

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={revealed ? "text" : "password"}
          autoComplete="off"
          className={cx(INPUT_CLASS, "pr-10 font-mono text-[13px]")}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          onClick={() => setRevealed((previous) => !previous)}
          aria-label={revealed ? `Hide the ${label}` : `Show the ${label}`}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-hovered hover:text-ink"
        >
          {revealed ? (
            <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p
          className={cx(
            "text-[12px]",
            state === "failed" ? "text-danger" : state === "saved" ? "text-positive" : "text-ink-muted"
          )}
          aria-live="polite"
        >
          {state === "idle" ? hint : SAVE_COPY[state]}
        </p>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!value.trim() || state === "saving"}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

function FavoriteVideos({ googleId }: { googleId: string }) {
  const [videos, setVideos] = useState<any[] | null>(null);

  useEffect(() => {
    if (!googleId) return;
    let cancelled = false;
    (async () => {
      const response = await getFavoriteVideos(googleId, false);
      if (!cancelled) setVideos(Array.isArray(response) ? response : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [googleId]);

  if (videos === null) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="aspect-video w-full rounded-surface" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        title="No favorites yet"
        body="Star a video from the menu on its card and it will be collected here."
        action={
          <LinkButton href="/custom-youtube" variant="secondary" size="sm">
            Browse your subscriptions
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video: any) => (
        <VideoBox key={video["videoId"]} includeDate={false} fullVideoDetails={video} />
      ))}
    </div>
  );
}

/**
 * A place to go.
 *
 * A row rather than a card: three bordered tiles each with an icon in a tinted
 * rounded square is the most templated pattern there is, and these are just
 * links. The number carries the only information a card would have added.
 */
function Destination({
  href,
  title,
  body,
  count,
  countLabel,
}: {
  href: string;
  title: string;
  body: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-t border-line-subtle py-6 transition-colors duration-300 ease-pm hover:border-line-strong"
    >
      <div className="min-w-0">
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink transition-colors duration-200 group-hover:text-accent sm:text-2xl">
          {title}
        </h3>
        <p className="mt-1 max-w-prose text-[14px] leading-relaxed text-ink-muted">
          {body}
        </p>
      </div>
      {count !== undefined ? (
        <span className="text-right">
          <span className="block font-mono text-2xl tabular-nums text-ink">{count}</span>
          <span className="block text-[11px] uppercase tracking-wide text-ink-muted">
            {countLabel}
          </span>
        </span>
      ) : (
        <ArrowRightIcon
          className="h-4 w-4 self-center text-ink-muted transition-transform duration-200 ease-pm group-hover:translate-x-1 group-hover:text-ink"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [, setCookie] = useCookies(["profile"]);
  const currentUserGoogleID = CurrentUserId();
  const cookieProfile = CurrentUserCookieInfo();
  const queue = useQueue();

  // Derived, never mirrored into state: copying it in an effect is what makes
  // an infinite render loop possible when the source rebuilds its object.
  const profile = cookieProfile;

  const saveCredential = useCallback(
    async (path: "apiKey" | "channelID", value: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${path}`, {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-google-id": currentUserGoogleID.toString(),
        },
        body: JSON.stringify({ data: value }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    },
    [currentUserGoogleID]
  );

  const logOut = () => {
    googleLogout();
    setCookie("profile", null, { path: "/" });
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>

      {/* Identity first, then the places to go, then the settings that rarely
          change, then the favorites collection. */}
      <header className="flex flex-wrap items-center gap-5 pb-14 pt-6">
        <ProfilePicture imageLink={profile?.picture} imageSize={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.03em] text-ink">
            {profile?.name ? profile.name : "Your dashboard"}
          </h1>
          <p className="mt-1 truncate font-mono text-[13px] text-ink-muted">
            {profile?.email ?? ""}
          </p>
        </div>
        <Button variant="danger" onClick={logOut}>
          Sign out
        </Button>
      </header>

      <section>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              YouTube connection
            </h2>
            <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-muted">
              These two values let Pure Media read your public subscription list.
              Saving either one replaces the stored value.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-7 sm:grid-cols-2">
              <CredentialField
                id="api-key"
                label="YouTube Data API key"
                hint="From the Google Cloud console."
                placeholder="AIza..."
                onSave={(value) => saveCredential("apiKey", value)}
              />
              <CredentialField
                id="channel-id"
                label="Channel ID"
                hint="From your YouTube advanced settings."
                placeholder="UC..."
                onSave={(value) => saveCredential("channelID", value)}
              />
            </div>
          </div>

          {/* Sits against a rule rather than in its own box, so it reads as an
              aside to the fields on the left instead of a competing panel. */}
          <aside className="border-t border-line-subtle pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              Need help setting up either of these?
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
              The About page walks through getting an API key, finding your
              channel ID, and making your subscription list readable.
            </p>
            <LinkButton href="/about" variant="secondary" size="sm" className="mt-5">
              Read the setup guide
            </LinkButton>
          </aside>
        </div>
      </section>

      <section className="pt-16">
        <Destination
          href="/custom-youtube"
          title="Subscriptions"
          body="Every channel you follow, grouped by channel or ordered by upload date."
          count={queue.ids.length}
          countLabel="in queue"
        />
        <Destination
          href="/custom-youtube/scheduler"
          title="Update schedule"
          body="Move channels between daily, weekly, monthly and not scheduled."
        />
        <Destination
          href="/tracker"
          title="Tracker"
          body="Videos you saved by pasting a link, kept outside your subscriptions."
        />
        <div className="border-t border-line-subtle" />
      </section>

      <section className="pt-20">
        <h2 className="mb-6 font-display text-xl font-semibold tracking-tight text-ink">
          Favorites
        </h2>
        <FavoriteVideos googleId={currentUserGoogleID} />
      </section>
    </>
  );
}
