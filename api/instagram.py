#  Copyright (c) 2020. Jan Ochwat
import requests
import time
import json
import datetime
import random
from tzlocal import get_localzone
import Cryptodome.Random
from Cryptodome.Cipher import AES
import libnacl.sealed
import libnacl.public
import base64
import struct
import libnacl

# Based on:
# https://stackoverflow.com/a/62799458/11643883 ,
# https://github.com/jlobos/instagram-web-api


class InstagramUploader:

    def __init__(self, username, password, photo, logger):
        self.photo = photo
        self.session = requests.session()
        self.username = username
        self.logger = logger
        self.baseUrl = 'https://www.instagram.com'
        self.loginUrl = self.baseUrl + '/accounts/login/ajax/'
        self.uploadUrl = self.baseUrl + '/rupload_igphoto/'
        self.sharedDataUrl = self.baseUrl + '/data/shared_data/'
        self.createUrl = self.baseUrl + '/create/configure/'
        self.sharedData = json.loads(self.getshareddata())
        self.logger.info(self.sharedData)
        self.csrfToken = self.sharedData['config']['csrf_token']
        self.time = str(round(time.time() * 1000)).encode()
        self.password = password
        self.enc_password = self.encrypt_password()
        self.logger.info(self.enc_password)

        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                          'Chrome/86.0.4240.198 Safari/537.36',
            'Accept-Language': 'en-US',
            'X-Instagram-AJAX': str(1),
            'X-CSRFToken': self.csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': self.baseUrl
        }
        self.tz = get_localzone()
        self.now = None
        self.offset = -int(datetime.datetime.now().astimezone(self.tz).utcoffset().total_seconds()/60)
        self.uploadParams = {
            "media_type": 1,
            "upload_id": str(round(time.time() * 1000)),
            "upload_media_height": 1080,
            "upload_media_width": 1080,
            "xsharing_user_ids": "[]",
            "image_compression": json.dumps({
                "lib_name": 'moz',
                "lib_version": '3.1.m',
                "quality": '80'
            })
        }
        self.nameEntity = f'{round(time.time() * 1000)}_0_{random.randrange(1000000000, 9999999999)}'
        self.photoHeaders = {
            'x-entity-type': 'image/jpeg',
            'offset': '0',
            'x-entity-name': self.nameEntity,
            'x-instagram-rupload-params': json.dumps(self.uploadParams),
            'x-entity-length': str(len(photo)),
            'Content-Length': str(len(photo)),
            'Content-Type': 'application/octet-stream',
            'x-ig-app-id': '1217981644879628',
            'Accept-Encoding': 'gzip',
            'X-Pigeon-Rawclienttime': str(round(time.time(), 3)),
            'X-IG-Connection-Speed': f'{random.randrange(1000, 3700)}kbps',
            'X-IG-Bandwidth-Speed-KBPS': '-1.000',
            'X-IG-Bandwidth-TotalBytes-B': '0',
            'X-IG-Bandwidth-TotalTime-MS': '0'
        }
        self.photoResponse = None

    def getshareddata(self):
        return self.session.get(self.sharedDataUrl,
                                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                                       ' (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'}).text

    def login(self):
        loginreq = self.session.request(
            'POST',
            self.loginUrl,
            headers=self.headers,
            data={
                "username": self.username,
                "enc_password": self.enc_password,
                'queryParams': {},
                'optIntoOneTap': 'false'
            },
            cookies={
                'csrftoken': self.csrfToken,
                "ig_cb": '1'
            }
        )
        self.logger.info(loginreq.headers)
        self.logger.info(loginreq.content)
        self.logger.info(loginreq.status_code)

    def upload(self):
        self.now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S ")
        self.logger.info(self.photo)
        self.logger.info('^PHOTO')
        photoreq = self.session.request(
            'POST',
            self.uploadUrl + self.nameEntity,
            headers=self.photoHeaders,
            data=self.photo
        )
        self.photoResponse = json.loads(photoreq.text)
        if 'upload_id' in self.photoResponse:
            uploadreq = self.session.request(
                'POST',
                self.createUrl,
                headers=self.headers,
                data={
                    "upload_id": str(self.photoResponse['upload_id']),
                    "caption": "",
                    "custom_accessibility_caption": "",
                    "retry_timeout": "",
                    "usertags": ""
                },
                cookies={'csrftoken': self.csrfToken}
            )
            self.logger.info(uploadreq.text)
            self.logger.info(uploadreq.reason)
            return uploadreq
        else:
            raise Exception('Failed to upload the photo')

    def encrypt_password(self):
        cur_time_str = str(round(time.time())).encode()
        key_bytes = bytes.fromhex(self.sharedData["encryption"]["public_key"])
        key = Cryptodome.Random.get_random_bytes(32)
        plaintext = self.password.encode()
        cipher = AES.new(key, AES.MODE_GCM, nonce=bytes([0] * 12))
        cipher.update(cur_time_str)
        cipher_text, tag = cipher.encrypt_and_digest(plaintext)
        encrypted_key = libnacl.sealed.SealedBox(key_bytes).encrypt(key)
        len_bytes = struct.pack('<h', len(encrypted_key))
        info = bytes([1, int(self.sharedData["encryption"]["key_id"])])

        # print(cipher_text.hex())
        # print(tag.hex())
        # print(len_bytes.hex())
        # print(info.hex())
        # print(encrypted_key.hex())

        obytes = info + len_bytes + encrypted_key + tag + cipher_text
        # print(type(obytes))

        return f'#PWD_INSTAGRAM_BROWSER:{self.sharedData["encryption"]["version"]}:{cur_time_str.decode("utf-8")}:' \
               f'{base64.b64encode(obytes).decode("utf-8")}'
