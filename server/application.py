import datetime
import time

from flask_apscheduler import APScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import utc
import json
from bson import json_util


from flask import Flask, jsonify
from flask_cors import CORS, cross_origin
from YoutubeData.youtube_database import get_random_data, mongo_insert_test, get_all_channels, get_all_videos
from YoutubeData.youtube import complete_reload, test
from WebText.link_saving import Novel
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

    isMinute = False
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
    print("Doing the thing")
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
    print("That thing is here", googleID)
    return json_util.dumps(get_all_channels(googleID))


@application.route("/api/videos/<googleID>", methods=['GET'])
def return_all_videos(googleID):
    # response = jsonify(json_util.dumps(get_all_videos(googleID)))
    # response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    # return response
    print("That thing is here", googleID)
    return json_util.dumps(get_all_videos(googleID))

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
    # scheduler.start()
    # debug=True for development, remove for production
    # application.debug = True
    application.run(debug=True, port=5000)
