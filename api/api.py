#  Copyright (c) 2021 Jan Ochwat

import flask
# noinspection PyUnresolvedReferences
from api.photogen import PhotoGenerator
# noinspection PyUnresolvedReferences
from api.instagram import InstagramUploader
# noinspection PyUnresolvedReferences
from api.mongodb import DBManager
import requests
import json

app: flask.app.Flask = flask.Flask(__name__, static_folder='../build', static_url_path='/')
with open('config.json', 'r') as file:
    data = file.read().replace('\n', '')
config: dict = json.loads(data)
username: str = config['username']
password: str = config['password']
app.logger.info(f'{username} _ {password}')
db: DBManager = DBManager(config['databaseAddress'], config['databaseName'])

method_requests_mapping = {
    'GET': requests.get,
    'HEAD': requests.head,
    'POST': requests.post,
    'PUT': requests.put,
    'DELETE': requests.delete,
    'PATCH': requests.patch,
    'OPTIONS': requests.options,
}


@app.route('/api/post_message', methods=['POST'])
def post_message():
    """
    Endpoint for posting messages
    @return: response message
    """
    message: dict = flask.request.json
    if message is None or message['message'] is (None or ''):
        return {
                   'post': 'unsuccessful',
                   'reason': 'Bad Request'
               }, 400
    generator: PhotoGenerator = PhotoGenerator(message['message'], app.logger)
    uploader: InstagramUploader = InstagramUploader(username, password, app.logger)
    if not uploader.login():
        return {
                   'post': 'unsuccessful',
                   'reason': 'Login error'
               }, 500
    response: requests.Response = uploader.upload(generator.generate())
    if response.status_code == 200:
        uploader.log_out()
        db.insert_new_document(message['message'], response.json()["media"]["image_versions2"]["candidates"][2]["url"])
        return {'post': 'successful'}
    return {
               'post': 'unsuccessful',
               'reason': 'Upload API Error',
               'message': response.text
           }, 500


@app.route('/api/get_latest_messages', methods=['GET'])
def get_latest_messages():
    """
    Endpoint for getting latest n messages
    @return: last n messages
    """
    if flask.request.args is None or len(flask.request.args) != 1:
        return {
                   'error': 'Bad Request'
               }, 400
    n: int = int(flask.request.args['n'])
    documents: list[dict] = db.get_latest_n(n)
    return {
        'documents': documents
    }


@app.route('/proxy/<path:url>', methods=method_requests_mapping.keys())
def proxy(url: str):
    """
    Proxy for bypassing instagram cors policy
    @param url: url to proxy
    @return: instgram response
    """
    requests_function = method_requests_mapping[flask.request.method]
    if url.startswith('https:/') and not url.startswith('https://'):
        url = 'https://' + url[7::]
    request: requests.Response = requests_function(url, stream=True, params=flask.request.args)
    response: flask.Response = flask.Response(flask.stream_with_context(request.iter_content()),
                                              content_type=request.headers['content-type'],
                                              status=request.status_code)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/')
def index():
    """
    Endpoint for accessing the main page of the application
    @return: page
    """
    return app.send_static_file('index.html')
