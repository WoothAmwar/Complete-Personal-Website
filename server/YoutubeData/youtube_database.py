import datetime
import json
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

from random import randint

import certifi

# Construct the path to the .env.local file.
# This goes up three directories from the current file's location
# (YoutubeData -> server -> personalWebsite) and then looks for .env.local.
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(dotenv_path=dotenv_path)

ca = certifi.where()

uri = os.getenv("MONGODB_URI")

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=ca)

db = client["youtube"]  # prod-yt/youtube
yt_videos_collection = db["videos"]  # prod-yt/youtube/videos
yt_channel_collection = db["channels"]  # prod-yt/youtube/channels
yt_update_schedule_collection = db["update_schedule"]  # prod-yt/youtube/update_schedule
yt_test_collection = db["testing"]  # prod-yt/youtube/testing
yt_user_collection = db["users"]  # prod-yt/youtube/users

db_users = client["users"]  # prod-yt/users


def clear_videos_database():
    doIt = input("Are you sure you want to clear the entire database of youtube/videos: Y or N: ")
    if doIt.upper() != "Y":
        print("Did nothing")
        return
    deleteAll = yt_videos_collection.delete_many({})
    print(deleteAll)


def clear_channels_database():
    doIt = input("Are you sure you want to clear the entire database of youtube/channels: Y or N: ")
    if doIt.upper() != "Y":
        print("Did nothing")
        return
    deleteAll = yt_channel_collection.delete_many({})
    print(deleteAll)


def videos_del_db(chId):
    """
    Deletes all of the videos for a specific channel
    :param chId: Channel ID
    :return: None, acts on db directly
    """
    # specificChannelInfo equals None if the channelId is not already in the database
    specificChannelInfo = yt_videos_collection.find(filter={"channelId": chId})
    delV = yt_videos_collection.delete_many(filter={"channelId": chId})
    print(delV.deleted_count, "deleted accounts in videos database")
    for it in specificChannelInfo:
        print(it)
    print(yt_videos_collection.count_documents(filter={"channelId": chId}))


def replace_videos_many_db(channelIdList, videoIdList, titleList, thumbnailList, uploadDateList):
    if len(channelIdList) != len(videoIdList) or len(videoIdList) != len(titleList) or \
            len(titleList) != len(thumbnailList):
        print(len(channelIdList), len(videoIdList), len(titleList), len(thumbnailList), "- There is an error here ("
                                                                                        "videos)")
        return
    total_item_list = []
    for channelIdx in range(len(channelIdList)):
        tempChannelId = channelIdList[channelIdx]
        delV = yt_videos_collection.delete_many(filter={"channelId": tempChannelId})
        print(delV.deleted_count, "deleted accounts in videos database")
        for vidIdx in range(min(3, len(videoIdList[channelIdx]))):
            total_item_list.append({
                "channelId": tempChannelId,
                "videoId": videoIdList[channelIdx][vidIdx],
                "videoThumbnail": thumbnailList[channelIdx][vidIdx],
                "videoTitle": titleList[channelIdx][vidIdx],
                "uploadDate": uploadDateList[channelIdx][vidIdx]
            })
    try:
        yt_videos_collection.insert_many(total_item_list).inserted_ids
        print("Accomplished bulk insert videos")
    except Exception as e:
        print(e)


def replace_channels_many_db(channelIdList, channelImageList, channelNameList):
    if len(channelIdList) != len(channelImageList) or len(channelImageList) != len(channelNameList):
        print(len(channelIdList), len(channelImageList), len(channelNameList), "- There is an error here (channels)")
        return
    total_item_list = []
    for channelIdx in range(len(channelIdList)):
        tempChannelId = channelIdList[channelIdx]
        delV = yt_channel_collection.delete_many(filter={"channelId": tempChannelId})
        print(delV.deleted_count, "deleted accounts in channels database")
        total_item_list.append({
            "channelId": channelIdList[channelIdx],
            "channelImages": channelImageList[channelIdx],
            "channelNames": channelNameList[channelIdx]
        })
    try:
        yt_channel_collection.insert_many(total_item_list)
        print("Accomplished bulk insert channels")
    except Exception as e:
        print(e)


