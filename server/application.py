import datetime
import json
import time

from bson import json_util
from flask import Flask, jsonify, request
from flask_apscheduler import APScheduler
from flask_cors import CORS, cross_origin

from WebText.link_saving import Novel
from YoutubeData.youtube import complete_reload, test
from YoutubeData.youtube_database import (get_random_data, mongo_insert_test, get_all_user_channels, get_all_videos, \
    add_favorite_video, get_favorite_videos, remove_favorite_video, get_update_user_channels, \
    get_unassigned_user_channels, set_update_schedule_channel, get_all_tag_names, add_tag_channel, remove_tag_channel,
    get_tags_of_channel, get_channels_of_tag, add_tag_name, remove_tag_name,
    get_color_of_tag, add_color_of_tag, change_color_of_tag)


# from random import randint


# set configuration values
class Config:
    SCHEDULER_API_ENABLED = True


# app instance
application = Flask(__name__)
application.config.from_object(Config())
CORS(application, supports_credentials=True,
     origins=["http://localhost:3000", "https://complete-website-humanwooths-projects.vercel.app"])

scheduler = APScheduler()
scheduler.init_app(application)
scheduler.start()

# ---------- WebText.link_saving
# Information for LOTM class
lotm = Novel(title="Lord of the Mysteries",
             max_chapter=1432,
             novel_base_link="https://www.lightnovelworld.com/novel/lord-of-the-mysteries-275")


# print("Generate a new LOTM")
# ----------

def isUpdateTime(upd_hour, upd_min, upd_sec, useModulus=False, isDevelopment=False):
    """
    Finds out if the time is equal to parameter values
    :param isDevelopment: If true, adds hours to account that datetime.now() currently defaults to UTC timezone
    :param upd_hour: Hour, in 24 hours time scale
    :param upd_min: Minute to update
    :param upd_sec: Second, usually 1 to update that minute
    :param useModulus: If true, will update every minute that is a multiple of upd_min. If false, only that minute
    :return: Boolean of if the current time is within the range of values acceptable from these parameters
    """
    real_hour = upd_hour
    if isDevelopment:
        # This means in UTC time, which is ~4 hours ahead, depending on daylight savings and that stuff
        real_hour += 4
        # Could also do
        real_hour = real_hour % 24

    # isMinute = False
    current_time = datetime.datetime.now()
    if useModulus:
        isMinute = (current_time.minute % upd_min) == 0
    else:
        isMinute = current_time.minute == upd_min
    if (current_time.hour == real_hour) and isMinute and (current_time.second <= upd_sec):
        return True
    return False


# ----------

@scheduler.task('cron', id='youtube_job', hour=15, minute=30, second=0)
def youtube_job():
    """
    Calls the return_home function at a specific time every day
    :return: None
    """
    # print("Doing the thing")
    mongo_insert_test(calledAsIntended=False)
    complete_reload(doReturn=False)
    # with scheduler.app.app_context():
    # complete_reload(doReturn=False)


t = ""
info = ""


# /api/home
@application.route("/api/home", methods=['GET'])
@cross_origin()
def return_home():
    global t, info
    t = (datetime.datetime.now().hour, datetime.datetime.now().minute, datetime.datetime.now().second)
    isDevelopment = True
    thatTime = isUpdateTime(upd_hour=20, upd_min=43, upd_sec=1, useModulus=False, isDevelopment=isDevelopment)
    if isUpdateTime(upd_hour=20, upd_min=43, upd_sec=1, useModulus=False, isDevelopment=isDevelopment):
        t = get_random_data()
        # info, titList, thumbList, updateList = complete_reload(doReturn=True)
        info = test()

        mongo_insert_test(calledAsIntended=True)
        # print(t, info)
        time.sleep(4)

    return jsonify({
        'message': "UChicago Monday V.2",
        'info': ['p1', 'p2', 'p3'],
        'yt_data': t,
        'py_data': info,
        'upd_msg': thatTime
    })


@application.route("/api/tracker", methods=['GET'])
@cross_origin()
def return_lotm_info():
    rdm_chapter = lotm.get_chapter_number()
    if isUpdateTime(upd_hour=17, upd_min=1, upd_sec=1, useModulus=True):
        lotm.generate_random_chapter()
        time.sleep(3)

    return jsonify({
        'web_title': lotm.get_title(),
        'web_chapter': rdm_chapter
    })


@application.route("/api/channels/<googleID>", methods=['GET'])
def return_all_channels(googleID):
    # response = jsonify(json_util.dumps(get_all_channels(googleID)))
    # response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    # return response
    # print("That thing is here", googleID)
    return json_util.dumps(get_all_user_channels(googleID))


