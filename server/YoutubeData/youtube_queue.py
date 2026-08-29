import json
import os
from dotenv import load_dotenv # type: ignore

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(dotenv_path=dotenv_path)

UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

from upstash_redis import Redis # type: ignore

def filter_func(func):
    def wrapper(self, *args, **kwargs):
        self._filter_video_id(args)
        return func(self, *args, **kwargs)
    return wrapper


def build_entry(video_id: str, video_title: str | None = None,
                video_thumbnail: str | None = None) -> dict:
    """
    Builds the record stored alongside a queued id: everything the queue rail
    needs to draw a row. The queue used to hold bare ids and the site looked the
    rest up in the videos database, which drops all but the three newest videos
    per channel on every refresh - so anything older vanished from the rail.

    Both fallbacks matter. YouTube serves a thumbnail for any id, and the id
    itself is a poor title but a better one than nothing.
    """
    return {
        "videoId": video_id,
        "videoTitle": video_title or video_id,
        "videoThumbnail": video_thumbnail or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
    }


class RedisYt:
    """
    The queue is two keys kept in step: `{google_id}_queue`, the ordered list of
    ids, and `{google_id}_queue_meta`, a hash of videoId -> JSON metadata. The
    list stays the ordered structure so lrange/lpos/lrem/lset keep their meaning;
    the hash is what makes the queue readable without the videos database.

    This class stays a pure Redis wrapper - the title and thumbnail are looked up
    a layer above, in the agent's tools, so nothing here depends on Mongo.
    """

    def __init__(self, google_id: str, local=False):
        self.redis = Redis(url=UPSTASH_REDIS_REST_URL, token=UPSTASH_REDIS_REST_TOKEN)
        self.isLocal = local
        self.local_redis: list[str] = []
        self.local_meta: dict[str, dict] = {}
        self.queue_key = f"{google_id}_queue"
        self.meta_key = f"{google_id}_queue_meta"

        # self.redis.delete(self.queue_key)

    def _filter_video_id(self, *args):
        for video_id_tuple in args:
            video_id = video_id_tuple[0]
            # print(args, ":",video_id)
            if len(video_id) != 11:
                raise ValueError("Video Id is not 11 characters long, not valid id")

    def _write_meta(self, entry: dict):
        """
        Stores the metadata for one queued video. Written before the id joins the
        list so a reader never sees an id with nothing to render.
        """
        if not self.isLocal:
            self.redis.hset(self.meta_key, values={entry["videoId"]: json.dumps(entry)})
        else:
            self.local_meta[entry["videoId"]] = entry

    def _drop_meta(self, video_id: str):
        if not self.isLocal:
            self.redis.hdel(self.meta_key, video_id)
        else:
            self.local_meta.pop(video_id, None)

    @filter_func
    def add_video(self, video_id: str, video_title: str | None = None,
                  video_thumbnail: str | None = None):
        """
        Adds a video to the end of the list, storing its title and thumbnail so
        the queue can be rendered without the videos database.
        """
        entry = build_entry(video_id, video_title, video_thumbnail)
        if not self.isLocal:
            # Written even when the video is already queued, so a re-add
            # refreshes a title or thumbnail that has since changed.
            self._write_meta(entry)
            if self.get_video_index(video_id) < 0:  # check if already in list
                result = self.redis.rpush(self.queue_key, video_id)
                print("Added:", result)
                return result
        else:
            self._write_meta(entry)
            if video_id not in self.local_redis:
                self.local_redis.append(video_id)

        return None

    @filter_func
    def remove_video(self, video_id: str):
        """
        Removes a video from the list entirely
        """
        if not self.isLocal:
            result = self.redis.lrem(self.queue_key, 0, video_id)
            self._drop_meta(video_id)
            print("Removed:", result)
            return result
        else:
            id_cnt:int = self.local_redis.count(video_id)
            for _ in range(id_cnt):
                self.local_redis.remove(video_id)
            self._drop_meta(video_id)

    @filter_func
    def overwrite_video_at_index(self, video_id: str, queue_index: int,
                                 video_title: str | None = None,
                                 video_thumbnail: str | None = None):
        """
        Overwrites the id at a specific index
        """
        self._write_meta(build_entry(video_id, video_title, video_thumbnail))
        if not self.isLocal:
            result = self.redis.lset(self.queue_key, queue_index, video_id)
            print("Replaced at index:", result)
            return result
        else:
            self.local_redis[queue_index] = video_id

    @filter_func
    def get_video_index(self, video_id: str)->int:
        """
        Gets index of video id in list
        """
        if not self.isLocal:
            result = self.redis.lpos(self.queue_key, video_id)
            if result is None:
                return -1
            print("Gotten at index:", result)
            return result
        else:
            try:
                idx = self.local_redis.index(video_id)
                return idx
            except ValueError:
                return -1
        

    @filter_func
    def replace_video(self, new_video_id: str, old_video_id: str,
                      video_title: str | None = None, video_thumbnail: str | None = None):
        """
        Replaces one video with another video, removing all instances of the old video
        """
        old_idx:int = self.get_video_index(old_video_id)
        if old_idx < 0:
            # Without this the index falls through to lset(key, -1, new), which
            # silently overwrites the last entry in the queue instead.
            raise ValueError(f"'{old_video_id}' is not in the queue, nothing to replace")

        self.overwrite_video_at_index(new_video_id, old_idx, video_title, video_thumbnail)
        self.remove_video(old_video_id)
        print(f"Replaced all of '{old_video_id}' with '{new_video_id}'")

    def set_video_queue(self, new_list: list[dict], overwrite_prod=False):
        """
        Sets the value for the entire queue list, replacing its value entirely.
        Takes entries (as built by build_entry), not bare ids, so the metadata
        hash is replaced along with the list rather than left holding stale rows.
        """
        entries = [build_entry(entry["videoId"], entry.get("videoTitle"),
                               entry.get("videoThumbnail")) for entry in new_list]

        if not self.isLocal or overwrite_prod:
            # Both keys are cleared first: this replaces the queue, and rpush on
            # its own would have appended to whatever was already there.
            self.redis.delete(self.queue_key)
            self.redis.delete(self.meta_key)
            if not entries:
                print("Set queue list: emptied")
                return 0
            result = self.redis.rpush(self.queue_key, *[e["videoId"] for e in entries])
            self.redis.hset(self.meta_key, values={
                e["videoId"]: json.dumps(e) for e in entries
            })
            print("Set queue list:", result)
            return result
        else:
            self.local_redis = [e["videoId"] for e in entries]
            self.local_meta = {e["videoId"]: e for e in entries}

    def get_video_queue(self)->list[str]:
        """
        Gets the current list of video ids from the redis db
        """
        if not self.isLocal:
            # print("KEY Type:", self.redis.type(self.queue_key))
            result = self.redis.lrange(self.queue_key, 0, -1)
            print("Retrieved queue list:", result)
            return result
        else:
            return self.local_redis

    def get_video_queue_details(self)->list[dict]:
        """
        Gets the queue as full entries, in order. An id with no stored metadata -
        one queued before the metadata was kept - still comes back renderable,
        via the fallbacks in build_entry.
        """
        ids = self.get_video_queue()
        if not ids:
            return []

        if not self.isLocal:
            raw_meta = self.redis.hgetall(self.meta_key) or {}
        else:
            raw_meta = self.local_meta

        entries = []
        for video_id in ids:
            stored = raw_meta.get(video_id)
            if isinstance(stored, str):
                try:
                    stored = json.loads(stored)
                except json.JSONDecodeError:
                    stored = None
            stored = stored or {}
            entries.append(build_entry(video_id, stored.get("videoTitle"),
                                       stored.get("videoThumbnail")))
        return entries

    def merge_local_to_prod(self):
        """
        Sets the actual redis database list to the local list for the user
        """
        self.set_video_queue(self.get_video_queue_details(), overwrite_prod=True)


if __name__ == "__main__":
    yt_redis = RedisYt(google_id="__smoketest__", local=True)
    yt_redis.add_video("dQw4w9WgXcQ", "Never Gonna Give You Up",
                       "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg")
    yt_redis.add_video("aaaaaaaaaaa")  # no metadata: falls back to id + derived thumbnail
    print(yt_redis.get_video_queue())
    for queued in yt_redis.get_video_queue_details():
        print(queued)

    assert yt_redis.get_video_queue() == ["dQw4w9WgXcQ", "aaaaaaaaaaa"]
    details = yt_redis.get_video_queue_details()
    assert details[0]["videoTitle"] == "Never Gonna Give You Up"
    assert details[1]["videoTitle"] == "aaaaaaaaaaa"
    assert details[1]["videoThumbnail"].endswith("/aaaaaaaaaaa/hqdefault.jpg")

    yt_redis.remove_video("dQw4w9WgXcQ")
    assert yt_redis.get_video_queue() == ["aaaaaaaaaaa"]
    assert "dQw4w9WgXcQ" not in yt_redis.local_meta
    print("Smoke test passed")