def set_update_schedules():
    # Will have "category" and "channelName" in MongoDB

    UPDATE_DAILY = "./updateScheduleFiles/updateDaily.json"
    UPDATE_WEEKLY = "./updateScheduleFiles/updateWeekly.json"
    UPDATE_MONTHLY = "./updateScheduleFiles/updateMonthly.json"

    categories = ["daily", "weekly", "monthly"]
    UPDATE_FILES = [UPDATE_DAILY, UPDATE_WEEKLY, UPDATE_MONTHLY]
    total_item_list = []
    for i in range(3):
        with open(UPDATE_FILES[i], "r") as f:
            fileText = json.loads(f.read())
            for channel in fileText["channelNames"]:
                total_item_list.append({
                    "category": categories[i],
                    "channelName": channel,
                })
    try:
        yt_update_schedule_collection.insert_many(total_item_list)
        print("Bulk added to", categories)
    except Exception as e:
        print(e)
        return e


def set_single_update(update_file):
    """
    Updates the content for the updateScheduleFiles
    :param update_file: the file path for one of the update json
    :return: Writes to the update file, no return
    """
    channelNames = []
    with open("./updateScheduleFiles/formatFile.txt", "r") as f:
        rawText = f.readlines()
        channelNames = [x.rstrip("\n") for x in rawText]
        print(channelNames)
    with open(update_file, "w") as f:
        f.write(json.dumps({"channelNames": channelNames}))


def get_channel_name_info(googleID):
    """
    Finds the channels corresponding to the update schedule
    :param googleID: User ID used to store and retrieve information
    :return: Daily, Weekly, Monthly, and Unassigned channels, in that order
    """
    # daily_channels = list(yt_update_schedule_collection.find(filter={"category": "daily"}))
    # weekly_channels = list(yt_update_schedule_collection.find(filter={"category": "weekly"}))
    # monthly_channels = list(yt_update_schedule_collection.find(filter={"category": "monthly"}))
    # unassigned_channels = list(yt_update_schedule_collection.find(filter={"category": "unassigned"}))
    curr_user = db_users[googleID]
    daily_channels = list(curr_user.find(filter={"category": "updateSchedule", "updateTime": "daily"}))
    weekly_channels = list(curr_user.find(filter={"category": "updateSchedule", "updateTime": "weekly"}))
    monthly_channels = list(curr_user.find(filter={"category": "updateSchedule", "updateTime": "monthly"}))
    unassigned_channels = list(curr_user.find(filter={"category": "updateSchedule", "updateTime": "unassigned"}))

    return mongo_name_extraction(daily_channels), mongo_name_extraction(weekly_channels), mongo_name_extraction(
        monthly_channels), mongo_name_extraction(unassigned_channels)


def get_unassigned_channel_name_info(googleID):
    """
    Finds the channels corresponding to the unassigned schedule
    :return: Unassigned channels
    """
    curr_user = db_users[googleID]
    unassigned_channels = list(curr_user.find(filter={"category": "updateSchedule", "updateTime": "unassigned"}))

    return mongo_name_extraction(unassigned_channels)


def mongo_name_extraction(mongo_list):
    name_list = []
    for itm in mongo_list:
        name_list.append(itm["channelName"])
    return name_list


def get_all_user_channels(googleID):
    user_chosen_channels = get_user_channels(googleID, includeUpdateSchedule=False)
    # Getting all of the channels in the database
    all_channels = list(yt_channel_collection.find(filter={}))
    channel_information = {}
    output = []
    for channel in all_channels:
        # Only selecting the channels that the user has assigned an update schedule
        if channel["channelNames"] in user_chosen_channels:
            # output.append(channel)
            channel_information[channel["channelNames"]] = channel

    ordered_names = sorted(list(channel_information.keys()), key=str.casefold)
    for name in ordered_names:
        output.append(channel_information[name])

    return output


