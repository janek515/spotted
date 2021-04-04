#  Copyright (c) 2021 Jan Ochwat

from flask import Flask, request
# noinspection PyUnresolvedReferences
from api.photogen import PhotoGen
# noinspection PyUnresolvedReferences
from api.instagram import InstagramUploader
import json

app = Flask(__name__, static_folder='../build', static_url_path='/')
with open('config.json', 'r') as file:
    data = file.read().replace('\n', '')
config = json.loads(data)
username = config['username']
password = config['password']
app.logger.info(f'{username} _ {password}')


@app.route('/api/post_message', methods=['POST'])
def get_message():
    message = request.json
    if message is None or message["message"] is (None or ""):
        return {
                   "post": "unsuccessful",
                   "reason": "Bad Request"
               }, 400
    message = message["message"]
    generator = PhotoGen(message, app.logger)
    uploader = InstagramUploader(username, password, generator.generate(), app.logger)
    if not uploader.login():
        return {
            "post": "unsuccessful",
            "reason": "Login error"
        }, 500
    status = uploader.upload()
    if status.status_code == 200:
        uploader.log_out()
        return {"post": "successful"}
    return {
               "post": "unsuccessful",
               "reason": "Upload API Error",
               "message": status.text
           }, 500


@app.route('/')
def index():
    return app.send_static_file('index.html')
