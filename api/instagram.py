#  Copyright (c) 2021 Jan Ochwat
import requests
import time
import json
import random
import Cryptodome.Random
from Cryptodome.Cipher import AES
import libnacl.sealed
import libnacl.public
import base64
import libnacl
import logging


# Based on:
# https://github.com/jlobos/instagram-web-api


class InstagramUploader:

    def __init__(self, username: str, password: str,
                 logger: logging.Logger):
        """
        Initializes InstagramUploader object.
        @param username: Instagram username
        @param password: Instagram password
        @param logger: logger
        """
        self.session = requests.session()
        self.username = username
        self.logger = logger
        self.base_url = 'https://www.instagram.com'
        self.login_url = self.base_url + '/accounts/login/ajax/'
        self.log_out_url = self.base_url + "/accounts/logout/ajax/"
        self.upload_url = self.base_url + '/rupload_igphoto/'
        self.shared_data_url = self.base_url + '/data/shared_data/'
        self.create_url = self.base_url + '/create/configure/'
        self.shared_data = self._get_shared_data()
        self.csrf_token = self.shared_data['config']['csrf_token']
        self.logger.info(self.shared_data)
        self.enc_password = self.encrypt_password(password)
        self.logger.info(self.enc_password)
        self.session.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; '
                          'Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                          'Chrome/86.0.4240.198 Safari/537.36',
            'Accept-Language': 'en-US',
            'X-Instagram-AJAX': "1",
            'X-CSRFToken': self.csrf_token,
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': self.base_url
        }

    def _get_shared_data(self) -> dict:
        """
        Fetches shared data
        @return: the shared data
        @rtype: dict
        """
        shared_data = self.session.get(
            self.shared_data_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64'
                              '; x64) AppleWebKit/537.36 (KHTML, l'
                              'ike Gecko) Chrome/86.0.4240.198 Safari/537.36'
            }
        )
        try:
            return shared_data.json()
        except json.JSONDecodeError:
            raise Exception('Invalid shared data response')

    def login(self) -> bool:
        """
        Logs in
        @return: True if logged in successfully
        @rtype: bool
        """
        login_response = self.session.request(
            'POST',
            self.login_url,
            data={
                "username": self.username,
                "enc_password": self.enc_password,
                'queryParams': {},
                'optIntoOneTap': 'false'
            },
            cookies={
                'csrftoken': self.csrf_token,
                "ig_cb": '1'
            }
        ).json()
        self.logger.info(login_response)
        if login_response["status"] == "fail" or not login_response["authenticated"]:
            self.logger.error("Failed to login")
            return False
        self.logger.info("Logged in successfully")
        return True

    def upload(self, photo: bytes) -> requests.Response:
        """
        Uploads the photo
        @param photo: Photo to upload
        @return: Photo upload response
        @rtype: requests.Response
        """
        entity_name = f'{round(time.time() * 1000)}' \
                      f'_0_{random.randrange(1000000000, 9999999999)}'
        upload_params = {
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
        headers = {
            'x-entity-type': 'image/jpeg',
            'offset': '0',
            'x-entity-name': entity_name,
            'x-instagram-rupload-params': json.dumps(upload_params),
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
        photo_response: dict = self.session.request(
            'POST',
            self.upload_url + entity_name,
            headers=headers,
            data=photo
        ).json()
        if 'upload_id' in photo_response:
            upload_response = self.session.request(
                'POST',
                self.create_url,
                data={
                    "upload_id": str(photo_response['upload_id']),
                    "caption": "",
                    "custom_accessibility_caption": "",
                    "retry_timeout": "",
                    "usertags": ""
                },
                cookies={'csrftoken': self.csrf_token}
            )
            self.logger.info(upload_response.text)
            self.logger.info(upload_response.reason)
            return upload_response
        raise Exception('Failed to upload the photo')

    def encrypt_password(self, password: str) -> str:
        """
        Encrypts the password
        @param password: password to encrypt
        @return: Encrypted password
        @rtype: str
        """
        current_time_bytes = str(round(time.time())).encode()
        public_key_bytes = bytes.fromhex(self.shared_data["encryption"]["public_key"])
        key = Cryptodome.Random.get_random_bytes(32)
        plain_text = password.encode()
        cipher = AES.new(key, AES.MODE_GCM, nonce=bytes([0] * 12))
        cipher.update(current_time_bytes)
        cipher_text, tag = cipher.encrypt_and_digest(plain_text)
        encrypted_key = libnacl.sealed.SealedBox(public_key_bytes).encrypt(key)
        key_length_bytes = len(encrypted_key).to_bytes(2, "little")
        info = bytes([1, int(self.shared_data["encryption"]["key_id"])])

        encrypted_password_bytes = \
            info + key_length_bytes + encrypted_key + tag + cipher_text

        return f'#PWD_INSTAGRAM_BROWSER:{self.shared_data["encryption"]["version"]}' \
               f':{current_time_bytes.decode("utf-8")}' \
               f':{base64.b64encode(encrypted_password_bytes).decode("utf-8")}'

    def log_out(self):
        """
        Logs out from instagram
        """
        self._get_shared_data()
        try:
            self.session.post(self.log_out_url, {
                "one_tap_app_login": 0,
                "user_id": self.shared_data["config"]["viewerId"]
            })
        except KeyError:
            self.logger.warning("Failed to log out")
