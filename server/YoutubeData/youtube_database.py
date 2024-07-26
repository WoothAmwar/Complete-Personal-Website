import datetime
import json
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

from random import randint

import certifi

ca = certifi.where()

uri = "mongodb+srv://anwar09102005:w8kRzw681NZM6VHI@prod-yt.10vdjom.mongodb.net/?retryWrites=true&w=majority&appName" \
      "=prod-yt "

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=ca)

db = client["youtube"]  # prod-yt/youtube
yt_videos_collection = db["videos"]  # prod-yt/youtube/videos
yt_channel_collection = db["channels"]  # prod-yt/youtube/channels
yt_update_schedule_collection = db["update_schedule"]  # prod-yt/youtube/update_schedule
yt_test_collection = db["testing"]  # prod-yt/youtube/testing

db_users = client["users"]  # prod-yt/users
user_me = db_users["113385767862195154808"]  # prod-yt/users/113385767862195154808


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
        for vidIdx in range(3):
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


def get_channel_name_info():
    """
    Finds the channels corresponding to the update schedule
    :return: Daily, Weekly, and Monthly channels, in that order
    """
    daily_channels = list(yt_update_schedule_collection.find(filter={"category": "daily"}))
    weekly_channels = list(yt_update_schedule_collection.find(filter={"category": "weekly"}))
    monthly_channels = list(yt_update_schedule_collection.find(filter={"category": "monthly"}))

    return mongo_name_extraction(daily_channels), mongo_name_extraction(weekly_channels), mongo_name_extraction(
        monthly_channels)


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
        if curr_user.find_one(filter={"category": "updateSchedule", "channelName":channel}) is None:
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


def get_all_tag_names(googleID):
    """
    Will find all current tag name options
    :param googleID: To get specific user information
    :return: String Array of all tag names
    """
    curr_user = db_users[googleID]
    return curr_user.find_one(filter={"category":"tagTypes"})["userTagTypes"]


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

    curr_user.delete_many(filter={"category": "channelTag", "tagName":tag_name})
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
    full_channel_tag_info = list(curr_user.find(filter={"category":"channelTag", "channelName":channel_name}))
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
    all_channel_info = list(curr_user.find(filter={"category":"channelTag", "tagName":tag_name}))
    output = []
    for channel in all_channel_info:
        output.append(channel["channelName"])
    return output


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
        {"name": name, "time": tm, "Minute": minu, "Minute Mod 1": minmod, "intendedCall": calledAsIntended})


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

    # Not in it
    # UClCUtBCBJw1UB3PDwW_Jemg
    # In it
    # UCMiJRAwDNSNzuYeN2uWa0pA
    # videos_del_db(chId="UCMiJRAwDNSNzuYeN2uWa0pA")

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
    # move_update_to_user("113385767862195154808")
    googleID = "113385767862195154808"
    # print(db_users.list_collection_names())
    # print("Added all of Test Data ")
    # print("All tag names:", get_all_tag_names("113385767862195154808"))
    print("Added tag programming:", add_tag_name(googleID, "programming"))


if __name__ == "__main__":
    main()
