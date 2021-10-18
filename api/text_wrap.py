from PIL import ImageFont


def text_wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> str:
    """
    Text wrapper
    @param text: Text to wrap
    @type text: str
    @param font: Font that the text will be displayed with
    @type font: ImageFont.FreeTypeFont
    @param max_width: The maximal width of the text
    @type max_width: int
    @return: Wrapped text
    @rtype: str
    """
    lines: list[str] = []
    # TODO: implement emoji
    # If the text width is smaller than the image width, then no need to split
    # just add it to the line list and return
    if font.getsize(text)[0] <= max_width:
        return text
    # split the line by spaces to get words
    words: list[str] = text.split(' ')
    i = 0
    # append every word to a line while its width is shorter than the image width
    while i < len(words):
        line = ''
        while i < len(words) and font.getsize(line + words[i])[0] <= max_width:
            line = line + words[i] + " "
            i += 1
        if not line:
            line = words[i]
            i += 1
        lines.append(line)

    return '\n'.join(lines)