@application.route("/api/videos/<googleID>", methods=['GET'])
def return_all_videos(googleID):
    # response = jsonify(json_util.dumps(get_all_videos(googleID)))
    # response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    # return response
    # print("That thing is here", googleID)
    return json_util.dumps(get_all_videos(googleID))


@application.route("/api/channels/daily/<googleID>", methods=['GET', 'PUT'])
def return_daily_schedule_channels(googleID):
    """
    Finds the information for all of the channels that the user has specified as updateDaily
    :param googleID: User ID used to store and retrieve information
    :return: JSON of full information for updateDaily channels, descending order by channel name
    """
    if request.method == "GET":
        return json_util.dumps(get_update_user_channels(googleID, updateSchedule="daily"))

    elif request.method == "PUT":
        request_data = json.loads(request.data)
        channels_to_move = request_data["data"]
        move_location = request_data["location"]
        # print("VINFO:", channels_to_move)
        # print("LOC:", move_location)
        set_update_schedule_channel(googleID, channels_to_move, move_location)

        return jsonify({"data": channels_to_move, "loc": move_location})


@application.route("/api/channels/weekly/<googleID>", methods=['GET', 'PUT'])
def return_weekly_schedule_channels(googleID):
    """
    Finds the information for all of the channels that the user has specified as updateWeekly
    :param googleID: User ID used to store and retrieve information
    :return: JSON of full information for updateWeekly channels, descending order by channel name
    """
    if request.method == "GET":
        return json_util.dumps(get_update_user_channels(googleID, updateSchedule="weekly"))

    elif request.method == "PUT":
        request_data = json.loads(request.data)
        channels_to_move = request_data["data"]
        move_location = request_data["location"]
        # print("VINFO:", channels_to_move)
        # print("LOC:", move_location)
        set_update_schedule_channel(googleID, channels_to_move, move_location)

        return jsonify({"data": channels_to_move, "loc": move_location})


@application.route("/api/channels/monthly/<googleID>", methods=['GET', 'PUT'])
def return_monthly_schedule_channels(googleID):
    """
    Finds the information for all of the channels that the user has specified as updateMonthly
    :param googleID: User ID used to store and retrieve information
    :return: JSON of full information for updateMonthly channels, descending order by channel name
    """
    if request.method == "GET":
        return json_util.dumps(get_update_user_channels(googleID, updateSchedule="monthly"))

    elif request.method == "PUT":
        request_data = json.loads(request.data)
        channels_to_move = request_data["data"]
        move_location = request_data["location"]
        # print("VINFO:", channels_to_move)
        # print("LOC:", move_location)
        set_update_schedule_channel(googleID, channels_to_move, move_location)

        return jsonify({"data": channels_to_move, "loc": move_location})


@application.route("/api/channels/unassigned/<googleID>", methods=['GET', 'PUT'])
def return_unassigned_schedule_channels(googleID):
    """
    Finds the information for all the channels that the user has not specified
    :param googleID: User ID used to store and retrieve information
    :return: JSON of full information for unassigned channels, descending order by channel name
    """
    if request.method == "GET":
        unassigned_channels = get_update_user_channels(googleID, updateSchedule="unassigned")
        return json_util.dumps(unassigned_channels)
        # TODO - add functionality that updates channels not subscribed to, but based solely on db content
        #  Absent channels not in main youtube/update-schedule db collection, which is why not working probably
        # absent_channels = get_unassigned_user_channels(googleID)
        # return json_util.dumps(unassigned_channels + absent_channels)

    elif request.method == "PUT":
        request_data = json.loads(request.data)
        channels_to_move = request_data["data"]
        move_location = request_data["location"]
        # print("VINFO:", channels_to_move)
        # print("LOC:", move_location)
        set_update_schedule_channel(googleID, channels_to_move, move_location)

        return jsonify({"data": channels_to_move, "loc": move_location})


@application.route("/api/videos/favorites/<googleID>", methods=['GET', 'PUT', 'DELETE'])
def manage_favorite_videos(googleID):
    # response = jsonify(json_util.dumps(get_all_videos(googleID)))
    # response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    # return response
    if request.method == 'GET':
        favorites = json_util.dumps(get_favorite_videos(googleID))
        return jsonify({'data': favorites})

    elif request.method == 'PUT':
        videoInfo_to_favorite = json.loads(request.data)["data"]

        action = add_favorite_video(googleID, videoInfo_to_favorite)
        return jsonify({'data': action})

    elif request.method == 'DELETE':
        videoInfo_to_favorite = json.loads(request.data)["data"]
        action = remove_favorite_video(googleID, videoInfo_to_favorite)
        return jsonify({'data': action})


