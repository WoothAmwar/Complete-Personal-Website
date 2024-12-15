# import os

# import google_auth_oauthlib.flow
import datetime
import json

from googleapiclient.discovery import build  # referred to as google-api-python-client
# import pyautogui
from time import sleep

# TODO - add a period before "youtube_database" before deployment
from .youtube_database import (get_channel_name_info, replace_videos_many_db, replace_channels_many_db,
                              add_new_channel, is_channel_in_db, get_unassigned_channel_name_info, get_user_api,
                              get_all_user_google, get_user_channel_id)

# pyautogui.PAUSE = 0.2
# pyautogui.FAILSAFE = True

# UPDATE_DAILY = "./updateScheduleFiles/updateDaily.json"
# UPDATE_WEEKLY = "./updateScheduleFiles/updateWeekly.json"
# UPDATE_MONTHLY = "./updateScheduleFiles/updateMonthly.json"


def subscribed_channels(service, channel_id, nextPageToken, total_response):
    # service = build('youtube', 'v3', developerKey=api_key)

    if nextPageToken:
        request = service.subscriptions().list(
            part="snippet, contentDetails",
            channelId=channel_id,
            maxResults=50,
            pageToken=nextPageToken
        )
    else:
        request = service.subscriptions().list(
            part="snippet, contentDetails",
            channelId=channel_id,
            maxResults=50
        )

    response = request.execute()
    total_response.append(response)
    if "nextPageToken" in response:
        subscribed_channels(service, channel_id, response["nextPageToken"], total_response)

    # service.close()
    return total_response


def check_illegal_characters(text):
    for letterIdx in range(len(text)):
        if (ord(text[letterIdx]) >= 127) or (ord(text[letterIdx]) < 32):
            # print("Replaced")
            text = text.replace(text[letterIdx], " ")
    return text


def check_text_in_file(text, fileName, doHalves, doFirstHalf):
    # Assumed that if you have doFirstHalf=False, then you want to check second half
    with open(fileName, "r") as f:
        fileText = f.read()
        if doHalves:
            fileText = json.loads(fileText)
            fileText = fileText[list(fileText.keys())[0]]
            middleIdx = int(len(fileText) / 2)
            if doFirstHalf:
                fileText = fileText[0:middleIdx]
            else:
                fileText = fileText[middleIdx::]
    # return fileText
    return text in fileText


def full_subscribed_channels(service, channel_id):
    # tokens = ["", "CDIQAA", "CGQQAA"]
    # tokens = ["CGQQAA"]
    channelIdInfo = []
    channelNameInfo = []
    channelImageInfo = []
    channels = subscribed_channels(service, channel_id, nextPageToken="", total_response=[])

    for channel_items in channels:
        curr_channelIds = []
        items = channel_items["items"]
        if len(items) < 1:
            print("Yeah we out of here")
            break
        for i in range(len(items)):
            curr_channelIds.append(items[i]["snippet"]["resourceId"]["channelId"])
            channelImageInfo.append(items[i]["snippet"]["thumbnails"]["default"]["url"])
        for channelId in curr_channelIds:
            request = service.channels().list(
                part='snippet',
                id=channelId
            )
            response = request.execute()
            channelNameInfo.append(response["items"][0]["snippet"]["title"])
        channelIdInfo.extend(curr_channelIds)

        # with open("channels.txt", "a") as f:
        #     for i in range(len(channels["items"])):
        #         channelName = channels["items"][i]["snippet"]["title"]
        #         if check_text_in_file(channelName, UPDATE_DAILY, doHalves=False, doFirstHalf=False):
        #             f.write(channelName + "\n")
        #             searchIndexes.append(i)
        #         # If you are doing more than minimum, update weekly and monthly too
        #         if not doMinimum:
        #             if check_text_in_file(channelName, UPDATE_WEEKLY, doHalves=True, doFirstHalf=firstHalfDecider):
        #                 f.write(channelName + "\n")
        #                 searchIndexes.append(i)
        #             if check_text_in_file(channelName, UPDATE_MONTHLY, doHalves=True, doFirstHalf=firstHalfDecider):
        #                 f.write(channelName + "\n")
        #                 searchIndexes.append(i)

        # JSON Dumps Implementation
        # for i in searchIndexes:
        #     channelIdInfo.append(check_illegal_characters(
        #         channels["items"][i]["snippet"]["resourceId"]["channelId"]))
        #     channelNameInfo.append(check_illegal_characters(
        #         channels["items"][i]["snippet"]["title"]))
        #     channelImageInfo.append(channels["items"][i]["snippet"]["thumbnails"]["default"]["url"])

    # with open("channels.json", "w") as f:
    #     f.write(json.dumps(fullChannelInfo))
        for idx in range(len(channelNameInfo)):
            while channelNameInfo[idx][-1] == " ":
                print(channelNameInfo[idx],"has extra space at the end")
                channelNameInfo[idx] = channelNameInfo[idx][0:-1]

        # with open("channels.txt", "a") as f:
        #     for channel in channelNameInfo:
        #         f.write(channel+"\n")
        print("Written the page all out")

    return channelIdInfo, channelNameInfo, channelImageInfo