def get_all_videos(googleID):
    all_channel_ids = []
    for channel in get_all_user_channels(googleID):
        all_channel_ids.append(channel["channelId"])

    vidSeparateId = []
    for channel_id in all_channel_ids:
        vidSeparateId.append(yt_videos_collection.find(filter={"channelId": channel_id}))
    return vidSeparateId


def get_user_channels(googleID, includeUpdateSchedule=False, updateSchedule="daily"):
    # TODO - Make it so it does not return channels with "unassigned" update Schedule
    # Getting all of the Names of channels that are assigned by the user into an update schedule
    curr_user = db_users[googleID]
    if includeUpdateSchedule:
        user_channels = list(curr_user.find(filter={"category": "updateSchedule", "updateTime": updateSchedule}))
    else:
        user_channels = list(curr_user.find(filter={"category": "updateSchedule"}))
    user_chosen_output = []
    for channel in user_channels:
        user_chosen_output.append(channel["channelName"])
    return user_chosen_output


def get_update_user_channels(googleID, updateSchedule):
    """
    Finds all of the channel info for a specific subset of user channels
    :param googleID: User ID used to store and retrieve user information
    :param updateSchedule: Daily, Weekly, or Monthly. Does not support None
    :return: The full channel information for the subset of user channels
    """
    user_chosen_channels = get_user_channels(googleID, includeUpdateSchedule=True, updateSchedule=updateSchedule)
    # Getting all of the channels in the database
    all_channels = list(yt_channel_collection.find(filter={}))
    channel_information = {}
    output = []
    for channel in all_channels:
        # Only selecting the channels that the user has assigned an update schedule
        if channel["channelNames"] in user_chosen_channels:
            # output.append(channel)
            channel_information[channel["channelNames"]] = channel

    ordered_names = sorted(list(channel_information.keys()), key=str.casefold)
    for name in ordered_names:
        output.append(channel_information[name])

    return output


def get_unassigned_user_channels(googleID):
    """
    Finds all of the channel info for channels users do not have set
    :param googleID: User ID used to store and retrieve user information
    :return: The full channel information for the subset of channels users do not have scheduled to udpate
    """
    user_chosen_channels = get_user_channels(googleID, includeUpdateSchedule=False)
    # Getting all of the channels in the database
    all_channels = list(yt_channel_collection.find(filter={}))
    channel_information = {}
    output = []
    for channel in all_channels:
        # Only selecting the channels that the user has assigned an update schedule
        if channel["channelNames"] not in user_chosen_channels:
            # output.append(channel)
            channel_information[channel["channelNames"]] = channel

    ordered_names = sorted(list(channel_information.keys()), key=str.casefold)
    for name in ordered_names:
        output.append(channel_information[name])

    return output


def get_channel_of_video(videoID):
    channelID = yt_videos_collection.find_one(filter={"videoId": videoID})["channelId"]
    channelInfo = yt_channel_collection.find_one(filter={"channelId": channelID})
    return channelInfo


def set_update_schedule_channel(googleID, channelNames, finalUpdateTime):
    curr_user = db_users[googleID]
    for channel in channelNames:
        if curr_user.find_one(filter={"category": "updateSchedule", "channelName": channel}) is None:
            curr_user.insert_one({
                "category": "updateScheduler",
                "updateTime": "daily",
                "channelName": channel
            })
            print(channel, "added to", finalUpdateTime, "!")

        else:
            curr_user.update_one(filter={"category": "updateSchedule", "channelName": channel},
                                 update={"$set": {"updateTime": finalUpdateTime}})
            print(channel, "moved to", finalUpdateTime, "?")

    return finalUpdateTime


def get_favorite_videos(googleID):
    curr_user = db_users[googleID]
    favorites = curr_user.find(filter={"category": "favoriteVideo"})
    if favorites is None:
        return []
    output = []
    for vid in favorites:
        output.append(vid)
    return output


def check_video_in_favorite(googleID, fullVideoDetails):
    curr_user = db_users[googleID]
    findGiven = curr_user.find_one(filter={"category": "favoriteVideo", "videoId": fullVideoDetails["videoId"]})
    if findGiven is None:
        return False
    return True


