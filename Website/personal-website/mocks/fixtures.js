// In-memory fixture data for mocks/server.js. Mutated by PUT/DELETE routes while the mock server
// runs; resets on restart. Mirrors the field names the real Flask backend's Mongo documents use
// (channelId, channelNames, channelImages, videoId, videoTitle, videoThumbnail, uploadDate) so
// frontend components don't need any mock-specific handling.

const CHANNELS = [
  { channelId: "UCmockChannelA00000001", channelNames: "Mock Channel A", channelImages: "https://picsum.photos/seed/mockA/200" },
  { channelId: "UCmockChannelB00000002", channelNames: "Mock Channel B", channelImages: "https://picsum.photos/seed/mockB/200" },
  { channelId: "UCmockChannelC00000003", channelNames: "Mock Channel C", channelImages: "https://picsum.photos/seed/mockC/200" },
];

// Parallel to CHANNELS by index — GET /videos returns this shape (array of per-channel arrays).
const VIDEOS = [
  [
    { videoId: "mockVideoA1", videoTitle: "Mock Video A1", videoThumbnail: "https://picsum.photos/seed/a1/320/180", uploadDate: "2026-08-10T12:00:00Z" },
    { videoId: "mockVideoA2", videoTitle: "Mock Video A2", videoThumbnail: "https://picsum.photos/seed/a2/320/180", uploadDate: "2026-08-05T12:00:00Z" },
    { videoId: "mockVideoA3", videoTitle: "Mock Video A3", videoThumbnail: "https://picsum.photos/seed/a3/320/180", uploadDate: "2026-07-30T12:00:00Z" },
  ],
  [
    { videoId: "mockVideoB1", videoTitle: "Mock Video B1", videoThumbnail: "https://picsum.photos/seed/b1/320/180", uploadDate: "2026-08-09T12:00:00Z" },
    { videoId: "mockVideoB2", videoTitle: "Mock Video B2", videoThumbnail: "https://picsum.photos/seed/b2/320/180", uploadDate: "2026-08-02T12:00:00Z" },
    { videoId: "mockVideoB3", videoTitle: "Mock Video B3", videoThumbnail: "https://picsum.photos/seed/b3/320/180", uploadDate: "2026-07-25T12:00:00Z" },
  ],
  [
    { videoId: "mockVideoC1", videoTitle: "Mock Video C1", videoThumbnail: "https://picsum.photos/seed/c1/320/180", uploadDate: "2026-08-08T12:00:00Z" },
    { videoId: "mockVideoC2", videoTitle: "Mock Video C2", videoThumbnail: "https://picsum.photos/seed/c2/320/180", uploadDate: "2026-08-01T12:00:00Z" },
    { videoId: "mockVideoC3", videoTitle: "Mock Video C3", videoThumbnail: "https://picsum.photos/seed/c3/320/180", uploadDate: "2026-07-20T12:00:00Z" },
  ],
];

const SCHEDULE = {
  daily: ["Mock Channel A"],
  weekly: ["Mock Channel B"],
  monthly: ["Mock Channel C"],
  unassigned: [],
};

const TAGS = ["Gaming", "Music"];
const TAG_COLORS = { Gaming: "blue", Music: "pink" };
const CHANNEL_TAGS = { "Mock Channel A": ["Gaming"] };

const FAVORITES = [{ ...VIDEOS[0][0], channelName: CHANNELS[0].channelNames }];
const WATCHLATER = [{ ...VIDEOS[1][0], channelName: CHANNELS[1].channelNames }];
const TRACKER = [];

module.exports = { CHANNELS, VIDEOS, SCHEDULE, TAGS, TAG_COLORS, CHANNEL_TAGS, FAVORITES, WATCHLATER, TRACKER };
