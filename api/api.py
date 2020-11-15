import requests
import base64
from flask import Flask, request
from api.photogen import PhotoGen

app = Flask(__name__, static_folder='../build', static_url_path='/')


@app.route('/api/post_message', methods=['POST'])
def getmessage():
    message = request.json['message']
    if message is None:
        return {
            "post": "unsuccessful",
            "reason": "Bad Request"
        }, 400
    generator = PhotoGen(message, app.logger)
    r = requests.post('https://tellonym-image.herokuapp.com/api/tellonym/7fhds73js9i89d/post', json={
        # 'http://localhost:3000/api/tellonym/7fhds73js9i89d/post', json={
        "caption": "",
        "janek": "kox",
        "image": str(base64.b64encode(generator.gen()))[1:-1:]
    })
    app.logger.info(r.content)
    if r.status_code == 200:
        return {"post": "successful"}
    if r.status_code == 403 or r.status_code == 400:
        return {
            "post": "unsuccessful",
            "reason": "Bad Request"
        }, 400
    else:
        return {
            "post": "unsuccessful",
            "reason": "Upload API Error"
        }, 500


@app.route('/')
def index():
    return app.send_static_file('index.html')
