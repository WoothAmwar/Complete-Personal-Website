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
    api_key = "AIzaSyCRJ-4UyadnEdYmZPbgfGKkHdEcq5y9eJw"

    service = build('youtube', 'v3', developerKey=api_key)
    # chrisMD: UCQ-YJstgVdAiCT52TiBWDbg
    # chrisMD videos BEFORE (good): ['2qsXg3oZ0cw', 'etWiEgoQ-es', 'xCyYjtnfN4E']
    # good work: UC_-hYjoNe4PJNFa9iZ4lraA
    # animeMen videos BEFORE (bad):
    # docm77: UC4O9HKe9Jt5yAhKuNv3LXpQ
    # kodekai: UCuaGQ8RZR9JMu_AmzIRSyUw
    # Spilled Ink: UC4Q4RQ2m4L7qVdVt4qoOmjA

    # Topic Categories (topicDetails.topicCategories) and Description (brandingSettings.channel.description)
    #  are the best for information about the channel besides video title

    # Plan:
    # In Untouched.json, in this order
    #  Docm77, Kodekai, Spilled Ink
    # Get video titles, channel description, and channel name. Could also get topic categories, not too useful though
    #  as seen by SpilledInk which only said Hobby and Lifestyle for the channel

    channel_id = "UC4Q4RQ2m4L7qVdVt4qoOmjA"

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
