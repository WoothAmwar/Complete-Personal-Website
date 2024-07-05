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


def get_all_channels(googleID):
    user_chosen_channels = get_user_channels(googleID)
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
    for channel in get_all_channels(googleID):
        all_channel_ids.append(channel["channelId"])

    vidSeparateId = []
    for channel_id in all_channel_ids:
        vidSeparateId.append(yt_videos_collection.find(filter={"channelId": channel_id}))
    return vidSeparateId


def get_user_channels(googleID):
    # Getting all of the channels that are assigned by the user into an update schedule
    curr_user = db_users[googleID]
    user_channels = list(curr_user.find(filter={"category": "updateSchedule"}))
    user_chosen_output = []
    for channel in user_channels:
        user_chosen_output.append(channel["channelName"])
    return user_chosen_output


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
        curr_db.insert_one({"category":"updateSchedule", "updateTime": "daily", "channelName": channel})
    for channel in total_weekly:
        curr_db.insert_one({"category":"updateSchedule", "updateTime": "weekly", "channelName": channel})
    for channel in total_monthly:
        curr_db.insert_one({"category":"updateSchedule", "updateTime": "monthly", "channelName": channel})

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
    get_all_channels("113385767862195154808")
    print(db_users.list_collection_names())
    print("Added all of Test Data ")


if __name__ == "__main__":
    main()
