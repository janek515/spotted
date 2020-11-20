from flask import Flask, request
from api.photogen import PhotoGen
from api.instagram import InstagramUploader
import json

app = Flask(__name__, static_folder='../build', static_url_path='/')
with open('config.json', 'r') as file:
    data = file.read().replace('\n', '')
datajson = json.loads(data)
username = datajson['username']
password = datajson['password']
app.logger.info(f'{username} _ {password}')


@app.route('/api/post_message', methods=['POST'])
def getmessage():
    message = request.json['message']
    if message is None:
        return {
                   "post": "unsuccessful",
                   "reason": "Bad Request"
               }, 400
    generator = PhotoGen(message, app.logger)
    uploader = InstagramUploader(username, username, generator.gen(), app.logger)
    uploader.login()
    status = uploader.upload()
    if status.status_code == 200:
        return {"post": "successful"}
    else:
        return {
                   "post": "unsuccessful",
                   "reason": "Upload API Error",
                   "message": status.text
               }, 500


@app.route('/')
def index():
    return app.send_static_file('index.html')