def add_favorite_video(googleID, fullVideoDetails):
    curr_user = db_users[googleID]
    # print(fullVideoDetails)
    if check_video_in_favorite(googleID, fullVideoDetails):
        return "Already In"

    video_channel_info = get_channel_of_video(fullVideoDetails["videoId"])
    curr_user.insert_one({
        "category": "favoriteVideo",
        "videoId": fullVideoDetails["videoId"],
        "videoTitle": fullVideoDetails["videoTitle"],
        "uploadDate": fullVideoDetails["uploadDate"],
        "videoThumbnail": fullVideoDetails["videoThumbnail"],
        "channelName": video_channel_info["channelNames"]
    })
    return "Done"


def remove_favorite_video(googleID, fullVideoDetails):
    curr_user = db_users[googleID]
    if not check_video_in_favorite(googleID, fullVideoDetails):
        return "Data entry not in database, cannot be deleted"

    curr_user.delete_one(filter={"category": "favoriteVideo", "videoId": fullVideoDetails["videoId"]})
    return "Done"



def get_watchlater_videos(googleID):
    curr_user = db_users[googleID]
    favorites = curr_user.find(filter={"category": "watchLaterVideo"})
    if favorites is None:
        return []
    output = []
    for vid in favorites:
        output.append(vid)
    return output


def check_video_in_watchlater(googleID, fullVideoDetails):
    curr_user = db_users[googleID]
    findGiven = curr_user.find_one(filter={"category": "watchLaterVideo", "videoId": fullVideoDetails["videoId"]})
    if findGiven is None:
        return False
    return True


def add_watchlater_video(googleID, fullVideoDetails):
    curr_user = db_users[googleID]
    # print(fullVideoDetails)
    separated = fullVideoDetails["videoThumbnail"].split("/")[0:-1]
    separated.append("hqdefault.jpg")
    default_thumbnail = "/".join(separated)

    add_tracked_video(googleID, fullVideoDetails["videoId"], fullVideoDetails["videoTitle"], default_thumbnail)

    if check_video_in_watchlater(googleID, fullVideoDetails):
        return "Already In"

    video_channel_info = get_channel_of_video(fullVideoDetails["videoId"])
    curr_user.insert_one({
        "category": "watchLaterVideo",
        "videoId": fullVideoDetails["videoId"],
        "videoTitle": fullVideoDetails["videoTitle"],
        "uploadDate": fullVideoDetails["uploadDate"],
        "videoThumbnail": fullVideoDetails["videoThumbnail"],
        "channelName": video_channel_info["channelNames"]
    })
    return "Done"


def remove_watchlater_video(googleID, fullVideoDetails):
    curr_user = db_users[googleID]
    if not check_video_in_watchlater(googleID, fullVideoDetails):
        return "Data entry not in database, cannot be deleted"

    curr_user.delete_one(filter={"category": "watchLaterVideo", "videoId": fullVideoDetails["videoId"]})
    return "Done"


def get_all_tag_names(googleID):
    """
    Will find all current tag name options
    :param googleID: To get specific user information
    :return: String Array of all tag names
    """
    curr_user = db_users[googleID]
    return curr_user.find_one(filter={"category": "tagTypes"})["userTagTypes"]


def remove_tag_name(googleID, tag_name):
    """
    Will remove a tag from the available options and from all channels
    :param tag_name: Tag name to remove
    :param googleID: To get specific user information
    :return: String of the removed tag name
    """
    curr_user = db_users[googleID]
    tag_name = tag_name.replace('"', '')
    old_tag_types = get_all_tag_names(googleID)
    if tag_name not in old_tag_types:
        return -1
    old_tag_types.remove(tag_name)
    curr_user.update_one(filter={"category": "tagTypes"},
                         update={"$set": {"userTagTypes": old_tag_types}})

    curr_user.delete_many(filter={"category": "channelTag", "tagName": tag_name})
    curr_user.delete_one(filter={
        "category": "tagColor",
        "tagName": tag_name
    })
    return tag_name


