import json
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

from random import randint

uri = "mongodb+srv://anwar09102005:w8kRzw681NZM6VHI@prod-yt.10vdjom.mongodb.net/?retryWrites=true&w=majority&appName" \
      "=prod-yt "

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

db = client["youtube"]  # prod-yt/youtube
yt_videos_collection = db["videos"]  # prod-yt/youtube/videos
yt_channel_collection = db["channels"]  # prod-yt/youtube/channels

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


def get_video_info():
    with open("automaticVideoIdInfo.json", "r") as f:
        videoIds = json.loads(f.readlines()[0])["videoIds"]
    with open("automaticVideoTitleInfo.json", "r") as f:
        videoTitles = json.loads(f.readlines()[0])["videoTitles"]
    with open("automaticVideoThumbnailInfo.json", "r") as f:
        videoThumbnails = json.loads(f.readlines()[0])["videoThumbnails"]

    return videoIds, videoTitles, videoThumbnails


def get_channel_id_info():
    with open('automaticChannelIdInfo.json', "r") as f:
        channelIds = json.loads(f.readlines()[0])["channelIds"]

    return channelIds


def get_channel_info():
    with open('automaticChannelImageInfo.json', "r") as f:
        channelImages = json.loads(f.readlines()[0])["channelImages"]
    with open('automaticChannelNameInfo.json', "r") as f:
        channelNames = json.loads(f.readlines()[0])["names"]

    return get_channel_id_info(), channelImages, channelNames


def connect_videos_many_db():
    videoIds, videoTitles, videoThumbnails = get_video_info()
    channelIds = get_channel_id_info()

    print(len(channelIds), len(videoIds), len(videoTitles), len(videoThumbnails))
    item_list_db = []

    if len(videoIds) != len(videoTitles) or len(videoTitles) != len(videoThumbnails):
        print("Something is wrong")
        return

    for i in range(len(videoIds)):
        for j in range(0, 3):
            item_list_db.append({
                "channelId": channelIds[i],
                "videoId": videoIds[i][j],
                "videoThumbnail": videoThumbnails[i][j],
                "videoTitle": videoTitles[i][j]
            })
    try:
        yt_videos_collection.insert_many(item_list_db).inserted_ids
        print("Accomplished bulk insert videos")
    except Exception as e:
        print(e)


def connect_channels_many_db():
    channelIds, channelImages, channelNames = get_channel_info()

    print(len(channelIds), len(channelImages), len(channelNames))
    item_list_db = []

    if (len(channelIds) != len(channelImages)) or (len(channelImages) != len(channelNames)):
        print("Something is wrong")
        return

    for i in range(len(channelIds)):
        item_list_db.append({
            "_id": i+1,
            "channelId": channelIds[i],
            "channelImage": channelImages[i],
            "channelName": channelNames[i]
        })

    try:
        yt_channel_collection.insert_many(item_list_db)
        print("Accomplished bulk insert channels")
    except Exception as e:
        print(e)


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
            "channelImage":channelImageList[channelIdx],
            "channelName": channelNameList[channelIdx]
        })
    try:
        yt_channel_collection.insert_many(total_item_list)
        print("Accomplished bulk insert channels")
    except Exception as e:
        print(e)


def get_random_data():
    r = randint(0, 10)
    data = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"]
    try:
        return data[r]
    except Exception:
        return "r0"

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
    print("Done")


if __name__ == "__main__":
    main()
