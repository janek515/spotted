// Copyright (c) 2020. Jan Ochwat
import React, { Component } from "react"
import { ClassNameMap } from '@material-ui/styles/withStyles'
import * as Config from "./sconfig.json"
import { ILocale } from './App'

/**
 * Wrapper for message document sent from DB
 * @property {number} id - message unique identifier
 * @property {string} msg - message content
 * @property {number} timestamp_ms - time of sending the message in ms
 * @property {string} url - URL pointing to image of the message
 */
interface IRecentMessageDocument {
    id: number
    msg: string
    timestamp_ms: number
    url: string
}

interface IRecentMessagesProps {
    localeStrings: ILocale
    classes: ClassNameMap<"progress" | "wrapper" | "recentMessage" | "recentMessageLabel" | "appHeader" | "message" | "sendButton" | "App" | "recentMessagesContainer" | "recentMessagesHeader">
}


export default class RecentMessages extends Component<IRecentMessagesProps> {
    private readonly recentMessagesContainer: React.RefObject<HTMLDivElement>
    constructor(props: IRecentMessagesProps) {
        super(props)
        this.recentMessagesContainer = React.createRef()
    }

    componentDidMount(): void {
        void this._recentMessagesDisplay()
    }

    shouldComponentUpdate(): boolean {
        const { classes } = this.props
        return document.getElementsByClassName(classes.recentMessage)[0] === undefined
    }

    /**
     * Fetches and displays recent messages on the page
     */
    async _recentMessagesDisplay (): Promise<void>  {
        return await fetch(`api/get_latest_messages?n=${Config.RecentMessagesCount}`, {
            method: 'GET',
            mode: 'same-origin',
            cache: 'no-cache',
        })
            .then(async res => {
                await res.json()
                    .then(json => {
                        const documents: IRecentMessageDocument[] = json.documents
                        const { classes } = this.props
                        for (let i = 0; i < documents.length; i++) {
                            if (this.recentMessagesContainer.current === null) throw new Error('recentMessagesContainer cant be null')
                            const messageDocument = documents[i]
                            
                            const imageElement: HTMLImageElement = document.createElement('img')
                            
                            imageElement.src = `proxy/${messageDocument.url}`
                            imageElement.className = classes.recentMessage
                            
                            this.recentMessagesContainer.current.appendChild(imageElement)
                            
                            const labelElement = document.createElement('abbr')
                            
                            labelElement.innerText = this._getTimeElapsedString(messageDocument.timestamp_ms)
                            const messageTimestamp = new Date(messageDocument.timestamp_ms)
                            labelElement.title = messageTimestamp.toLocaleString(Config.locale)
                            labelElement.className = classes.recentMessageLabel
                            
                            this.recentMessagesContainer.current.appendChild(labelElement)
                        }

                    })
            })
    }
    
    /**
     * Creates text indicating elapsed time
     * @param timestampMs timestamp of the message
     */
    _getTimeElapsedString (timestampMs: number): string {
        const { localeStrings } = this.props
        const timeElapsedMs = Date.now() - timestampMs
        const ONE_HOUR_MS = 60 * 60 * 1000
        const ONE_DAY_MS = 24 * ONE_HOUR_MS
        if (timeElapsedMs < ONE_HOUR_MS){
            const minutes: number = Math.round(timeElapsedMs / 60000)
            return `${minutes} ${minutes === 1 ? localeStrings.Minute : localeStrings.Minutes} ${localeStrings.Ago}`
        }
        if (timeElapsedMs < ONE_DAY_MS){
            const hours: number = Math.round(timeElapsedMs / ONE_HOUR_MS)
            return `${hours} ${hours === 1 ? localeStrings.Hour : localeStrings.Hours} ${localeStrings.Ago}`
        }
        const days: number = Math.round(timeElapsedMs / ONE_DAY_MS)
        return `${days} ${days === 1 ? localeStrings.Day : localeStrings.Days} ${localeStrings.Ago}`
    }


    render(): JSX.Element {
        const { classes , localeStrings } = this.props
        return (
            <div>
                <span className={classes.recentMessagesHeader}>
                        {localeStrings.RecentMessages}
                </span>
                <div className={classes.recentMessagesContainer} ref={this.recentMessagesContainer}/>
            </div>
        )
    }
}