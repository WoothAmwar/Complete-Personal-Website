from . import youtube_database as db


class YoutubeDataAdapter:
    """
    Thin pass-through over youtube_database. When the Mongo-backed functions in
    youtube_database.py are swapped for AWS Lambda calls, only this class's method
    bodies change (e.g. to boto3 lambda invocations) - callers keep the same
    names/signatures and are unaffected by the swap.
    """

    def get_all_tag_names(self, googleID):
        return db.get_all_tag_names(googleID)

    def get_channels_of_tag(self, googleID, tag_name):
        return db.get_channels_of_tag(googleID, tag_name)

    def get_channel_by_name(self, channel_name):
        return db.get_channel_by_name(channel_name)

    def get_watchlater_videos(self, googleID):
        return db.get_watchlater_videos(googleID)

    def get_all_tracked_video(self, googleID):
        return db.get_all_tracked_video(googleID)

    def check_video_in_watchlater(self, googleID, fullVideoDetails=None, videoId=None):
        return db.check_video_in_watchlater(googleID, fullVideoDetails=fullVideoDetails, videoId=videoId)

    def check_video_in_favorite(self, googleID, fullVideoDetails):
        return db.check_video_in_favorite(googleID, fullVideoDetails)

    def check_video_in_tracked(self, googleID, fullVideoDetails=None, videoId=None):
        return db.check_video_in_tracked(googleID, fullVideoDetails=fullVideoDetails, videoId=videoId)

    def get_video_by_id(self, videoID):
        return db.get_video_by_id(videoID)

    def get_channel_of_video(self, videoID):
        return db.get_channel_of_video(videoID)

    def get_video_of_channel(self, channelID):
        return db.get_video_of_channel(channelID)


data_adapter = YoutubeDataAdapter()
