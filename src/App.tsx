/*
 * Copyright (c) 2020. Jan Ochwat
 */
// TODO: Add tests (jest-dom)
import * as React from 'react';
import './App.css';
import {createMuiTheme, createStyles, makeStyles, Theme, ThemeProvider} from '@material-ui/core/styles';
import TextField from "@material-ui/core/TextField";
import MuiAlert, {Color} from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as Config from './sconfig.json';
import * as Locales from './loc/strings.json';

let _buffer: HTMLTextAreaElement | null;

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
        //marginTop: -12,
        marginLeft: -12,
    }
}))

export default function App() {
    const classes = useStyles();
    const [open, setOpen] = React.useState<boolean>(false);
    const [snackBarValue, setSnackBarValue] = React.useState<number>(0)
    const [tFError, setTFError] = React.useState<boolean>(false)
    const [tFHelperText, setTFHelperText] = React.useState<string>('')
    const [sending, setSending] = React.useState<boolean>(false)
    const [lastMessageSentTime, setLastMessageSentTime] = React.useState<number>(0)
    const [lastMessageContent, setLastMessageContent] = React.useState<string | undefined>(undefined)
    // TODO: Fix JSON implementation
    // @ts-ignore
    const strings = Locales.default[Config.default.locale]
    //@ts-ignore
    const header = Config.default.Header
    //@ts-ignore
    const timeBetweenMessages = Config.default.TimeBetweenMessages
    let textInput = React.useRef<HTMLTextAreaElement | undefined>(undefined)
    document.title = header

    //https://stackoverflow.com/a/45252226/11643883
    const countRows = (textarea: HTMLTextAreaElement | undefined): number => {

        if (_buffer == null) {
            _buffer = document.createElement('textarea');
            _buffer.style.border = 'none';
            _buffer.style.height = '0';
            _buffer.style.overflow = 'hidden';
            _buffer.style.padding = '0';
            _buffer.style.position = 'absolute';
            _buffer.style.left = '0';
            _buffer.style.top = '0';
            _buffer.style.zIndex = '-1';
            document.body.appendChild(_buffer);
        }

        const cs = window.getComputedStyle(textarea as Element);
        const pl = parseInt(cs.paddingLeft);
        const pr = parseInt(cs.paddingRight);
        let lh = parseInt(cs.lineHeight);

        // [cs.lineHeight] may return 'normal', which means line height = font size.
        if (isNaN(lh)) lh = parseInt(cs.fontSize);

        // Copy content width.
        if ("clientWidth" in textarea!) {
            _buffer.style.width = (textarea!.clientWidth - pl - pr) + 'px';
        }

        // Copy text properties.
        _buffer.style.font = cs.font;
        _buffer.style.letterSpacing = cs.letterSpacing;
        _buffer.style.whiteSpace = cs.whiteSpace;
        _buffer.style.wordBreak = cs.wordBreak;
        _buffer.style.wordSpacing = cs.wordSpacing;
        _buffer.style.wordWrap = cs.wordWrap;

        // Copy value.
        _buffer.value = textarea!.value;

        let result = Math.floor(_buffer.scrollHeight / lh);
        if (result === 0) result = 1;
        return result;


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
    // TODO: Character limit
    // TODO: Title of a message


    const _handleClose = (event: React.SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };
    // TODO: Implement different error messages for different errors (16.11 partially done)
    const _snackBarHandler = (): [severity: Color, msg: string] => {
        if (snackBarValue === 1) {
            return ['success', strings.Success]
        } else if (snackBarValue === 2) {
            return ['error', strings.CalmDown]
        } else if (snackBarValue === 3) {
            return ['error', strings.Dupes]
        } else {
            return ['error', strings.Error]
        }
    }

    const _messageHandler = async () => {
        if (countRows(textInput.current) > 7 || textInput.current!.value.length > 293) {
            setTFHelperText(strings.TooLong)
            setTFError(true)
        } else {
            if (lastMessageSentTime !== 0 && (Date.now() - lastMessageSentTime) < (timeBetweenMessages * 1000)) {
                setSnackBarValue(2)
                setOpen(true)
            } else if (lastMessageContent === textInput.current!.value) {
                setSnackBarValue(3)
                setOpen(true)
            } else {
                setTFError(false)
                setTFHelperText('')
                console.log(textInput.current!.value)
                if (!textInput.current!.value.trim().length) {
                    setTFError(true)
                    setTFHelperText(strings.CantBeEmpty)
                } else {
                    setSending(true)
                    await fetch('api/post_message', {
                        method: 'POST',
                        mode: 'same-origin',
                        cache: 'no-cache',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({message: textInput.current!.value})
                    })
                        .then(r => {
                            setSending(false)
                            if (r.status === 200) {
                                setSnackBarValue(1)
                                setLastMessageContent(textInput.current!.value)
                                textInput.current!.value = ''
                                setLastMessageSentTime(Date.now())
                            } else {
                                setSnackBarValue(0)
                            }
                            setOpen(true)
                        })

                        .catch(err => {
                            console.log(err)
                        })
                }
            }
        }
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
                    autoHideDuration={2000}
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

