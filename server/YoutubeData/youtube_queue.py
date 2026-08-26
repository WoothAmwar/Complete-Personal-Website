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

class RedisYt:
    def __init__(self, google_id: str, local=False):
        self.redis = Redis(url=UPSTASH_REDIS_REST_URL, token=UPSTASH_REDIS_REST_TOKEN)
        self.isLocal = local
        self.local_redis: list[str] = []
        self.queue_key = f"{google_id}_queue"

        # self.redis.delete(self.queue_key)

    def _filter_video_id(self, *args):
        for video_id_tuple in args:
            video_id = video_id_tuple[0]
            # print(args, ":",video_id)
            if len(video_id) != 11:
                raise ValueError("Video Id is not 11 characters long, not valid id")

    @filter_func
    def add_video(self, video_id: str):
        """
        Adds a video to the end of the list
        """
        if not self.isLocal:
            if self.get_video_index(video_id) < 0:  # check if already in list
                result = self.redis.rpush(self.queue_key, video_id)
                print("Added:", result)
                return result
        else:
            self.local_redis.append(video_id)

        return None

    @filter_func
    def remove_video(self, video_id: str):
        """
        Removes a video from the list entirely
        """
        if not self.isLocal:
            result = self.redis.lrem(self.queue_key, 0, video_id)
            print("Removed:", result)
            return result
        else:
            id_cnt:int = self.local_redis.count(video_id)
            for _ in range(id_cnt):
                self.local_redis.remove(video_id)

    @filter_func
    def overwrite_video_at_index(self, video_id: str, queue_index: int):
        """
        Overwrites the id at a specific index
        """
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
    def replace_video(self, new_video_id: str, old_video_id: str):
        """
        Replaces one video with another video, removing all instances of the old video
        """
        if not self.isLocal:
            old_idx:int = self.get_video_index(old_video_id)
            self.overwrite_video_at_index(new_video_id, old_idx)
            self.remove_video(old_video_id)
            print(f"Replaced all of '{old_video_id}' with '{new_video_id}'")
        else:
            old_idx:int = self.get_video_index(old_video_id)
            self.overwrite_video_at_index(new_video_id, old_idx)
            self.remove_video(old_video_id)

    def set_video_queue(self, new_list: list[str], overwrite_prod=False):
        """
        Sets the value for the entire queue list, replacing its value entirely
        """
        if not self.isLocal or overwrite_prod:
            result = self.redis.rpush(self.queue_key, *new_list)
            print("Set queue list:", result)
            return result
        else:
            self.local_redis = new_list

    def get_video_queue(self)->list[str]:
        """
        Gets the current list from the redis db
        """
        if not self.isLocal:
            # print("KEY Type:", self.redis.type(self.queue_key))
            result = self.redis.lrange(self.queue_key, 0, -1)
            print("Retrieved queue list:", result)
            return result
        else:
            return self.local_redis

    def merge_local_to_prod(self):
        """
        Sets the actual redis database list to the local list for the user
        """
        self.set_video_queue(self.local_redis, overwrite_prod=True)


if __name__ == "__main__":
    yt_redis = RedisYt(google_id="__smoketest__", local=True)
    yt_redis.add_video("dQw4w9WgXcQ")
    print(yt_redis.get_video_queue())
