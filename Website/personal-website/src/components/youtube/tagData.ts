import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

/**
 * Shared access to the channel tag endpoints.
 *
 * The API surface is exactly what it was before: this file only puts React
 * Query in front of it so a tag colour is fetched once per session rather than
 * once per channel row. Every request still carries the x-google-id header and
 * hits the same paths.
 */

const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;

function headers(googleId: string) {
  return {
    "Content-Type": "application/json",
    "x-google-id": googleId,
  };
}

async function getJson(path: string, googleId: string) {
  const response = await fetch(api(path), {
    method: "GET",
    mode: "cors",
    headers: headers(googleId),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }
  return response.json();
}

/** Every tag the account has, sorted alphabetically for a stable menu order. */
export function useTags(googleId: string) {
  return useQuery({
    queryKey: ["tags", googleId],
    queryFn: async () => {
      const data = await getJson("/channels/tags", googleId);
      const list: string[] = Array.isArray(data) ? data : [];
      return [...list].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    },
    enabled: Boolean(googleId),
  });
}

/**
 * Tag hue lookup for the whole account, as one map. Each tag still resolves
 * through its own /colorsOfTag request, but only once, and the results are
 * cached together so any component can read a colour without refetching.
 */
export function useTagColors(googleId: string, tags: string[] | undefined) {
  const key = (tags ?? []).join(" ");
  return useQuery({
    queryKey: ["tagColors", googleId, key],
    queryFn: async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        (tags ?? []).map(async (tag) => {
          try {
            const color = await getJson(
              `/channels/colorsOfTag/${encodeURIComponent(tag)}`,
              googleId
            );
            map[tag] = typeof color === "string" ? color : "gray";
          } catch {
            map[tag] = "gray";
          }
        })
      );
      return map;
    },
    enabled: Boolean(googleId) && Boolean(tags && tags.length > 0),
  });
}

/** Tags currently on one channel. */
export function useChannelTags(googleId: string, channelName: string) {
  return useQuery({
    queryKey: ["channelTags", googleId, channelName],
    queryFn: async () => {
      const data = await getJson(
        `/channels/channelWithTags/${encodeURIComponent(channelName)}`,
        googleId
      );
      return Array.isArray(data?.data) ? (data.data as string[]) : [];
    },
    enabled: Boolean(googleId) && Boolean(channelName),
  });
}

/* ==========================================================================
   Mutations. Plain functions so callers stay in control of what they
   invalidate; every one keeps the original request shape.
   ========================================================================== */

export async function addTagToChannel(
  googleId: string,
  channelName: string,
  tagName: string
) {
  const response = await fetch(
    api(`/channels/channelWithTags/${encodeURIComponent(channelName)}`),
    {
      method: "PUT",
      mode: "cors",
      headers: headers(googleId),
      body: JSON.stringify({ data: { tagName } }),
    }
  );
  if (!response.ok) throw new Error(`Could not tag ${channelName}`);
  return response.json();
}

export async function removeTagFromChannel(
  googleId: string,
  channelName: string,
  tagName: string
) {
  const response = await fetch(
    api(`/channels/channelWithTags/${encodeURIComponent(channelName)}`),
    {
      method: "DELETE",
      mode: "cors",
      headers: headers(googleId),
      body: JSON.stringify({ data: { tagName } }),
    }
  );
  if (!response.ok) throw new Error(`Could not untag ${channelName}`);
  return response.json();
}

export async function createTag(googleId: string, rawName: string) {
  const db_text = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const response = await fetch(api("/channels/tags"), {
    method: "PUT",
    mode: "cors",
    headers: headers(googleId),
    body: JSON.stringify({ data: { db_text } }),
  });
  if (!response.ok) throw new Error("Could not create the tag");
  const data = await response.json();
  // The API answers -1 when the name is already taken.
  return data?.data === -1 ? null : (data?.data as string);
}

export async function deleteTag(googleId: string, tagName: string) {
  const response = await fetch(api("/channels/tags"), {
    method: "DELETE",
    mode: "cors",
    headers: headers(googleId),
    body: JSON.stringify({ data: { tagName } }),
  });
  if (!response.ok) throw new Error("Could not delete the tag");
  return response.json();
}

export async function setTagColor(
  googleId: string,
  tagName: string,
  tagColor: string
) {
  const response = await fetch(
    api(`/channels/colorsOfTag/${encodeURIComponent(tagName)}`),
    {
      method: "PUT",
      mode: "cors",
      headers: headers(googleId),
      body: JSON.stringify({ data: { tagColor } }),
    }
  );
  if (!response.ok) throw new Error("Could not set the tag colour");
  return response.json();
}

/** Everything tag related, refetched together after a change. */
export function invalidateTagData(client: QueryClient, googleId: string) {
  client.invalidateQueries({ queryKey: ["tags", googleId] });
  client.invalidateQueries({ queryKey: ["tagColors"] });
  client.invalidateQueries({ queryKey: ["channelTags"] });
  client.invalidateQueries({ queryKey: ["channelsOfTag"] });
}

export function useTagInvalidator(googleId: string) {
  const client = useQueryClient();
  return () => invalidateTagData(client, googleId);
}

/** The hues a tag can take, laid out as the swatch grid the picker renders. */
export const TAG_HUES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "stone",
] as const;

export function hueClass(hue: string | undefined, strength: 400 | 500 = 400) {
  return `bg-${hue ?? "gray"}-${strength}`;
}
