#  Copyright (c) 2020. Jan Ochwat.NesTeam
import random
from PIL import Image, ImageDraw, ImageFont
from text_wrap import text_wrap
import os.path


class PhotoGen:

    def __init__(self, message, logger):
        self.logger = logger
        self.name = 'message.jpg'
        self.font = ImageFont.truetype("Lato.ttf", 36, encoding='utf-8')
        self.baseImg = Image.open('bg.jpg')
        self.draw = ImageDraw.Draw(self.baseImg)
        self.w, self.h = self.baseImg.size
        self.bgColor = (47, 49, 51)
        self.fontColor = (255, 255, 255)
        # You can vary the size of the rect by changing the fraction of blank area over the image size
        self.width, self.height = (0.168, 0.36)
        self.padding = 10
        self.rectXY = [(self.width * self.w, self.height * self.h),
                       (self.w - self.width * self.w, self.h - self.height * self.h)]
        # TODO: Add padding to textwrap
        self.text = text_wrap(message, self.font, (self.w - self.width * self.w) - self.width * self.w - 20)
        print(self.text)

    def gen(self):
        self.draw.rectangle(self.rectXY, self.bgColor)
        self.draw.multiline_text((self.width * self.w + self.padding, self.height * self.h + self.padding), self.text,
                                 self.fontColor, font=self.font)
        self.baseImg.save(self.name, quality=90)
        self.logger.info('File successfully generated.')
        return open(self.name, 'rb').read()
