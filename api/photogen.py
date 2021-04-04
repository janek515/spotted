#  Copyright (c) 2021 Jan Ochwat
from PIL import Image, ImageDraw, ImageFont
from api.text_wrap import text_wrap
import logging


class PhotoGen:

    def __init__(self, message: str, logger: logging.Logger):
        self.logger = logger
        self.name = 'message.jpg'
        self.font = ImageFont.truetype("Lato.ttf", 36, encoding='utf-8')
        self.base_image = Image.open('bg.jpg')
        self.draw = ImageDraw.Draw(self.base_image)
        self.base_image_width, self.base_image_height = self.base_image.size
        self.background_color = (47, 49, 51)
        self.font_color = (255, 255, 255)
        # You can vary the size of the rect by changing the fraction of blank area over
        # the image size
        self.text_box_width, self.text_box_height = (0.168, 0.36)
        self.padding = 10
        self.rectXY = [
            (self.text_box_width * self.base_image_width,
             self.text_box_height * self.base_image_height),
            (self.base_image_width - self.text_box_width * self.base_image_width,
             self.base_image_height - self.text_box_height * self.base_image_height)
        ]
        self.text = text_wrap(message,
                              self.font,
                              round((self.base_image_width
                                     - self.text_box_width *
                                     self.base_image_width)
                                    - self.text_box_width *
                                    self.base_image_width - self.padding * 2))
        self.logger.info(self.text)

    def generate(self) -> bytes:
        self.draw.rectangle(self.rectXY, self.background_color)
        self.draw.multiline_text(
            (self.text_box_width * self.base_image_width + self.padding,
             self.text_box_height * self.base_image_height + self.padding),
            self.text,
            self.font_color,
            font=self.font)
        self.base_image.save(self.name, quality=90)
        self.logger.info('File successfully generated.')
        with open(self.name, 'rb') as file:
            return file.read()
