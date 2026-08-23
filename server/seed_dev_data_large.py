"""
Like seed_dev_data.py, but with a larger fixture set for exercising pagination, tag filtering,
favorites, and the tracker with more realistic volume: 24 videos across 6 channels, 3 favorites,
3 tracked videos, and 7 tags.

Tags in this schema attach to CHANNELS, not individual videos (see add_tag_channel in
YoutubeData/youtube_database.py) — there's no per-video tagging anywhere in the codebase. So
"videos with a tag" here means videos belonging to a tagged channel: 3 of the 6 channels are
tagged (4 videos each = 12 tagged videos), the other 3 are untagged (12 videos).

Usage:
    docker compose up -d          # start local Mongo
    # point MONGODB_URI at it in the repo-root .env.local, see ../.env.example
    python seed_dev_data_large.py
"""

import datetime

from YoutubeData.youtube_database import (
    add_user_google, add_user_api, add_user_channel_id,
    add_new_channel, set_update_schedule_channel,
    replace_channels_many_db, replace_videos_many_db,
    add_tag_name, add_color_of_tag, add_tag_channel,
    add_favorite_video, add_tracked_video,
    db_users,
)

DEV_GOOGLE_ID = "dev-user-1"

BASE_DATE = datetime.datetime(2026, 8, 15, 12, 0, 0)


def make_videos(short_name, count, day_offset):
    videos = []
    for i in range(1, count + 1):
        upload_date = BASE_DATE - datetime.timedelta(days=day_offset + i)
        videos.append({
            "videoId": f"demoVideo{short_name}{i}",
            "videoTitle": f"Demo Video {short_name} #{i}",
            "videoThumbnail": f"https://picsum.photos/seed/{short_name.lower()}{i}/320/180",
            "uploadDate": upload_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
    return videos


CHANNELS = [
    {"channelId": "UCdemoAlpha0000000001", "channelNames": "Demo Channel Alpha", "channelImages": "https://picsum.photos/seed/demoAlpha/200", "schedule": "daily", "tags": []},
    {"channelId": "UCdemoBeta00000000002", "channelNames": "Demo Channel Beta", "channelImages": "https://picsum.photos/seed/demoBeta/200", "schedule": "daily", "tags": []},
    {"channelId": "UCdemoGamma0000000003", "channelNames": "Demo Channel Gamma", "channelImages": "https://picsum.photos/seed/demoGamma/200", "schedule": "weekly", "tags": []},
    {"channelId": "UCdemoDelta0000000004", "channelNames": "Demo Channel Delta", "channelImages": "https://picsum.photos/seed/demoDelta/200", "schedule": "weekly", "tags": ["Gaming", "Comedy"]},
    {"channelId": "UCdemoEpsilon000000005", "channelNames": "Demo Channel Epsilon", "channelImages": "https://picsum.photos/seed/demoEpsilon/200", "schedule": "monthly", "tags": ["Music", "Tech", "Education"]},
    {"channelId": "UCdemoZeta00000000006", "channelNames": "Demo Channel Zeta", "channelImages": "https://picsum.photos/seed/demoZeta/200", "schedule": "unassigned", "tags": ["Sports", "Cooking"]},
]

ALL_TAGS = ["Gaming", "Comedy", "Music", "Tech", "Education", "Sports", "Cooking"]
TAG_COLORS = {
    "Gaming": "blue", "Comedy": "yellow", "Music": "pink", "Tech": "cyan",
    "Education": "green", "Sports": "orange", "Cooking": "red",
}

VIDEOS = {
    ch["channelId"]: make_videos(ch["channelNames"].split()[-1], 4, idx * 4)
    for idx, ch in enumerate(CHANNELS)
}

# 3 videos from untagged channels, 3 different ones from tagged channels for the tracker.
FAVORITE_VIDEO_IDS = [
    VIDEOS["UCdemoAlpha0000000001"][0]["videoId"],
    VIDEOS["UCdemoBeta00000000002"][0]["videoId"],
    VIDEOS["UCdemoGamma0000000003"][0]["videoId"],
]
TRACKER_VIDEO_IDS = [
    VIDEOS["UCdemoDelta0000000004"][0]["videoId"],
    VIDEOS["UCdemoEpsilon000000005"][0]["videoId"],
    VIDEOS["UCdemoZeta00000000006"][0]["videoId"],
]


def find_video(video_id):
    for videos in VIDEOS.values():
        for v in videos:
            if v["videoId"] == video_id:
                return v
    raise KeyError(video_id)


def seed():
    print(f"Seeding dev user {DEV_GOOGLE_ID} with the large fixture set...")
    add_user_google(DEV_GOOGLE_ID)
    add_user_api(DEV_GOOGLE_ID, "mock-api-key")
    add_user_channel_id(DEV_GOOGLE_ID, "UCmockOwnChannel000000")

    channel_ids, channel_images, channel_names = [], [], []
    for ch in CHANNELS:
        add_new_channel(DEV_GOOGLE_ID, ch["channelNames"])
        set_update_schedule_channel(DEV_GOOGLE_ID, [ch["channelNames"]], ch["schedule"])
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
    print(f"Seeded {sum(len(v) for v in VIDEOS.values())} videos across {len(CHANNELS)} channels")

    # add_tag_name()/get_all_tag_names() assume this document already exists for the user;
    # nothing else in the codebase creates it, so a brand-new user has to be seeded here.
    curr_user = db_users[DEV_GOOGLE_ID]
    if curr_user.find_one({"category": "tagTypes"}) is None:
        curr_user.insert_one({"category": "tagTypes", "userTagTypes": []})

    for tag in ALL_TAGS:
        add_tag_name(DEV_GOOGLE_ID, tag)
        add_color_of_tag(DEV_GOOGLE_ID, tag, TAG_COLORS[tag])
    for ch in CHANNELS:
        for tag in ch["tags"]:
            add_tag_channel(DEV_GOOGLE_ID, ch["channelNames"], tag)
    print(f"Seeded {len(ALL_TAGS)} tags across {sum(1 for ch in CHANNELS if ch['tags'])} tagged channels "
          f"({sum(len(VIDEOS[ch['channelId']]) for ch in CHANNELS if ch['tags'])} videos)")

    for video_id in FAVORITE_VIDEO_IDS:
        add_favorite_video(DEV_GOOGLE_ID, find_video(video_id))
    print(f"Seeded {len(FAVORITE_VIDEO_IDS)} favorites")

    for video_id in TRACKER_VIDEO_IDS:
        video = find_video(video_id)
        add_tracked_video(DEV_GOOGLE_ID, video["videoId"], video["videoTitle"], video["videoThumbnail"])
    print(f"Seeded {len(TRACKER_VIDEO_IDS)} tracked videos")

    print("Done. Dev googleID:", DEV_GOOGLE_ID)


if __name__ == "__main__":
    seed()
