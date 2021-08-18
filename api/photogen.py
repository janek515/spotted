#  Copyright (c) 2021 Jan Ochwat
from PIL import Image, ImageDraw, ImageFont
from api.text_wrap import text_wrap
import logging


class PhotoGenerator:

    def __init__(self, message: str, logger: logging.Logger):
        """
        Initializes the PhotoGen object
        @param message: the message to put in the image
        @param logger: logger to use
        """
        self.logger = logger
        self.name = 'message.jpg'
        self.font = ImageFont.truetype("Lato.ttf", 36, encoding='utf-8')
        self.base_image = Image.open('bg.png')
        self.image = ImageDraw.Draw(self.base_image)
        self.base_image_width, self.base_image_height = self.base_image.size
        self.background_color = (47, 49, 51)
        self.font_color = (255, 255, 255)
        self.text_box_width, self.text_box_height = (0.168, 0.36)
        self.padding = 10
        self.rectangleSize = [
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
        """
        Generates the message image
        @return: image as bytes
        """

        self.image.rectangle(self.rectangleSize, self.background_color)
        self.image.multiline_text(
            (self.text_box_width * self.base_image_width + self.padding,
             self.text_box_height * self.base_image_height + self.padding),
            self.text,
            self.font_color,
            font=self.font)
        self.base_image.save(self.name, quality=90)
        self.logger.info('File successfully generated.')
        with open(self.name, 'rb') as file:
            return file.read()
