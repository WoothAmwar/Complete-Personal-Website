import datetime

from flask import Flask, jsonify
from flask_cors import CORS
from YoutubeData.youtube_database import get_random_data
from YoutubeData.youtube import complete_reload, test

from random import randint
# app instance
application = Flask(__name__)
CORS(application)


# /api/home
@application.route("/api/home", methods=['GET'])
def return_home():
    t = get_random_data()
    # info = complete_reload(doReturn=True)
    info = test()

    return jsonify({
        'message': "Fasting Friday!",
        'info': ['p1', 'p2', 'p3'],
        'yt_data': t,
        'py_data': info
    })

# ----------------- TESTING -----------------
# some bits of text for the page.
header_text = '''
    <html>\n<head> <title>EB Flask Test</title> </head>\n<body>'''
instructions = '''
    <p><em>Hint</em>: This is a RESTful web service! Append a username
    to the URL (for example: <code>/Thelonious</code>) to say hello to
    someone specific.</p>\n'''
home_link = '<p><a href="/">Back</a></p>\n'
footer_text = '</body>\n</html>'

# add a rule for the index page.
application.add_url_rule('/', 'index', (lambda: header_text + instructions + footer_text))

# add a rule when the page is accessed with a name appended to the site
# URL.
application.add_url_rule('/<username>', 'hello', (lambda username: header_text + username + home_link + footer_text))


if __name__ == "__main__":
    # debug=True for development, remove for production
    application.debug = True
    application.run(debug=True, port=5000)

"""
click==8.0.4
Flask==2.2.2
itsdangerous==2.0.1
Jinja2==3.1.2
MarkupSafe==2.1.1
Werkzeug==2.2.3
Flask-Cors==4.0.0
json5==0.9.6
pymongo==3.12.0
dnspython==1.16.0
awsebcli==3.20.10
google-api-core==2.10.1
google-api-python-client==2.118.0
google-auth==2.22.0
google-auth-httplib2==0.2.0
googleapis-common-protos==1.56.4
"""