def add_tag_name(googleID, tag_name):
    """
    Adds a new tag in the tag options
    :param googleID: To get specific user information
    :param tag_name: Tag name to add
    :return: The new tag that was added
    """
    curr_user = db_users[googleID]
    tag_name = tag_name.replace('"', '')
    old_tag_types = get_all_tag_names(googleID)
    if tag_name in old_tag_types:
        return -1
    old_tag_types.append(tag_name)
    curr_user.update_one(filter={"category": "tagTypes"},
                         update={"$set": {"userTagTypes": old_tag_types}})
    return tag_name


def add_tag_channel(googleID, channel_name, tag_name):
    """
    Adds an entry to show that a channel has a specific tag
    :param tag_name: The tag name to add to channel
    :param channel_name: Name of channel to add tag entry for
    :param googleID: To get specific user information
    :return: The Tag and Channel of which were updated
    """
    curr_user = db_users[googleID]
    # Make sure that the channel doesn't already have this tag
    tag_name = tag_name.replace('"', '')
    if tag_name in get_tags_of_channel(googleID, channel_name):
        return -1, -1
    curr_user.insert_one({
        "category": "channelTag",
        "channelName": channel_name,
        "tagName": tag_name
    })
    return tag_name, channel_name


def remove_tag_channel(googleID, channel_name, tag_name):
    """
    Remove the tag from a specific channel
    :param tag_name: Tag name to add to channel
    :param googleID: To get specific user information
    :param channel_name: Channel Name to affect
    :return: Channel and Tag name that was affected
    """
    curr_user = db_users[googleID]
    # make sure that the channel does have this tag
    tag_name = str(tag_name).replace('"', '')
    if tag_name not in get_tags_of_channel(googleID, channel_name):
        return -1, -1
    curr_user.delete_one(filter={
        "category": "channelTag",
        "channelName": channel_name,
        "tagName": tag_name
    })

    return tag_name, channel_name


def get_tags_of_channel(googleID, channel_name):
    """
    Finds all the tags for a specific channel
    :param googleID: To get specific user information
    :param channel_name: Channel to find tags for
    :return: String Array of the tags for a channel
    """
    curr_user = db_users[googleID]
    full_channel_tag_info = list(curr_user.find(filter={"category": "channelTag", "channelName": channel_name}))
    output = []
    for channel_tag in full_channel_tag_info:
        output.append(channel_tag["tagName"].replace('"', ''))
    return output


def get_channels_of_tag(googleID, tag_name):
    """
    Finds all the channels that have a specific tag
    :param googleID: To get specific user information
    :param tag_name: Tag to find channels which have it
    :return: String Array of channel names with the
    """
    curr_user = db_users[googleID]
    all_channel_info = list(curr_user.find(filter={"category": "channelTag", "tagName": tag_name}))
    output = []
    for channel in all_channel_info:
        output.append(channel["channelName"])
    return output


def get_color_of_tag(googleID, tag_name):
    curr_user = db_users[googleID]
    tag_color_info = curr_user.find_one(filter={
        "category": "tagColor",
        "tagName": tag_name
    })
    if tag_color_info:
        # print(f"Color of {tag_name} is {tag_color_info["tagColor"]}")
        return tag_color_info["tagColor"]
    # print("Error: No Tag_Color_Info information for tag -", tag_name)
    return "gray"


def add_color_of_tag(googleID, tag_name, tag_color):
    """

    :param googleID: To get specific user information
    :param tag_name: String of the tag name
    :param tag_color: String like "blue", "red", etc.
    :return: The tag name and color that were added
    """
    curr_user = db_users[googleID]
    # print(f"------------------{tag_name} added with the color {tag_color}")
    curr_user.insert_one({
        "category": "tagColor",
        "tagName": tag_name,
        "tagColor": tag_color
    })
    return tag_name, tag_color


