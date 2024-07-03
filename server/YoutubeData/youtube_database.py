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


# def insert_single(channelId, videoId, videoThumbnail, videoTitle):
#     videoInfo = {
#         "channelId": channelId,
#         "videoId": videoId,
#         "videoThumbnail": videoThumbnail,
#         "videoTitle": videoTitle
#     }
#     try:
#         yt_collection.insert_one(videoInfo).inserted_id
#         print("Inserted")
#     except Exception as e:
#         print(e)


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


# def connect_videos_many_db():
#     videoIds, videoTitles, videoThumbnails = get_video_info()
#     channelIds = get_channel_id_info()
#
#     print(len(channelIds), len(videoIds), len(videoTitles), len(videoThumbnails))
#     item_list_db = []
#
#     if len(videoIds) != len(videoTitles) or len(videoTitles) != len(videoThumbnails):
#         print("Something is wrong")
#         return
#
#     for i in range(len(videoIds)):
#         for j in range(0, 3):
#             item_list_db.append({
#                 "channelId": channelIds[i],
#                 "videoId": videoIds[i][j],
#                 "videoThumbnail": videoThumbnails[i][j],
#                 "videoTitle": videoTitles[i][j]
#             })
#     try:
#         yt_videos_collection.insert_many(item_list_db).inserted_ids
#         print("Accomplished bulk insert videos")
#     except Exception as e:
#         print(e)
#


# def connect_channels_many_db():
#     channelIds, channelImages, channelNames = get_channel_info()
#
#     print(len(channelIds), len(channelImages), len(channelNames))
#     item_list_db = []
#
#     if (len(channelIds) != len(channelImages)) or (len(channelImages) != len(channelNames)):
#         print("Something is wrong")
#         return
#
#     for i in range(len(channelIds)):
#         item_list_db.append({
#             "_id": i+1,
#             "channelId": channelIds[i],
#             "channelImage": channelImages[i],
#             "channelName": channelNames[i]
#         })
#
#     try:
#         yt_channel_collection.insert_many(item_list_db)
#         print("Accomplished bulk insert channels")
#     except Exception as e:
#         print(e)
#

def videos_db(chId):
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
    yt_test_collection.insert({"name": name, "time": tm, "Minute": minu, "Minute Mod 1": minmod, "intendedCall": calledAsIntended})


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
    # videos_db(chId="UCMiJRAwDNSNzuYeN2uWa0pA")

    # set_update_schedules()
    # Daily - 18
    # Weekly - 40
    # Monthly - 40
    yt_test_collection.delete_many(filter={"intendedCall": True})
    yt_test_collection.delete_many(filter={"intendedCall": False})
    print("Deletion of Test Data Done")


if __name__ == "__main__":
    main()
