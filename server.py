from flask import Flask, request, jsonify
from flask_cors import CORS
from pytubefix import YouTube
from pytubefix.cli import on_progress
import os
from werkzeug.utils import secure_filename


app = Flask(__name__)
CORS(app)  # 👈 включает CORS
AUDIO_FOLDER = "static/audio"


os.makedirs(AUDIO_FOLDER, exist_ok=True)


downloaded_album = {
    "id": 999,
    "title": "YouTube Downloads",
    "artist": "Various",
    "cover": "downloaded.png", 
    "trackIds": []
}


@app.route("/download", methods=["POST"])
def download_audio():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify(success=False, error="No URL provided")


    try:
        yt = YouTube(url, on_progress_callback=on_progress)
        print("🎶 Название:", yt.title)

        audio = yt.streams.filter(only_audio=True).first()
        if not audio:
            raise Exception("No audio stream found")

        safe_title = secure_filename(f"{yt.title}_audio.mp4")
        file_path = os.path.join(AUDIO_FOLDER, safe_title)
        audio.download(output_path=AUDIO_FOLDER, filename=safe_title)

        video_id = yt.video_id
        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
        track_id = hash(video_id) % 1_000_000_000

        track = {
            "id": track_id,
            "title": yt.title,
            "artist": yt.author,
            "genre": "YouTube",
            "cover": thumbnail_url,
            "albumId": downloaded_album["id"],
            "src": f"/static/audio/{safe_title}"
        }


        if track_id not in downloaded_album["trackIds"]:
            downloaded_album["trackIds"].append(track_id)

        return jsonify(success=True, track=track, album=downloaded_album)

    except Exception as e:

        return jsonify(success=False, error=str(e))

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

if __name__ == "__main__":
    os.makedirs(AUDIO_FOLDER, exist_ok=True)
    app.run(debug=True)
