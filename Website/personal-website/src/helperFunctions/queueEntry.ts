/**
 * The shape of one entry in the play queue.
 *
 * The queue used to hold bare video ids and borrow the title and thumbnail from
 * whatever the subscriptions feed happened to have loaded. That feed only keeps
 * the three newest videos per channel and drops the rest on every refresh, so a
 * video queued a few days ago had nothing left to render from and quietly
 * vanished from the rail. Everything needed to draw a row is therefore stored
 * with the entry itself, in Redis, and the rail never looks anywhere else.
 */
export interface QueueEntry {
  videoId: string;
  videoTitle: string;
  videoThumbnail: string;
}

/** Every YouTube id is exactly this long; anything else is not one. */
export const VIDEO_ID_LENGTH = 11;

/** Generous caps, only so a malformed body cannot write unbounded values. */
const MAX_TITLE_LENGTH = 300;
const MAX_THUMBNAIL_LENGTH = 500;

/**
 * YouTube serves this for any video id, so an entry with no stored thumbnail -
 * one written before the queue kept metadata - still draws a real image rather
 * than a broken one.
 */
export function fallbackThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Validates and fills in an entry from an untrusted source (a request body, or
 * a hash value read back from Redis). Returns null only when the id itself is
 * unusable: a missing title or thumbnail is filled in rather than rejected, so
 * a queue written before this metadata existed still reads back cleanly.
 */
export function normalizeEntry(raw: unknown): QueueEntry | null {
  const source = (raw ?? {}) as Record<string, unknown>;
  const videoId = typeof source.videoId === "string" ? source.videoId.trim() : "";
  if (videoId.length !== VIDEO_ID_LENGTH) return null;

  const thumbnail = cleanText(source.videoThumbnail, MAX_THUMBNAIL_LENGTH);

  return {
    videoId,
    // The id is a poor title, but it is better than an empty row, and it only
    // shows for entries queued before the title was being stored.
    videoTitle: cleanText(source.videoTitle, MAX_TITLE_LENGTH) || videoId,
    videoThumbnail: thumbnail.startsWith("https://") ? thumbnail : fallbackThumbnail(videoId),
  };
}

/**
 * Turns a value read back out of the Redis metadata hash into an entry.
 *
 * The stored value arrives either as the JSON string that was written or as an
 * object, because the Upstash client parses anything that looks like JSON for
 * us; both are handled. An id with no metadata at all - one queued before the
 * metadata was kept - still yields a renderable entry rather than nothing.
 */
export function entryFromStored(videoId: string, stored: unknown): QueueEntry {
  let parsed: unknown = stored;
  if (typeof stored === "string") {
    try {
      parsed = JSON.parse(stored);
    } catch {
      parsed = null;
    }
  }
  if (typeof parsed !== "object" || parsed === null) parsed = {};

  return (
    normalizeEntry({ ...(parsed as object), videoId }) ?? {
      videoId,
      videoTitle: videoId,
      videoThumbnail: fallbackThumbnail(videoId),
    }
  );
}

/**
 * Builds an entry from a video object as the feed and the tracker return them.
 * The feed keys the id as `videoId` and the tracker as `videoID`, so both are
 * accepted here rather than at every call site.
 */
export function toQueueEntry(fullVideoDetails: any): QueueEntry | null {
  if (!fullVideoDetails) return null;
  return normalizeEntry({
    videoId: fullVideoDetails["videoId"] ?? fullVideoDetails["videoID"],
    videoTitle: fullVideoDetails["videoTitle"],
    videoThumbnail: fullVideoDetails["videoThumbnail"],
  });
}
