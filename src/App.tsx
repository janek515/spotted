/*
 * Copyright (c) 2020. Jan Ochwat
 */
import React, {useEffect} from 'react'
import './App.css'
import {createTheme, createStyles, makeStyles, Theme, ThemeProvider} from '@material-ui/core/styles'
import TextField from "@material-ui/core/TextField"
import MuiAlert, {Color} from '@material-ui/lab/Alert'
import Snackbar from '@material-ui/core/Snackbar'
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import * as Config from './sconfig.json'
import * as Locales from './locales.json'

/**
 * Wrapper for message document sent from DB
 * @property {number} id - message unique identifier
 * @property {string} msg - message content
 * @property {number} timestamp_ms - time of sending the message in ms
 * @property {string} url - URL pointing to image of the message
 */
type MessageDocument = {
    id: number
    msg: string
    timestamp_ms: number
    url: string
}

type Locale = Record<string, string>

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
    },
    recentMessage: {
        width: '95%',
        maxWidth: 420,
    },
    recentMessageLabel : {
        marginBottom: '2em',
        marginTop: 10,
        fontSize: 14,
        fontWeight: 400
    },
    appHeader: {
        // margin: 25
        margin: '.4em'
    },
    message:{
        width: '95%',
        maxWidth: 355
    },
    sendButton: {
        color: 'black',
        width: '75%',
        maxWidth: 420
    },
    App: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        fontSize: 64,
        fontWeight: 'bold'
    },
    recentMessagesContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 5
    },
    recentMessagesHeader: {
        fontSize: 28,
        fontWeight: 500,
        marginBottom: '.6em',
        marginTop: '.4em'
    }
}))

