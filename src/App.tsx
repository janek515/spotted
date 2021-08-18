// Copyright (c) 2020. Jan Ochwat
import React from 'react'
import './App.css'
import { createTheme, createStyles, makeStyles, Theme, ThemeProvider } from '@material-ui/core/styles'
import TextField from "@material-ui/core/TextField"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import * as Config from './sconfig.json'
import * as Locales from './locales.json'
import AlertBar from './AlertBar'
import RecentMessages from "./RecentMessages"


export const useStyles = makeStyles((theme: Theme) => createStyles({
    wrapper: {
        margin: theme.spacing(1),
        position: 'relative',
        width: '75%',
        maxWidth: 300,
    },
    progress: {
        position: 'absolute',
        top: 'calc(50% - 6px)',
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
    },
    buffer: {
        border: 'none',
        height: 0,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: -1
    }
}))

export default function App(): React.ReactElement {
    const classes = useStyles()
    const [tFError, setTFError] = React.useState<boolean>(false)
    const [tFHelperText, setTFHelperText] = React.useState<string>('')
    const [sending, setSending] = React.useState<boolean>(false)
    const [lastMessageSentTime, setLastMessageSentTime] = React.useState<number>(0)
    const [lastMessageContent, setLastMessageContent] = React.useState<string>('')

    const locales = JSON.parse(JSON.stringify(Locales)).default
    const strings: Record<string, string> = locales[Config.locale]

    const textInput = React.useRef<HTMLTextAreaElement>(null)
    const alertBar = React.useRef<AlertBar>(null)

    document.title = Config.Header

    //https://stackoverflow.com/a/45252226/11643883

    /**
     * Checks if message content will fit in the image
     * @returns {boolean} true if content fits
     */
    const checkSize = (): boolean => {
        if (textInput.current === null) throw new Error('textInput cannot be null')
        const textarea = textInput.current
        const cs = window.getComputedStyle(textarea)

        if (textarea.value.length > 293){
            return false
        }

        let _buffer = document.getElementsByClassName(classes.buffer)[0] as HTMLTextAreaElement

        if(_buffer === undefined){
            _buffer = document.createElement('textarea')
            _buffer.className = classes.buffer
            document.body.appendChild(_buffer)

            const pl = parseInt(cs.paddingLeft)
            const pr = parseInt(cs.paddingRight)

            if ("clientWidth" in textarea) {
                _buffer.style.width = `${(textarea.clientWidth - pl - pr)}px`
            }
        }

        let lh = parseInt(cs.lineHeight)
        // [cs.lineHeight] may return 'normal', which means line height = font size.
        if (isNaN(lh)) lh = parseInt(cs.fontSize)


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
    })

    // TODO: Title of a message

    /**
     * Handles sending messages
     */
    const _messageHandler = async (): Promise<void> => {
        setTFError(false)
        setTFHelperText('')
        if (textInput.current === null || alertBar.current === null)  throw new Error('textInput nor alertBar cannot be null')
        const textInputContent = textInput.current.value
        if (textInputContent.trim().length === 0) {
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
            alertBar.current.setValue(2)
            alertBar.current.setOpen(true)
            return
        }
        if (lastMessageContent === textInputContent) {
            alertBar.current.setValue(3)
            alertBar.current.setOpen(true)
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
                if (alertBar.current === null)  throw new Error('alertBar cannot be null')
                if (r.status === 200) {
                    alertBar.current.setValue(1)
                    setLastMessageContent(textInputContent)
                    if (textInput.current === null) throw new Error('textInput cannot be null')
                    textInput.current.value = ''
                    setLastMessageSentTime(Date.now())
                    alertBar.current.setOpen(true)
                    return
                }
                alertBar.current.setValue(0)
                alertBar.current.setOpen(true)
            }).catch(err => {throw err})
        
    }


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
                    {sending as boolean && <CircularProgress size={24} className={classes.progress}/>}
                </div>
                <RecentMessages localeStrings={strings} classes={classes}/>
                <AlertBar ref={alertBar}  localeStrings={strings} />
            </ThemeProvider>
        </div>
    )
}