def channel_info(service, channelID, numVideos):
    videoIdList = []
    # request = youtube.search().list()
    # 100 quota cost for each service.search.list
    # TODO - add a thing that checks the length of a video. If it is less than 63 seconds, don't add it
    #   as this most likely means it is a short. Add numVideos amount of videos to videoList
    request = service.search().list(
        part='id',
        channelId=channelID,
        type='video',
        order='date',
        maxResults=numVideos
    )
    response = request.execute()
    # videoId for most recent videos
    for vid in response["items"]:
        videoIdList.append(vid["id"]["videoId"])

    return videoIdList


def video_titles(service, videoIdList):
    request = service.videos().list(
        part='snippet',
        id=videoIdList,
    )
    titleList = []
    thumbnailList = []
    response = request.execute()

    # with open("testFile.json", "w") as f:
    #     f.write(json.dumps(response["items"]))

    for title in response["items"]:
        text = title["snippet"]["title"]
        text = check_illegal_characters(text)
        titleList.append(text)

        try:
            thumbnailList.append(title["snippet"]["thumbnails"]["maxres"]["url"])
        except KeyError:
            try:
                thumbnailList.append(title["snippet"]["thumbnails"]["default"]["url"])
            except Exception as e:
                thumbnailList.append("https://picsum.photos/100")

    return titleList, thumbnailList


def video_upload_date(service, videoIdList):
    request = service.videos().list(
        part='snippet',
        id=videoIdList,
    )
    dateList = []
    response = request.execute()
    today_date = datetime.datetime.now()
    for info in response["items"]:
        vidUploadDate = info["snippet"]["publishedAt"]
        # Gets hours between the video upload date and current date (Python)
        # iso_format = '%Y-%m-%dT%H:%M:%SZ'
        # deltaDays = today_date - datetime.datetime.strptime(vidUploadDate, iso_format)
        # deltaHours = deltaDays.days*24 + deltaDays.seconds/3600
        dateList.append(vidUploadDate)

    return dateList


def embed_links(service, videoID, embedFile):
    # 1 quota cost for each service.videos.list
    request = service.videos().list(
        part='player',
        id=videoID,
        maxResults=2
    )
    response = request.execute()

    # Get the embed link from the video details.
    with open(embedFile, "a") as f:
        f.write(json.dumps(response["items"][0]["player"]["embedHtml"]) + "\n")


