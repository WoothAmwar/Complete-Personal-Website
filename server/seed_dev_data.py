"""
Seeds the local MongoDB (see docker-compose.yml) with a fixture user, channels, and videos
for offline development.

Usage:
    docker compose up -d          # start local Mongo
    # point MONGODB_URI at it in the repo-root .env.local, see ../.env.example
    python seed_dev_data.py
"""

from YoutubeData.youtube_database import (
    add_user_google, add_user_api, add_user_channel_id,
    add_new_channel, set_update_schedule_channel,
    replace_channels_many_db, replace_videos_many_db,
    add_tag_name, add_color_of_tag, add_tag_channel,
    db_users,
)

DEV_GOOGLE_ID = "dev-user-1"

CHANNELS = [
    {
        "channelId": "UCmockChannelA00000001",
        "channelNames": "Mock Channel A",
        "channelImages": "https://picsum.photos/seed/mockA/200",
    },
    {
        "channelId": "UCmockChannelB00000002",
        "channelNames": "Mock Channel B",
        "channelImages": "https://picsum.photos/seed/mockB/200",
    },
    {
        "channelId": "UCmockChannelC00000003",
        "channelNames": "Mock Channel C",
        "channelImages": "https://picsum.photos/seed/mockC/200",
    },
]

VIDEOS = {
    "UCmockChannelA00000001": [
        {"videoId": "mockVideoA1", "videoTitle": "Mock Video A1", "videoThumbnail": "https://picsum.photos/seed/a1/320/180", "uploadDate": "2026-08-10T12:00:00Z"},
        {"videoId": "mockVideoA2", "videoTitle": "Mock Video A2", "videoThumbnail": "https://picsum.photos/seed/a2/320/180", "uploadDate": "2026-08-05T12:00:00Z"},
        {"videoId": "mockVideoA3", "videoTitle": "Mock Video A3", "videoThumbnail": "https://picsum.photos/seed/a3/320/180", "uploadDate": "2026-07-30T12:00:00Z"},
    ],
    "UCmockChannelB00000002": [
        {"videoId": "mockVideoB1", "videoTitle": "Mock Video B1", "videoThumbnail": "https://picsum.photos/seed/b1/320/180", "uploadDate": "2026-08-09T12:00:00Z"},
        {"videoId": "mockVideoB2", "videoTitle": "Mock Video B2", "videoThumbnail": "https://picsum.photos/seed/b2/320/180", "uploadDate": "2026-08-02T12:00:00Z"},
        {"videoId": "mockVideoB3", "videoTitle": "Mock Video B3", "videoThumbnail": "https://picsum.photos/seed/b3/320/180", "uploadDate": "2026-07-25T12:00:00Z"},
    ],
    "UCmockChannelC00000003": [
        {"videoId": "mockVideoC1", "videoTitle": "Mock Video C1", "videoThumbnail": "https://picsum.photos/seed/c1/320/180", "uploadDate": "2026-08-08T12:00:00Z"},
        {"videoId": "mockVideoC2", "videoTitle": "Mock Video C2", "videoThumbnail": "https://picsum.photos/seed/c2/320/180", "uploadDate": "2026-08-01T12:00:00Z"},
        {"videoId": "mockVideoC3", "videoTitle": "Mock Video C3", "videoThumbnail": "https://picsum.photos/seed/c3/320/180", "uploadDate": "2026-07-20T12:00:00Z"},
    ],
}


def seed():
    print(f"Seeding dev user {DEV_GOOGLE_ID}...")
    add_user_google(DEV_GOOGLE_ID)
    print("Added Google User")
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

    add_tag_name(DEV_GOOGLE_ID, "Gaming")
    add_color_of_tag(DEV_GOOGLE_ID, "Gaming", "blue")
    add_tag_channel(DEV_GOOGLE_ID, CHANNELS[0]["channelNames"], "Gaming")

    print("Done. Dev googleID:", DEV_GOOGLE_ID)


if __name__ == "__main__":
    seed()