def change_color_of_tag(googleID, tag_name, new_tag_color):
    curr_user = db_users[googleID]
    curr_user.update_one(filter={"category": "tagColor", "tagName": tag_name},
                         update={"$set": {"tagColor": new_tag_color}})
    return new_tag_color


def is_channel_in_db(googleID, channel_name):
    """
    Determines if a channel is in the database. Used in youtube.py instead of in the API
    :param googleID: To get specific user information
    :param channel_name: String of the channel to find if in the database
    :return: Boolean of if the channel is in the database
    """
    curr_user = db_users[googleID]
    channel_info = curr_user.find_one(filter={"category": "updateSchedule", "channelName": channel_name})
    if channel_info is None:
        return False
    return True


def add_new_channel(googleID, channel_name):
    """
    Will set a channel as unassigned in update schedule for a user
    This makes sure all channels that a person is subscribed to will be updated daily in the system
    :param googleID: To get specific user information
    :param channel_name: String of the channel to add (as unassigned)
    :return: The channel name and update that was added, or None if nothing was added
    """
    curr_user = db_users[googleID]
    channel_info = curr_user.find_one(filter={"category": "updateSchedule", "channelName": channel_name})
    if channel_info is None:
        curr_user.insert_one({"category": "updateSchedule", "updateTime": "unassigned", "channelName": channel_name})
        yt_update_schedule_collection.insert_one({"category": "unassigned", "channelName": channel_name})
        return channel_name, "unassigned"
    return None


def get_all_user_google():
    user_info = list(yt_user_collection.find(filter={}))
    user_gid_lst = []
    for user in user_info:
        user_gid_lst.append(user["googleID"])

    print("Total ID List:", user_gid_lst)
    return user_gid_lst


def add_user_google(googleID):
    if googleID in get_all_user_google():
        print("Recently tried to add", googleID, "but it was already in the database")
        return False
    yt_user_collection.insert_one({"googleID": googleID})
    print(googleID, "added to the collection")
    return googleID


def get_user_api(googleID):
    user = list(yt_user_collection.find(filter={"googleID": googleID}))[0]
    if len(user) > 0:
        return user["apiKey"]
    return "None"


def add_user_api(googleID, user_api_key):
    user_info = list(yt_user_collection.find(filter={"googleID": googleID}))
    newly_added = False
    if len(user_info) == 0:
        print("User with ID:", googleID, "not in the database, API key", user_api_key, "cannot be added")
    if "apiKey" not in user_info[0]:
        newly_added = True
    yt_user_collection.update_one(filter={"googleID": googleID},
                                  update={"$set": {"apiKey": user_api_key}})
    print("Adding the api key", user_api_key, "for GoogleID:", googleID)
    return googleID, user_api_key, newly_added


def get_user_channel_id(googleID):
    # print("LDF:", yt_user_collection.find(filter={"googleID": googleID}))
    user_info = list(yt_user_collection.find(filter={"googleID": googleID}))[0]
    if len(user_info) == 0:
        print("User with ID:", googleID, "not in the database")
    # print("UINF:", user_info)
    if 'channelID' not in user_info:
        print("User with googleID:", googleID, "does not have a channelID")
        return "None"
    return user_info["channelID"]


def add_user_channel_id(googleID, channelID):
    user_info = list(yt_user_collection.find(filter={"googleID": googleID}))
    newly_added = False
    if len(user_info) == 0:
        print("User with ID:", googleID, "not in the database, ChannelID", channelID, "cannot be added")
    if "channelID" not in user_info[0]:
        newly_added = True
    yt_user_collection.update_one(filter={"googleID": googleID},
                                  update={"$set": {"channelID": channelID}})
    print("Adding the channelID", channelID, "for GoogleID:", googleID)
    return googleID, channelID, newly_added


# def get_tracked_video(googleID, videoID):
#     curr_user = db_users[googleID]
#     tracked_video = curr_user.find_one(filter={"category": "trackedVideo", "videoID": videoID})
#     if tracked_video is None:
#         print("Tracked video with ID:", videoID, "not in system")
#         return {}
#     print("Getting video with ID:", videoID)
#     return tracked_video