# def automate_scuff(total_url):
#     """
#     Not putting into the AWS Deployed version, I guess not allowed
#     :param total_url: The url for the information
#     :return: None, writes to a files
#     """
#     # Get to the right url
#     pyautogui.moveTo(800, 120, duration=0.5)
#     pyautogui.hotkey('alt', 'tab')
#     pyautogui.click()
#     pyautogui.click()
#     pyautogui.click()
#     for letter in total_url:
#         pyautogui.press(letter)
#     pyautogui.press("enter")
#     sleep(1.5)
#
#     # Copy all content into file
#     pyautogui.moveTo(800, 800, duration=0.5)
#     pyautogui.click()
#     pyautogui.hotkey("ctrl", "a")
#     pyautogui.hotkey("ctrl", "c")
#     #  switch back to python
#     pyautogui.hotkey('alt', 'tab')
#     pyautogui.hotkey('ctrl', 'tab')
#     pyautogui.hotkey('ctrl', 'a')
#     pyautogui.hotkey('ctrl', 'v')
#     pyautogui.click()
#     pyautogui.hotkey('ctrl', 's')
#     pyautogui.hotkey('ctrl', 'tab')
#
#     # Get info from json file
#     with open('text_info.txt', "r", encoding="utf8") as f:
#         info = json.loads(f.read())
#         channelID = info["items"][0]["snippet"]["channelId"]
#         channelTITLE = info["items"][0]["snippet"]["channelTitle"]
#         with open("channelIDInfo.txt", "a+", encoding="utf8") as g:
#             appStr = "{{{0}:{1}}}".format(channelTITLE, channelID)
#             g.write(str(appStr) + ",")


def write_to_new_embed(embedFile):
    with open("embedHTMl.json", "r") as f:
        with open(embedFile, "w") as g:
            g.write(f.read())


def single_reset_files(doEmbed):
    # Never do channelIDInfo, videoId
    with open('channels.txt', "w") as f:
        f.write("")

    if doEmbed:
        with open('embedHTMl.json', "w") as f:
            f.write("")


def main_write_files(channelIdInfo, channelNameInfo, channelImageInfo):
    with open("automaticChannelIdInfo.json", "w") as f:
        f.write(json.dumps({"channelIds": channelIdInfo}))

    with open("automaticChannelNameInfo.json", "w") as f:
        f.write(json.dumps({"names": channelNameInfo}))

    with open("automaticChannelImageInfo.json", "w") as f:
        f.write(json.dumps({"channelImages": channelImageInfo}))


def filter_by_update(googleID, channelIdInfo, channelNameInfo, channelImageInfo, doMinimum=False):
    # TODO - to only update channels that are unassigned and are new channels, check if the channel is in
    #  youtube/channels. If not, then update. If it is, then don't (it is unassigned)
    daily_channels, weekly_channels, monthly_channels, unassigned_channels = get_channel_name_info(googleID)
    update_sched_channels = [daily_channels, weekly_channels, monthly_channels, unassigned_channels]

    # Do every other, either start at index 0 or 1
    startingIndex = int(datetime.datetime.now().day) % 2
    # startingIndex = 0

    full_update_list = []
    full_update_list.extend(daily_channels)
    name_index_list = []
    for itm in daily_channels:
        if itm in channelNameInfo:
            name_index_list.append(channelNameInfo.index(itm))

    if not doMinimum:
        for i in range(1, len(update_sched_channels)):
            skip_val = 2
            if i == 3:
                skip_val = 1

            for j in range(startingIndex, len(update_sched_channels[i]), skip_val):
                if update_sched_channels[i][j] not in channelNameInfo:
                    print("Skipping", update_sched_channels[i][j])
                    continue

                print(j, "-", update_sched_channels[i][j])
                full_update_list.append(update_sched_channels[i][j])
                name_index_list.append(channelNameInfo.index(update_sched_channels[i][j]))

    newIdInfo = []
    newNameInfo = []
    newImageInfo = []
    for idx in name_index_list:
        newIdInfo.append(channelIdInfo[idx])
        newNameInfo.append(channelNameInfo[idx])
        newImageInfo.append(channelImageInfo[idx])

    return newIdInfo, newNameInfo, newImageInfo


