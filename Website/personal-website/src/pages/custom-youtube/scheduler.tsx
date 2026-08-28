import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/20/solid";

import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { fetchWithRetry } from "@/helperFunctions/fetchWithRetry";
import { Select, type SelectOption } from "@/components/ui/Select";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  cx,
} from "@/components/ui/primitives";

/** The four buckets a channel can sit in, in cadence order. */
type Bucket = "daily" | "weekly" | "monthly" | "unassigned";

const BUCKETS: ReadonlyArray<SelectOption<Bucket>> = [
  { value: "daily", label: "Daily", hint: "Checked once every day" },
  { value: "weekly", label: "Weekly", hint: "Checked once a week" },
  { value: "monthly", label: "Monthly", hint: "Checked once a month" },
  { value: "unassigned", label: "Not scheduled", hint: "Never checked for new uploads" },
];

const bucketLabel = (bucket: Bucket) =>
  BUCKETS.find((option) => option.value === bucket)?.label ?? bucket;

interface Channel {
  channelNames: string;
  channelImages: string;
}

function ChannelRow({
  channel,
  checked,
  onToggle,
}: {
  channel: Channel;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-center gap-3 rounded-control border px-3 py-2.5",
        "transition-colors duration-200 ease-pm",
        checked
          ? "border-accent bg-accent-soft"
          : "border-transparent hover:bg-hovered"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
          checked
            ? "border-accent bg-accent text-accent-contrast"
            : "border-line bg-surface text-transparent"
        )}
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={channel.channelImages}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        className="h-9 w-9 shrink-0 rounded-pill border border-line-subtle object-cover"
      />
      <span className="min-w-0 truncate text-sm font-medium text-ink">
        {channel.channelNames}
      </span>
    </label>
  );
}

export default function Scheduler() {
  const currentUserGoogleId = CurrentUserId();

  const [source, setSource] = useState<Bucket>("daily");
  const [destination, setDestination] = useState<Bucket>("weekly");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [buckets, setBuckets] = useState<Record<Bucket, Channel[]> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    if (!currentUserGoogleId) return;

    const fetchBucket = async (bucket: Bucket): Promise<Channel[]> => {
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/channels/${bucket}`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-google-id": currentUserGoogleId.toString(),
        },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    };

    try {
      const [daily, weekly, monthly, unassigned] = await Promise.all([
        fetchBucket("daily"),
        fetchBucket("weekly"),
        fetchBucket("monthly"),
        fetchBucket("unassigned"),
      ]);
      setBuckets({ daily, weekly, monthly, unassigned });
      setStatus("ready");
    } catch (err) {
      console.error("Could not load the update schedule", err);
      setStatus("error");
    }
  }, [currentUserGoogleId]);

  useEffect(() => {
    load();
  }, [load]);

  // Changing which side you are looking at clears the selection, because the
  // channels on screen have changed.
  useEffect(() => {
    setSelected(new Set());
  }, [source]);

  const channels = useMemo(() => buckets?.[source] ?? [], [buckets, source]);

  // Two balanced columns, matching the layout this page has always used.
  const columns = useMemo(() => {
    const half = Math.ceil(channels.length / 2);
    return [channels.slice(0, half), channels.slice(half)];
  }, [channels]);

  const toggle = (channelName: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(channelName)) next.delete(channelName);
      else next.add(channelName);
      return next;
    });
  };

  const applyChange = async () => {
    if (selected.size === 0 || source === destination) return;

    setApplying(true);
    try {
      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_URL}/channels/${destination}`,
        {
          method: "PUT",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "x-google-id": currentUserGoogleId.toString(),
          },
          body: JSON.stringify({
            data: Array.from(selected),
            location: destination,
          }),
        }
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setSelected(new Set());
      await load();
    } catch (err) {
      console.error("Could not move the channels", err);
    } finally {
      setApplying(false);
    }
  };

  const sameBucket = source === destination;
  const canApply = selected.size > 0 && !sameBucket && !applying;

  return (
    <>
      <Head>
        <title>Update schedule</title>
      </Head>

      <PageHeader
        title="Update schedule"
        description="How often each channel is checked for new uploads. Pick the group you are looking at, pick where the channels should go, then apply the change."
      />

      {/* Source on the left, destination on the right, action at the end. The
          left dropdown also decides which channels are listed below, so the
          control reads as one sentence: move these, from here, to there. */}
      <div className="mb-8 rounded-surface bg-inset p-4">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
          <div>
            <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ink-muted">
              Showing
            </span>
            <Select
              label="Group to move channels from"
              options={BUCKETS}
              value={source}
              onChange={setSource}
            />
          </div>

          <div className="hidden pb-2.5 text-ink-muted sm:block">
            <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ink-muted">
              Move to
            </span>
            <Select
              label="Group to move channels to"
              options={BUCKETS.map((option) => ({
                ...option,
                disabled: option.value === source,
              }))}
              value={destination}
              onChange={setDestination}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={applyChange}
            disabled={!canApply}
            className="w-full sm:w-auto"
          >
            {applying ? "Changing..." : "Change"}
          </Button>
        </div>

        <p className="mt-3 text-[13px] text-ink-muted" aria-live="polite">
          {sameBucket
            ? "Pick a different group to move these channels into."
            : selected.size === 0
              ? `Tick the channels you want to move out of ${bucketLabel(source)}.`
              : `${selected.size} ${selected.size === 1 ? "channel" : "channels"} will move from ${bucketLabel(source)} to ${bucketLabel(destination)}.`}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          {bucketLabel(source)}
          <span className="ml-2 font-mono text-[13px] font-normal text-ink-muted">
            {channels.length}
          </span>
        </h2>
        {channels.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setSelected((previous) =>
                previous.size === channels.length
                  ? new Set()
                  : new Set(channels.map((channel) => channel.channelNames))
              )
            }
          >
            {selected.size === channels.length ? "Clear selection" : "Select all"}
          </Button>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-x-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[3.75rem] w-full" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          title="The schedule could not be loaded"
          body="Reload the page. If it keeps failing, check that your API key is still valid on the dashboard."
        />
      ) : channels.length === 0 ? (
        <EmptyState
          title={`No channels in ${bucketLabel(source)}`}
          body="Switch the group above to see where your channels currently sit."
        />
      ) : (
        <div className="grid grid-cols-1 gap-1 lg:grid-cols-2 lg:gap-x-6">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-1">
              {column.map((channel) => (
                <ChannelRow
                  key={channel.channelNames}
                  channel={channel}
                  checked={selected.has(channel.channelNames)}
                  onToggle={() => toggle(channel.channelNames)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