export default function App(): React.ReactElement {
    const classes = useStyles()
    const [snackbarOpen, setSnackbarOpen] = React.useState<boolean>(false)
    const [snackBarValue, setSnackBarValue] = React.useState<number>(0)
    const [tFError, setTFError] = React.useState<boolean>(false)
    const [tFHelperText, setTFHelperText] = React.useState<string>('')
    const [sending, setSending] = React.useState<boolean>(false)
    const [lastMessageSentTime, setLastMessageSentTime] = React.useState<number>(0)
    const [lastMessageContent, setLastMessageContent] = React.useState<string>('')

    const locales = JSON.parse(JSON.stringify(Locales)).default
    const strings: Locale = locales[Config.locale]

    const textInput = React.useRef<HTMLTextAreaElement>(null)
    const recentMessagesContainer = React.useRef<HTMLDivElement>(null)
    const downloadedRecentMessages = React.useRef<boolean>(false)


    document.title = Config.Header

    //https://stackoverflow.com/a/45252226/11643883
    /**
     * Checks if message content will fit in the image
     * @returns {boolean} true if content fits
     */
    const checkSize = (): boolean => {
        if (!textInput.current) throw new Error('textInput cannot be null')
        const textarea = textInput.current

        if (textarea.value.length > 293){
            return false
        }

        const _buffer: HTMLTextAreaElement = document.createElement('textarea')

        _buffer.style.border = 'none'
        _buffer.style.height = '0'
        _buffer.style.overflow = 'hidden'
        _buffer.style.padding = '0'
        _buffer.style.position = 'absolute'
        _buffer.style.left = '0'
        _buffer.style.top = '0'
        _buffer.style.zIndex = '-1'
        document.body.appendChild(_buffer)


        const cs = window.getComputedStyle(textarea)
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

    const theme = createTheme({
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

    /**
     * Handles snackbar close event
     * @param event handle for the close event
     * @param reason reason for the close
     */
    const _handleClose = (event: React.SyntheticEvent, reason?: string): void => {
        if (reason === 'clickaway') {
            return
        }

        setSnackbarOpen(false)
    }
    /**
     * Handles snackbar color and message
     */
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
    /**
     * Creates text indicating elapsed time
     * @param timestampMs timestamp of the message
     */
    const _getTimeElapsedString = (timestampMs: number): string => {
        const timeElapsedMs = Date.now() - timestampMs
        const ONE_HOUR_MS = 60 * 60 * 1000
        const ONE_DAY_MS = 24 * ONE_HOUR_MS
        if (timeElapsedMs < ONE_HOUR_MS){
            const minutes: number = Math.round(timeElapsedMs / 60000)
            return `${minutes} ${minutes === 1 ? strings.Minute : strings.Minutes} ${strings.Ago}`
        }
        if (timeElapsedMs < ONE_DAY_MS){
            const hours: number = Math.round(timeElapsedMs / ONE_HOUR_MS)
            return `${hours} ${hours === 1 ? strings.Hour : strings.Hours} ${strings.Ago}`
        }
        const days: number = Math.round(timeElapsedMs / ONE_DAY_MS)
        return `${days} ${days === 1 ? strings.Day : strings.Days} ${strings.Ago}`
    }

    /**
     * Fetches and displays recent messages on the page
     */
    const _recentMessagesDisplay = async (): Promise<void> => {
        return await fetch(`api/get_latest_messages?n=${Config.RecentMessagesCount}`, {
            method: 'GET',
            mode: 'same-origin',
            cache: 'no-cache',
        })
            .then(res => {
                res.json()
                    .then(async json => {
                        const documents: Array<MessageDocument> = json.documents
                        for (let i = 0; i < documents.length; i++) {
                            if (!recentMessagesContainer.current) throw new Error('recentMessagesContainer cant be null')
                            const messageDocument = documents[i]
                            const imageElement: HTMLImageElement = document.createElement('img')
                            imageElement.src = `proxy/${messageDocument.url}`
                            imageElement.className = classes.recentMessage
                            recentMessagesContainer.current.appendChild(imageElement)
                            const labelElement = document.createElement('abbr')
                            labelElement.innerText = _getTimeElapsedString(messageDocument.timestamp_ms)
                            const messageTimestamp = new Date(messageDocument.timestamp_ms)
                            labelElement.title = messageTimestamp.toLocaleString(Config.locale)
                            labelElement.className = classes.recentMessageLabel
                            recentMessagesContainer.current.appendChild(labelElement)
                        }

                    })
            })
    }

    /**
     * Handles sending messages
     */
    const _messageHandler = async (): Promise<void> => {
        setTFError(false)
        setTFHelperText('')
        if (!textInput.current) throw new Error('textInput cannot be null')
        const textInputContent = textInput.current.value
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
        if (lastMessageSentTime !== 0 && (Date.now() - lastMessageSentTime) < (Config.TimeBetweenMessages * 1000)) {
            setSnackBarValue(2)
            setSnackbarOpen(true)
            return
        }
        if (lastMessageContent === textInputContent) {
            setSnackBarValue(3)
            setSnackbarOpen(true)
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
                    if (!textInput.current) throw new Error('textInput cannot be null')
                    textInput.current.value = ''
                    setLastMessageSentTime(Date.now())
                    setSnackbarOpen(true)
                    return
                }
                setSnackBarValue(0)
                setSnackbarOpen(true)
            })

            .catch(err => {
                throw err
            })
        
    }


    useEffect(() => {
        if(!downloadedRecentMessages.current){
            _recentMessagesDisplay().then(() => null).catch(err => {
                throw err})
            downloadedRecentMessages.current = true
        }
    })


    return (
        <div className={classes.App}>
            <ThemeProvider theme={theme}>
                <header className={classes.appHeader}>
                    {Config.Header}
                </header>
                <TextField
                    inputRef={textInput}
                    helperText={tFHelperText}
                    error={tFError}
                    className={classes.message}
                    label={strings.Message}
                    placeholder={strings.WriteMessageHere}
                    multiline
                    variant="filled"
                    rows={7}
                />
                <div className={classes.wrapper}>
                    <Button
                        className={classes.sendButton}
                        variant="contained"
                        color="primary"
                        disabled={sending}
                        onClick={_messageHandler}
                    >
                        {strings.SendMessage}
                    </Button>
                    {sending && <CircularProgress size={24} className={classes.progress}/>}
                </div>
                <span className={classes.recentMessagesHeader}>
                    {strings.RecentMessages}
                </span>
                <div className={classes.recentMessagesContainer} ref={recentMessagesContainer}/>
                <Snackbar
                    open={snackbarOpen}
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

