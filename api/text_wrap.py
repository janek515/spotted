import re


def text_wrap(text, font, max_width):
    """Wrap text base on specified width.
    This is to enable text of width more than the image width to be display
    nicely.
    @params:
        text: str
            text to wrap
        font: obj
            font of the text
        max_width: int
            width to split the text with
    @return
        lines: list[str]
            list of sub-strings
    """
    lines = []
    tekst = []

    # This checks for any special characters that font.getsize does not like (it's made for polish alphabet)
    for x in text:
        if re.match('[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]', x) is not None:
            tekst.append('w')
        else:
            tekst.append(x)
    finaltext = ''.join(tekst)
    # If the text width is smaller than the image width, then no need to split
    # just add it to the line list and return
    if font.getsize(finaltext)[0]  <= max_width:
        lines.append(text)
    else:
        # split the line by spaces to get words
        words = text.split(' ')
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

    if len(lines) != 1:
        final = '\n'.join(lines)
    else:
        final = lines[0]

    return final
