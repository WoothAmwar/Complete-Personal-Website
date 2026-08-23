// Frontend-only mock backend. Replicates the subset of the Flask API surface
// (see ../../../server/application.py) that Website/personal-website/src actually calls, so the
// frontend can be developed without Python, MongoDB, YouTube API keys, or internet access.
//
// Uses only Node's built-in http module (no new dependencies). State lives in fixtures.js and
// resets whenever this process restarts.
//
// Usage: node mocks/server.js   (or `npm run mock` / `npm run dev:mock`)

const http = require("http");
const { CHANNELS, VIDEOS, SCHEDULE, TAGS, TAG_COLORS, CHANNEL_TAGS, FAVORITES, WATCHLATER, TRACKER } = require("./fixtures");

const PORT = process.env.MOCK_PORT || 5050;

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function findFavorite(list, videoId) {
  return list.findIndex((v) => v.videoId === videoId);
}

const routes = [
  // ---- Tags ----
  { method: "GET", pattern: /^\/channels\/tags$/, handler: () => [200, TAGS] },
  {
    method: "PUT",
    pattern: /^\/channels\/tags$/,
    handler: (m, body) => {
      const tagName = body?.data?.db_text;
      if (!tagName || TAGS.includes(tagName)) return [200, { data: -1 }];
      TAGS.push(tagName);
      TAG_COLORS[tagName] = "gray";
      return [200, { data: tagName }];
    },
  },
  {
    method: "DELETE",
    pattern: /^\/channels\/tags$/,
    handler: (m, body) => {
      const tagName = body?.data?.tagName;
      const idx = TAGS.indexOf(tagName);
      if (idx !== -1) TAGS.splice(idx, 1);
      delete TAG_COLORS[tagName];
      Object.keys(CHANNEL_TAGS).forEach((ch) => {
        CHANNEL_TAGS[ch] = (CHANNEL_TAGS[ch] || []).filter((t) => t !== tagName);
      });
      return [200, { data: tagName }];
    },
  },
  {
    method: "GET",
    pattern: /^\/channels\/channelsOfTag\/([^/]+)$/,
    handler: (m) => {
      const tagName = decodeURIComponent(m[1]);
      const channels = Object.entries(CHANNEL_TAGS)
        .filter(([, tags]) => tags.includes(tagName))
        .map(([ch]) => ch);
      return [200, channels];
    },
  },
  {
    method: "GET",
    pattern: /^\/channels\/colorsOfTag\/([^/]+)$/,
    handler: (m) => [200, TAG_COLORS[decodeURIComponent(m[1])] || "gray"],
  },
  {
    method: "PUT",
    pattern: /^\/channels\/colorsOfTag\/([^/]+)$/,
    handler: (m, body) => {
      const tagName = decodeURIComponent(m[1]);
      TAG_COLORS[tagName] = body?.data?.tagColor || "gray";
      return [200, TAG_COLORS[tagName]];
    },
  },
  {
    method: "GET",
    pattern: /^\/channels\/channelWithTags\/([^/]+)$/,
    handler: (m) => [200, { data: CHANNEL_TAGS[decodeURIComponent(m[1])] || [] }],
  },
  {
    method: "PUT",
    pattern: /^\/channels\/channelWithTags\/([^/]+)$/,
    handler: (m, body) => {
      const channelName = decodeURIComponent(m[1]);
      const tagName = body?.data?.tagName;
      CHANNEL_TAGS[channelName] = CHANNEL_TAGS[channelName] || [];
      if (tagName && !CHANNEL_TAGS[channelName].includes(tagName)) {
        CHANNEL_TAGS[channelName].push(tagName);
      }
      return [200, [tagName, channelName]];
    },
  },
  {
    method: "DELETE",
    pattern: /^\/channels\/channelWithTags\/([^/]+)$/,
    handler: (m, body) => {
      const channelName = decodeURIComponent(m[1]);
      const tagName = body?.data?.tagName;
      CHANNEL_TAGS[channelName] = (CHANNEL_TAGS[channelName] || []).filter((t) => t !== tagName);
      return [200, { data: [tagName, channelName] }];
    },
  },

  // ---- Channel schedule (daily/weekly/monthly/unassigned) ----
  {
    method: "GET",
    pattern: /^\/channels\/(daily|weekly|monthly|unassigned)$/,
    handler: (m) => {
      const names = SCHEDULE[m[1]];
      return [200, CHANNELS.filter((c) => names.includes(c.channelNames))];
    },
  },
  {
    method: "PUT",
    pattern: /^\/channels\/(daily|weekly|monthly|unassigned)$/,
    handler: (m, body) => {
      const channelsToMove = body?.data || [];
      const destination = body?.location || m[1];
      Object.keys(SCHEDULE).forEach((cat) => {
        SCHEDULE[cat] = SCHEDULE[cat].filter((n) => !channelsToMove.includes(n));
      });
      SCHEDULE[destination] = [...(SCHEDULE[destination] || []), ...channelsToMove];
      return [200, { data: channelsToMove, loc: destination }];
    },
  },

  // ---- Channels / videos ----
  { method: "GET", pattern: /^\/channels$/, handler: () => [200, CHANNELS] },
  { method: "GET", pattern: /^\/videos$/, handler: () => [200, VIDEOS] },

  // ---- Favorites / watch later ----
  { method: "GET", pattern: /^\/videos\/favorites$/, handler: () => [200, { data: FAVORITES }] },
  {
    method: "PUT",
    pattern: /^\/videos\/favorites$/,
    handler: (m, body) => {
      const video = body?.data;
      if (findFavorite(FAVORITES, video?.videoId) !== -1) return [200, { data: "Already In" }];
      FAVORITES.push(video);
      return [200, { data: "Done" }];
    },
  },
  {
    method: "DELETE",
    pattern: /^\/videos\/favorites$/,
    handler: (m, body) => {
      const idx = findFavorite(FAVORITES, body?.data?.videoId);
      if (idx !== -1) FAVORITES.splice(idx, 1);
      return [200, { data: "Done" }];
    },
  },
  { method: "GET", pattern: /^\/videos\/watchlater$/, handler: () => [200, { data: WATCHLATER }] },
  {
    method: "PUT",
    pattern: /^\/videos\/watchlater$/,
    handler: (m, body) => {
      const video = body?.data;
      if (findFavorite(WATCHLATER, video?.videoId) !== -1) return [200, { data: "Already In" }];
      WATCHLATER.push(video);
      return [200, { data: "Done" }];
    },
  },
  {
    method: "DELETE",
    pattern: /^\/videos\/watchlater$/,
    handler: (m, body) => {
      const idx = findFavorite(WATCHLATER, body?.data?.videoId);
      if (idx !== -1) WATCHLATER.splice(idx, 1);
      return [200, { data: "Done" }];
    },
  },

  // ---- Tracker ----
  { method: "GET", pattern: /^\/tracker$/, handler: () => [200, TRACKER] },
  {
    method: "PUT",
    pattern: /^\/tracker\/([^/]+)$/,
    handler: (m) => {
      const videoID = decodeURIComponent(m[1]);
      if (TRACKER.some((v) => v.videoID === videoID)) return [200, "None"];
      const entry = {
        videoID,
        videoTitle: `Tracked Video ${videoID}`,
        videoThumbnail: `https://picsum.photos/seed/${videoID}/320/180`,
        category: "trackedVideo",
      };
      TRACKER.push(entry);
      return [200, entry];
    },
  },
  {
    method: "DELETE",
    pattern: /^\/tracker\/([^/]+)$/,
    handler: (m) => {
      const videoID = decodeURIComponent(m[1]);
      const idx = TRACKER.findIndex((v) => v.videoID === videoID);
      if (idx === -1) return [200, "None"];
      TRACKER.splice(idx, 1);
      return [200, { videoID }];
    },
  },

  // ---- Users ----
  { method: "PUT", pattern: /^\/users$/, handler: (m, body) => [200, { data: body?.data }] },
  { method: "PUT", pattern: /^\/users\/apiKey$/, handler: (m, body) => [200, { data: body?.data }] },
  { method: "PUT", pattern: /^\/users\/channelID$/, handler: (m, body) => [200, { data: body?.data }] },
];

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-google-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = routes.find((r) => r.method === req.method && r.pattern.test(url.pathname));

  if (!route) {
    send(res, 404, { error: `No mock route for ${req.method} ${url.pathname}` });
    return;
  }

  const body = req.method === "GET" ? {} : await readBody(req);
  const match = url.pathname.match(route.pattern);
  const [status, payload] = route.handler(match, body);
  send(res, status, payload);
});

server.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
});
