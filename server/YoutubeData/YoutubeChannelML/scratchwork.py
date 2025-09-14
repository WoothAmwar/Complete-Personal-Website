# import os

# import google_auth_oauthlib.flow
# import datetime
import json

import requests.api
from googleapiclient.discovery import build  # referred to as google-api-python-client
# import pyautogui
# from time import sleep

from server.YoutubeData.youtube_database import (get_channel_name_info, replace_videos_many_db, replace_channels_many_db,
                              add_new_channel, is_channel_in_db, get_unassigned_channel_name_info, get_user_api,
                              get_all_user_google, get_user_channel_id)


def main():
    api_key = ""

    service = build('youtube', 'v3', developerKey=api_key)

    # Topic Categories (topicDetails.topicCategories) and Description (brandingSettings.channel.description)
    #  are the best for information about the channel besides video title

    # Plan:
    channel_id = ""

    request = service.channels().list(
        part="snippet, topicDetails, contentDetails, brandingSettings, statistics",
        id=channel_id
    )

    response = request.execute()
    print("RESP:", response)
    with open("response.json", "w") as f:
        f.write(json.dumps(response))



if __name__ == "__main__":
    main()