@application.route("/api/channels/tags/<googleID>", methods=['GET', 'PUT', 'DELETE'])
def manage_tag_names(googleID):
    if request.method == 'GET':
        tags = json_util.dumps(get_all_tag_names(googleID))
        return jsonify({'data': tags})

    elif request.method == 'PUT':
        # print("RAW PUT TAG:", json.loads(request.data)["data"])
        new_tag = json.loads(request.data)["data"]["db_text"]
        added_tag = add_tag_name(googleID, new_tag)
        # print(f"Adding the tag {added_tag} with default color gray")
        add_color_of_tag(googleID, added_tag, tag_color="gray")
        added_tag = json_util.dumps(added_tag)
        return jsonify({"data": added_tag})

    elif request.method == 'DELETE':
        # print("RAW DELETE DATA:", json.loads(request.data)["data"]["tagName"])
        delete_tag = json.loads(request.data)["data"]["tagName"]
        removed_tag = json_util.dumps(remove_tag_name(googleID, delete_tag))
        # print("Delete DTA RETURN:", removed_tag, "of type", type(removed_tag))
        return jsonify({"data": removed_tag})


@application.route("/api/channels/colorsOfTag/<googleID>/<tagName>", methods=['GET', 'PUT'])
def manage_tag_colors(googleID, tagName):
    if request.method == "GET":
        tag_color = json_util.dumps(get_color_of_tag(googleID, tagName))
        # print(f"Got the tag color of {tagName} as {tag_color}, which is type of {type(tag_color)}")
        return jsonify({"data": tag_color})

    elif request.method == "PUT":
        # Error - tagColor not there
        # print(json.loads(request.data))
        new_color = json.loads(request.data)["data"]["tagColor"]
        new_tag_color = json_util.dumps(change_color_of_tag(googleID, tagName, new_color))
        # print(f"Changed the tag color of {tagName} to {new_tag_color}")
        return jsonify({"data": new_tag_color})


@application.route("/api/channels/channelsOfTag/<googleID>/<tagName>", methods=['GET'])
def return_channels_of_tag(googleID, tagName):
    # filter_tag_name = json.loads(request.data)["data"]
    if tagName == "None":
        return jsonify({"data":json_util.dumps(["None"])})
    channel_names = json_util.dumps(get_channels_of_tag(googleID, tagName))
    return jsonify({"data": channel_names})


@application.route("/api/channels/channelWithTags/<googleID>/<channelName>", methods=['GET', 'PUT', 'DELETE'])
def operate_on_tags_of_channel(googleID, channelName):
    if request.method == 'GET':
        # Returns all the tags for a specific channel
        tags_of_channel = json_util.dumps(get_tags_of_channel(googleID, channelName))
        return jsonify({"data": tags_of_channel})

    elif request.method == 'PUT':
        # Adds the tag passed in as body to the channel
        tag_to_add = json.loads(request.data)["data"]["tagName"]
        added_tag_name, added_channel_name = add_tag_channel(googleID, channelName, tag_to_add)
        return jsonify({"data":[added_tag_name, added_channel_name]})

    elif request.method == 'DELETE':
        # Removes the tag passed in as body to the channel
        tag_to_remove = json.loads(request.data)["data"]["tagName"]
        removed_tag_name, removed_channel_name = remove_tag_channel(googleID, channelName, tag_to_remove)
        return jsonify({"data": [removed_tag_name, removed_channel_name]})


# ----------------- TESTING -----------------
# some bits of text for the page.
header_text = '''
    <html>\n<head> <title>EB Flask Test</title> </head>\n<body>'''
instructions = '''
    <p><em>Hint</em>: This is a RESTful web service! Append a username
    to the URL (for example: <code>/Thelonious</code>) to say hello to
    someone specific. Or NOT</p>\n'''
home_link = '<p><a href="/">Back</a></p>\n'
footer_text = '</body>\n</html>'

# add a rule for the index page.
application.add_url_rule('/', 'index', (lambda: header_text + instructions + footer_text))

# add a rule when the page is accessed with a name appended to the site
# URL.
application.add_url_rule('/<username>', 'hello', (lambda username: header_text + username + home_link + footer_text))

if __name__ == "__main__":
    scheduler.start()
    # debug=True for development, remove for production
    # application.debug = True
    application.run(debug=True, port=5000)