def filter_by_length(videoId):
    # https://www.googleapis.com/youtube/v3/videos?key=AIzaSyC3SJjz3kmksCgOdtJiMLgf2t6MgfMfL3w&part=contentDetails&id=WDfAC4WI_GA
    # Find when video less than 1 Min 10 Sec, including under 1 minute
    # If so, skip this video, so return False
    # Else, return true
    pass


def get_single_video_info(googleID, videoID):
    api_key = get_user_api(googleID)
    # channel_id = get_user_channel_id(googleID)
    service = build('youtube', 'v3', developerKey=api_key)

    request = service.videos().list(
        part='snippet',
        id=videoID,
        maxResults=2
    )
    response = request.execute()
    video_title = response["items"][0]["snippet"]["title"]
    video_thumbnail = response["items"][0]["snippet"]["thumbnails"]["high"]["url"]

    return video_title, video_thumbnail

    # with open("testFile.json", "w") as f:
    #     f.write(json.dumps(response))

def try_add_new_channel(googleID, singleChannelName):
    # TODO - Make sure to run this function using the googleID of the user
    if is_channel_in_db(googleID, singleChannelName):
        # print(singleChannelName,"in db already")
        return False
    add_result = add_new_channel(googleID, singleChannelName)
    print("Added the channel", add_result)
    return True


def complete_reload(googleID, doReturn=False):
    # TODO - add Kurzgesagt channel, couldn't because illegal character
    # embedLink = "embedFiles/embedHTML-" + str(datetime.datetime.now().strftime("-%m-%d-%H-%M-%S")) + ".txt"
    # print(embedLink)

    # write_to_new_embed(embedLink)
    # Useless function below
    # single_reset_files(doEmbed=False)

    api_key = "AIzaSyAy05SkDd2lZTeAEIxtCwUmzXDHOx_jl-E"
    # api_key = get_user_api(googleID)
    channel_id = get_user_channel_id(googleID)
    if api_key == "None" or channel_id == "None":
        return -1

    service = build('youtube', 'v3', developerKey=api_key)

    # Gets list of all channels, regardless of value of doMinimum
    channelIdInfo, channelNameInfo, channelImageInfo = full_subscribed_channels(service, channel_id)

    # Adds any channels that are not in the database yet
    unassigned_channel_names = get_unassigned_channel_name_info(googleID)
    print("Unassigned Channels:", unassigned_channel_names)
    remove_lst_name = []
    remove_lst_id = []
    remove_lst_image = []
    for channelName in channelNameInfo:
        # try_add_new_channel(channelName)
        # If the channel is unassigned and not just added, remove from update list
        # If the channel is unassigned and was just added, keep it in the update list
        if not try_add_new_channel(googleID, channelName) and channelName in unassigned_channel_names:
            print("Wish to delete", channelName, "with index", channelNameInfo.index(channelName))
            idx = channelNameInfo.index(channelName)
            remove_lst_name.append(channelName)
            remove_lst_id.append(channelIdInfo[idx])
            remove_lst_image.append(channelImageInfo[idx])

    for rmIdx in range(len(remove_lst_name)):
        print("Deleted", remove_lst_name[rmIdx], "from update list | ID:", remove_lst_id[rmIdx],
              "| Image Link:", remove_lst_image[rmIdx])
        channelNameInfo.remove(remove_lst_name[rmIdx])
        channelIdInfo.remove(remove_lst_id[rmIdx])
        channelImageInfo.remove(remove_lst_image[rmIdx])

    # Only selects channels that will be updated on a specific day
    # doMinimum means only updateDaily, doesn't even look at weekly or monthly
    channelIdInfo, channelNameInfo, channelImageInfo = filter_by_update(
        googleID,
        channelIdInfo, channelNameInfo, channelImageInfo,
        doMinimum=False
    )

    # main_write_files(
    #     channelIdInfo=channelIdInfo,
    #     channelNameInfo=channelNameInfo,
    #     channelImageInfo=channelImageInfo)

    totalVideoIdList = []
    totalVideoTitleList = []
    totalVideoThumbnailList = []
    totalUploadDateList = []
    for idx in range(len(channelIdInfo)):
        videoIdList = channel_info(service, channelID=channelIdInfo[idx], numVideos=3)
        totalVideoIdList.append(videoIdList)
        # embed_links(videoIdList[0], embedFile=embedLink)
        titleList, thumbnailList = video_titles(service, videoIdList=videoIdList)
        totalVideoTitleList.append(titleList)
        totalVideoThumbnailList.append(thumbnailList)

        print("#", idx + 1, "-", channelNameInfo[idx], "=",channelIdInfo[idx], ":", videoIdList)

        uploadDateList = video_upload_date(service, videoIdList=videoIdList)
        totalUploadDateList.append(uploadDateList)
        print("Dates:", uploadDateList)

    replace_videos_many_db(
        channelIdList=channelIdInfo,
        videoIdList=totalVideoIdList,
        titleList=totalVideoTitleList,
        thumbnailList=totalVideoThumbnailList,
        uploadDateList=totalUploadDateList)

    replace_channels_many_db(
        channelIdList=channelIdInfo,
        channelImageList=channelImageInfo,
        channelNameList=channelNameInfo)

    if doReturn:
        return totalVideoIdList, totalVideoTitleList, totalVideoThumbnailList, totalUploadDateList


