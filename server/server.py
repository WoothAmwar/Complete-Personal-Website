from flask import Flask, jsonify
from flask_cors import CORS
from YoutubeData.youtube_database import get_random_data

from random import randint
# app instance
app = Flask(__name__)
CORS(app)


# /api/home
@app.route("/api/home", methods=['GET'])
def return_home():
    t = get_random_data()
    return jsonify({
        'message': "Hello boys!",
        'info': ['p1', 'p2', 'p3'],
        'yt_data': t
    })


if __name__ == "__main__":
    # debug=True for development, remove for production
    app.run(debug=True, port=8080)
