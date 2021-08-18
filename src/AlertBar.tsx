// Copyright (c) 2020. Jan Ochwat
import React, {Component} from "react"
import MuiAlert, {Color} from "@material-ui/lab/Alert"
import Snackbar from "@material-ui/core/Snackbar"

export interface IAlertBarProps {
    localeStrings: Record<string, string>
}

export interface IAlertBarState {
    open: boolean
    value: number
}

export default class AlertBar extends Component<IAlertBarProps, IAlertBarState> {
    constructor(props: IAlertBarProps) {
        super(props)
        this.state = {
            open: false,
            value: 0
        }
        this._handleClose = this._handleClose.bind(this)
    }

    /**
     * Handles snackbar close event
     * @param event handle for the close event
     * @param reason reason for the close
     */
    _handleClose (event: React.SyntheticEvent, reason?: string): void {
        if (reason === 'clickaway') {
            return
        }
        this.setState({
            open: false
        })
    }

    /**
     * Sets AlertBar's value
     * @param value value to set the AlertBar to
     */
    setValue(value: number): void {
        this.setState({
            value
        })
    }

    /**
     * Opens or closes AlertBar according to the value parameter
     * @param value new state of the AlertBar
     */
    setOpen(value: boolean): void{
        this.setState({
            open: value
        })
    }

    /**
     * Handles snackbar color and message
      */
    _snackBarHandler (): [severity: Color, msg: string] {
        switch (this.state.value) {
            case 1:
                return ['success', this.props.localeStrings.Success]
            case 2:
                return ['error', this.props.localeStrings.CalmDown]
            case 3:
                return ['error', this.props.localeStrings.Dupes]
            default:
                return ['error', this.props.localeStrings.Error]
        }
    }


    render(): JSX.Element {
        return(
            <Snackbar
                    open={this.state.open}
                    autoHideDuration={4000}
                    onClose={this._handleClose}
                >
                    <MuiAlert
                        elevation={6}
                        variant="filled"
                        onClose={this._handleClose}
                        severity={this._snackBarHandler()[0]}
                    >
                        {this._snackBarHandler()[1]}
                    </MuiAlert>
                </Snackbar>
        )
    }

}