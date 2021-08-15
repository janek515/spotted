/*
 * Copyright (c) 2020. Jan Ochwat
 */
// TODO: Add tests (jest-dom)
import * as React from 'react'
import './App.css'
import {createMuiTheme, createStyles, makeStyles, Theme, ThemeProvider} from '@material-ui/core/styles'
import TextField from "@material-ui/core/TextField"
import MuiAlert, {Color} from '@material-ui/lab/Alert'
import Snackbar from '@material-ui/core/Snackbar'
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import * as Config from './sconfig.json'
import * as Locales from './locales.json'


const useStyles = makeStyles((theme: Theme) => createStyles({
    wrapper: {
        margin: theme.spacing(1),
        position: 'relative',
        width: '75%',
        maxWidth: 300,
    },
    progress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -12,
    }
}))

export default function App(): React.ReactElement {
    const classes = useStyles()
    const [open, setOpen] = React.useState<boolean>(false)
    const [snackBarValue, setSnackBarValue] = React.useState<number>(0)
    const [tFError, setTFError] = React.useState<boolean>(false)
    const [tFHelperText, setTFHelperText] = React.useState<string>('')
    const [sending, setSending] = React.useState<boolean>(false)
    const [lastMessageSentTime, setLastMessageSentTime] = React.useState<number>(0)
    const [lastMessageContent, setLastMessageContent] = React.useState<string>('')
    const locales = JSON.parse(JSON.stringify(Locales))
    const strings = locales.default[Config.locale]
    const header = Config.Header
    const timeBetweenMessages: number = parseInt(Config.TimeBetweenMessages)
    const textInput = React.useRef<HTMLTextAreaElement | undefined>(undefined)
    document.title = header

    //https://stackoverflow.com/a/45252226/11643883
    const checkSize = (): boolean => {
        const textarea = textInput.current!

        if (textarea.value.length > 293){
            return false
        }

        const _buffer: HTMLTextAreaElement | null = document.createElement('textarea')

        _buffer.style.border = 'none'
        _buffer.style.height = '0'
        _buffer.style.overflow = 'hidden'
        _buffer.style.padding = '0'
        _buffer.style.position = 'absolute'
        _buffer.style.left = '0'
        _buffer.style.top = '0'
        _buffer.style.zIndex = '-1'
        document.body.appendChild(_buffer)


        const cs = window.getComputedStyle(textarea as Element)
        const pl = parseInt(cs.paddingLeft)
        const pr = parseInt(cs.paddingRight)
        let lh = parseInt(cs.lineHeight)

        // [cs.lineHeight] may return 'normal', which means line height = font size.
        if (isNaN(lh)) lh = parseInt(cs.fontSize)

        // Copy content width.
        if ("clientWidth" in textarea) {
            _buffer.style.width = `${(textarea.clientWidth - pl - pr)}px`
        }

        // Copy text properties.
        _buffer.style.font = cs.font;
        _buffer.style.letterSpacing = cs.letterSpacing
        _buffer.style.whiteSpace = cs.whiteSpace
        _buffer.style.wordBreak = cs.wordBreak
        _buffer.style.wordSpacing = cs.wordSpacing
        _buffer.style.wordWrap = cs.wordWrap

        // Copy value.
        _buffer.value = textarea.value

        let result = Math.floor(_buffer.scrollHeight / lh)
        if (result === 0) result = 1
        return result <= 7

    }

    const theme = createMuiTheme({
        palette: {
            type: 'dark',
            primary: {
                dark: "#FFFFFF",
                light: "#FFFFFF",
                main: "#FFFFFF",
                contrastText: '#FFFFFF'
            }
        },
    });

    // https://stackoverflow.com/questions/29791721/how-get-data-from-material-ui-textfield-dropdownmenu-components
    // TODO: Title of a message

    const _handleClose = (event: React.SyntheticEvent, reason?: string): void => {
        if (reason === 'clickaway') {
            return
        }

        setOpen(false)
    };
    const _snackBarHandler = (): [severity: Color, msg: string] => {
        switch (snackBarValue) {
            case 1:
                return ['success', strings.Success]
            case 2:
                return ['error', strings.CalmDown]
            case 3:
                return ['error', strings.Dupes]
            default:
                return ['error', strings.Error]
        }
    }

    const _messageHandler = async (): Promise<void> => {
        setTFError(false)
        setTFHelperText('')
        const textInputContent = textInput.current!.value
        console.log(textInputContent)
        const textInputContentLength: number = textInputContent.trim().length
        if (textInputContentLength === 0) {
            setTFError(true)
            setTFHelperText(strings.CantBeEmpty)
            return
        }
        if (!checkSize()) {
            setTFHelperText(strings.TooLong)
            setTFError(true)
            return
        }
        if (lastMessageSentTime !== 0 && (Date.now() - lastMessageSentTime) < (timeBetweenMessages * 1000)) {
            setSnackBarValue(2)
            setOpen(true)
            return
        }
        if (lastMessageContent === textInputContent) {
            setSnackBarValue(3)
            setOpen(true)
            return
        }
        setSending(true)
        await fetch('api/post_message', {
            method: 'POST',
            mode: 'same-origin',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({message: textInputContent})
        })
            .then(r => {
                setSending(false)
                if (r.status === 200) {
                    setSnackBarValue(1)
                    setLastMessageContent(textInputContent)
                    textInput.current!.value = ''
                    setLastMessageSentTime(Date.now())
                    setOpen(true)
                    return
                }
                r.json()
                    .then(json => {
                    console.log(json)
                    })

                    .catch(err => {
                        console.log(err)
                    })
                setSnackBarValue(0)
                setOpen(true)
            })

            .catch(err => {
                console.log(err)
            })
        
    }
    return (
        <div className="App">
            <ThemeProvider theme={theme}>
                <header className="App-header">
                    {header}
                </header>
                <TextField
                    inputRef={textInput}
                    helperText={tFHelperText}
                    error={tFError}
                    className='message'
                    label={strings.Message}
                    placeholder={strings.WriteMessageHere}
                    multiline
                    variant="filled"
                    rows={7}
                />
                <div className={classes.wrapper}>
                    <Button
                        id='sendButton'
                        variant="contained"
                        color="primary"
                        disabled={sending}
                        onClick={_messageHandler}
                    >
                        {strings.SendMessage}
                    </Button>
                    {sending && <CircularProgress size={24} className={classes.progress}/>}
                </div>
                <Snackbar
                    open={open}
                    autoHideDuration={4000}
                    onClose={_handleClose}
                >
                    <MuiAlert
                        elevation={6}
                        variant="filled"
                        onClose={_handleClose}
                        severity={_snackBarHandler()[0]}
                    >
                        {_snackBarHandler()[1]}
                    </MuiAlert>
                </Snackbar>
            </ThemeProvider>
        </div>
    );
}