def test():
    return "BYEBYEBYEBYE"


def main():
    # googleID = "113385767862195154808"
    # totalVideoIdList, totalVideoTitleList, totalVideoThumbnailList, totalUploadDateList = complete_reload(googleID, doReturn=True)

    # Testing to realize that you have to make subscriptions public
    # google_info = get_all_user_google()
    # googleID = google_info[1]
    # api_key = get_user_api(googleID)
    # channel_id = get_user_channel_id(googleID)
    # # print(api_key, channel_id)
    #
    # service = build('youtube', 'v3', developerKey=api_key)
    #
    # # Gets list of all channels, regardless of value of doMinimum
    # channelIdInfo, channelNameInfo, channelImageInfo = full_subscribed_channels(service, channel_id)
    # print(channelNameInfo)


    # UCVkgOCFu4mnS1VI9BUvk_QQ
    # api_key = get_user_api(googleID)
    # channel_id = get_user_channel_id(googleID)
    # service = build('youtube', 'v3', developerKey=api_key)
    # channels = subscribed_channels(service, channel_id, nextPageToken="", total_response=[])
    # for i in range(len(channels)):
    #     print(len(channels[i]["items"]))

    # all_user_google_ids = get_all_user_google()
    # print(all_user_google_ids)
    # for googleID in all_user_google_ids:
    #     complete_reload(googleID, doReturn=False)

    # with open("automaticVideoIdInfo.json", "w") as f:
    #     f.write(json.dumps({"videoIds": totalVideoIdList}))
    # with open("automaticVideoTitleInfo.json", "w") as f:
    #     f.write(json.dumps({"videoTitles": totalVideoTitleList}))
    # with open("automaticVideoThumbnailInfo.json", "w") as f:
    #     f.write(json.dumps({"videoThumbnails": totalVideoThumbnailList}))
    # with open("automaticVideoUploadDateInfo.json", "w") as f:
    #     f.write(json.dumps({"uploadDates": totalUploadDateList}))

    # Automatically get channelId info with pyautogui
    # with open("videoId.txt", "r") as f:
    #     lines = f.readlines()
    #     for idx in range(0, len(lines)):
    #         lines[idx] = lines[idx].rstrip('\n')
    #     for videoID in lines:
    #         total_url = "https://www.googleapis.com/youtube/v3/videos?key=AIzaSyC3SJjz3kmksCgOdtJiMLgf2t6MgfMfL3w" \
    #                     "&part=snippet&id=" + videoID
    #         automate_scuff(total_url)
    pass

if __name__ == "__main__":
    main()
