import React from 'react';
import './App.css';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import TextField from "@material-ui/core/TextField";
import MuiAlert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import Button from "@material-ui/core/Button";


export default function App() {
    const [open, setOpen] = React.useState(false);
    const [messageValue, setMessageValue] = React.useState('');
    const [success, setSuccess] = React.useState(true)


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

    const postMessage = async msg => {
        await fetch('api/post_message', {
            method: 'POST',
            mode: 'same-origin',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({msg})
        })
            .then(r => {
                return r
            })
    }

    const _handleMessageChange = (e) => {
        setMessageValue(e.target.value)
    }


    const _handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };
    // TODO: Implement different error messages for different errors
    const _snackBarHandler = () => {
        if(success){
            return ['success', 'Message successfully posted']
        }
        else{
            return ['error', 'An Error Occurred while trying to post the message.']
        }
    }

    const _messageHandler = () => {
        console.log(messageValue)
        if (!messageValue.trim().length){
            setSuccess(false)
        }
        else {
            if (postMessage(messageValue).status === 200) {
                setSuccess(true)
            } else {
                setSuccess(false)
            }
        }
        setOpen(true);
    }
      return (
          <div className="App">
              <ThemeProvider theme={theme}>
                  <header className="App-header">
                      Sample Spotted
                  </header>
                  <TextField
                      className='message'
                      label="Message"
                      placeholder="Write the message here"
                      multiline
                      variant="filled"
                      rows={8}
                      onChange={_handleMessageChange}
                  />
                  <Button
                      id='sendButton'
                      variant="contained"
                      color="primary"
                      onClick={_messageHandler}
                  >
                      Send Message
                  </Button>
                  <Snackbar
                      open={open}
                      autoHideDuration={6000}
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

