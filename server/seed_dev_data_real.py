"""
Like seed_dev_data.py, but with real, currently-live YouTube channel and video IDs instead of
fake ones. seed_dev_data.py/seed_dev_data_large.py use IDs like "UCmockChannelA00000001" and
"mockVideoA1" that don't correspond to anything on YouTube, so actual video playback/embeds (the
iframe API, video.js) can't be exercised against them. This script seeds 2 real channels with 3
real videos each, pulled from YouTube's public per-channel RSS feed
(https://www.youtube.com/feeds/videos.xml?channel_id=...), so clicking through to
/custom-youtube/<videoId> in the app actually plays a real video.

IDs/titles/thumbnails below were pulled live on 2026-08-22 and should still resolve indefinitely
(neither channel is likely to disappear), but if a video is ever taken down, re-pull fresh ones
from the RSS feed for these channel IDs:
  - Google for Developers: UC_x5XG1OV2P6uZZ5FSM9Ttw
  - Veritasium:            UCHnyfMqiRRG1u-2MsSQLbXA

Usage:
    docker compose up -d          # start local Mongo
    # point MONGODB_URI at it in the repo-root .env.local, see ../.env.example
    python seed_dev_data_real.py
"""

from YoutubeData.youtube_database import (
    add_user_google, add_user_api, add_user_channel_id,
    add_new_channel, set_update_schedule_channel,
    replace_channels_many_db, replace_videos_many_db,
    clear_videos_database, clear_channels_database,
    db_users,
)

DEV_GOOGLE_ID = "dev-user-1"

CHANNELS = [
    {
        "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
        "channelNames": "Google for Developers",
        "channelImages": "https://yt3.googleusercontent.com/WZ_63J_-745xyW_DGxGi3VUyTZAe0Jvhw2ZCg7fdz-tv9esTbNPZTFR9X79QzA0ArIrMjYJCDA=s900-c-k-c0x00ffffff-no-rj",
    },
    {
        "channelId": "UCHnyfMqiRRG1u-2MsSQLbXA",
        "channelNames": "Veritasium",
        "channelImages": "https://yt3.googleusercontent.com/7vCbvtCqtjQ3YLgsJt7Y952MQV1sBvhllSCSxHP8_sVZdcPCBrITfhkN2RdyCuwPnsByq-1GoA=s900-c-k-c0x00ffffff-no-rj",
    },
]

VIDEOS = {
    "UC_x5XG1OV2P6uZZ5FSM9Ttw": [
        {"videoId": "kN_iMEAi1dw", "videoTitle": "Build a live translation broadcast app with the Gemini Live API and LiveKit", "uploadDate": "2026-08-17T23:00:36Z"},
        {"videoId": "kacf2bib-X0", "videoTitle": "Hands on with Gemini 3.7 Flash", "uploadDate": "2026-08-17T18:40:25Z"},
        {"videoId": "9_PtOVH2FPE", "videoTitle": "Introducing Gemini 3.7 Flash", "uploadDate": "2026-08-13T19:44:11Z"},
    ],
    "UCHnyfMqiRRG1u-2MsSQLbXA": [
        {"videoId": "J1WoNuemKOg", "videoTitle": "Total Solar Eclipse from 92,000 Feet", "uploadDate": "2026-08-17T14:30:16Z"},
        {"videoId": "wt4p2oalmRY", "videoTitle": "Is spider web really stronger than steel?", "uploadDate": "2026-08-02T13:21:11Z"},
        {"videoId": "tL9Lw250spc", "videoTitle": "Why does every mammal get 1 billion heartbeats in their life?", "uploadDate": "2026-07-25T17:29:09Z"},
    ],
}

for videos in VIDEOS.values():
    for v in videos:
        v["videoThumbnail"] = f"https://i.ytimg.com/vi/{v['videoId']}/hqdefault.jpg"


def seed():
    print(f"Seeding dev user {DEV_GOOGLE_ID} with real YouTube channels/videos...")

    clear_channels_database()
    clear_videos_database()

    add_user_google(DEV_GOOGLE_ID)
    add_user_api(DEV_GOOGLE_ID, "mock-api-key")
    add_user_channel_id(DEV_GOOGLE_ID, "UCmockOwnChannel000000")

    channel_ids, channel_images, channel_names = [], [], []
    for ch in CHANNELS:
        add_new_channel(DEV_GOOGLE_ID, ch["channelNames"])
        set_update_schedule_channel(DEV_GOOGLE_ID, [ch["channelNames"]], "daily")
        channel_ids.append(ch["channelId"])
        channel_images.append(ch["channelImages"])
        channel_names.append(ch["channelNames"])
    replace_channels_many_db(channel_ids, channel_images, channel_names)

    video_ids, titles, thumbnails, upload_dates = [], [], [], []
    for ch in CHANNELS:
        vids = VIDEOS[ch["channelId"]]
        video_ids.append([v["videoId"] for v in vids])
        titles.append([v["videoTitle"] for v in vids])
        thumbnails.append([v["videoThumbnail"] for v in vids])
        upload_dates.append([v["uploadDate"] for v in vids])
    replace_videos_many_db(channel_ids, video_ids, titles, thumbnails, upload_dates)

    # add_tag_name()/get_all_tag_names() assume this document already exists for the user;
    # nothing else in the codebase creates it, so a brand-new user has to be seeded here.
    curr_user = db_users[DEV_GOOGLE_ID]
    if curr_user.find_one({"category": "tagTypes"}) is None:
        curr_user.insert_one({"category": "tagTypes", "userTagTypes": []})

    print(f"Seeded {sum(len(v) for v in VIDEOS.values())} real videos across {len(CHANNELS)} real channels")
    print("Done. Dev googleID:", DEV_GOOGLE_ID)


if __name__ == "__main__":
    seed()