def get_all_tracked_video(googleID):
    curr_user = db_users[googleID]
    return list(curr_user.find(filter={"category": "trackedVideo"}))


def add_tracked_video(googleID, videoID, videoTitle, videoThumbnail):
    curr_user = db_users[googleID]
    tracked_video = curr_user.find_one(filter={"category": "trackedVideo", "videoID": videoID})
    if tracked_video is not None:
        print("Tracked video with ID:", videoID, "already tracked")
        return "None"
    print("Adding video with ID:", videoID)
    full_video_info = {
        "category": "trackedVideo",
        "videoID": videoID,
        "videoTitle": videoTitle,
        "videoThumbnail": videoThumbnail
    }
    curr_user.insert_one(full_video_info)
    return full_video_info


def remove_tracked_video(googleID, videoID):
    curr_user = db_users[googleID]
    tracked_video = curr_user.find_one(filter={"category": "trackedVideo", "videoID": videoID})
    if tracked_video is not None:
        curr_user.delete_one(filter={"category": "trackedVideo", "videoID": videoID})
        return videoID
    return "None"


# --------- TESTING FUNCTIONS BELOW
def get_random_data():
    r = randint(0, 10)
    data = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"]
    try:
        return data[r]
    except Exception:
        return "r0"


def mongo_insert_test(calledAsIntended):
    name = get_random_data()
    tm = datetime.datetime.now()
    minu = datetime.datetime.now().minute
    minmod = datetime.datetime.now().minute % 1
    yt_test_collection.insert(
        {"After Update 8/3": "True", "name": name, "time": tm, "Minute": minu, "Minute Mod 1": minmod,
         "intendedCall": calledAsIntended})


def move_update_to_user(userID):
    daily_channels = list(yt_update_schedule_collection.find(filter={"category": "daily"}))
    weekly_channels = list(yt_update_schedule_collection.find(filter={"category": "weekly"}))
    monthly_channels = list(yt_update_schedule_collection.find(filter={"category": "monthly"}))

    curr_db = db_users[userID]
    curr_db.delete_many(filter={})
    print("Deleted all of user:", userID)

    total_daily = []
    for channel in daily_channels:
        total_daily.append(channel["channelName"])
    total_weekly = []
    for channel in weekly_channels:
        total_weekly.append(channel["channelName"])
    total_monthly = []
    for channel in monthly_channels:
        total_monthly.append(channel["channelName"])

    for channel in total_daily:
        curr_db.insert_one({"category": "updateSchedule", "updateTime": "daily", "channelName": channel})
    for channel in total_weekly:
        curr_db.insert_one({"category": "updateSchedule", "updateTime": "weekly", "channelName": channel})
    for channel in total_monthly:
        curr_db.insert_one({"category": "updateSchedule", "updateTime": "monthly", "channelName": channel})

    print("Added all of user:", userID)


def main():
    # clear_videos_database()
    # clear_channels_database()
    # connect_videos_many_db()
    # connect_channels_many_db()
    # print(db.list_collection_names({}))


    # set_update_schedules()
    # Daily - 18
    # Weekly - 40
    # Monthly - 40
    # yt_test_collection.delete_many(filter={"intendedCall": True})
    # yt_test_collection.delete_many(filter={"intendedCall": False})

    # all_videos = get_all_videos()
    # with open("channels.txt", "w") as f:
    #     f.write(str(all_videos))
    # print(len(all_videos))

    # user_me.insert_many(daily_channels)
    # user_me.delete_many(filter={"category":"daily"})
    # TODO - make sure to use the user's respective youtube API for this
    # TODO - use the below function to do the update for each user

    googleID = ""
    if "channelID" not in list(yt_user_collection.find(filter={"googleID": googleID}))[0]:
        print("New")
        output = yt_user_collection.find(filter={"googleID": googleID})
        print(list(output)[0])
        # print(list(output)[0])
    else:
        print("In There")

    # print(db_users.list_collection_names())
    # print("Added all of Test Data ")


if __name__ == "__main__":
    main()
