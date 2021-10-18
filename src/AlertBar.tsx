// Copyright (c) 2020. Jan Ochwat
import React, {Component} from "react"
import MuiAlert, {Color} from "@material-ui/lab/Alert"
import Snackbar from "@material-ui/core/Snackbar"
import { ILocale } from "./App";

export interface IAlertBarProps {
    localeStrings: ILocale
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
        this.handleClose = this.handleClose.bind(this)
    }

    /**
     * Handles snackbar close event
     * @param event handle for the close event
     * @param reason reason for the close
     */
    handleClose (event: React.SyntheticEvent, reason?: string): void {
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
        const {localeStrings} = this.props
        const {value} = this.state
        switch (value) {
            case 1:
                return ['success', localeStrings.Success]
            case 2:
                return ['error', localeStrings.CalmDown]
            case 3:
                return ['error', localeStrings.Dupes]
            default:
                return ['error', localeStrings.Error]
        }
    }


    render(): JSX.Element {
        const { open } = this.state
        return(
            <Snackbar
                    open={open}
                    autoHideDuration={4000}
                    onClose={this.handleClose}
                >
                    <MuiAlert
                        elevation={6}
                        variant="filled"
                        onClose={this.handleClose}
                        severity={this._snackBarHandler()[0]}
                    >
                        {this._snackBarHandler()[1]}
                    </MuiAlert>
                </Snackbar>
        )
    }

}