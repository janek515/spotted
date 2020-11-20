#  Copyright (c) 2020. Jan Ochwat

import requests
import time
from http.cookiejar import CookieJar
from http.cookies import SimpleCookie


class InstagramUploader:

    def __init__(self, username, password, logger):
        self.username = username
        self.password = password
        self.logger = logger
        self.baseUrl = 'https://www.instagram.com'
        self.loginUrl = self.baseUrl + '/accounts/login/ajax/'
        self.uploadUrl = self.baseUrl + ''
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                          'Chrome/86.0.4240.198 Safari/537.36',
            'Accept-Language': 'en-US',
            'X-Instagram-AJAX': str(1),
            'X-CSRFToken': '',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': self.baseUrl
        }
        self.jar = CookieJar()

    @property
    def _encodepwd(self):
        return f'#PWD_INSTAGRAM_BROWSER:0:{str(round(time.time() * 1000))}:{self.password}'

    def login(self):
        loginreq = requests.request(
            'POST',
            self.loginUrl,
            headers=self.headers,
            data={
                "username": self.username,
                "enc_password": self._encodepwd
            },
            cookies=self.jar
        )

        #self.logger.info(SimpleCookie().load(loginreq.headers['set-cookie']))
        self.logger.info(loginreq.headers)
        self.logger.info(loginreq.content)