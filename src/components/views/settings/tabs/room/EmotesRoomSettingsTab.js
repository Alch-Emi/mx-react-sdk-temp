/*
Copyright 2020 ponies.im

Licensed under the Cooperative Software License (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License with this software or at

    http://coinsh.red/csl/csl.txt

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import PropTypes from 'prop-types';
import {_t} from "../../../../../languageHandler";
import {MatrixClientPeg} from "../../../../../MatrixClientPeg";
import ToggleSwitch from "../../../elements/ToggleSwitch";
import * as sdk from "../../../../..";
import AccessibleButton from "../../../elements/AccessibleButton";
import EmotesPanel from "../../EmotesPanel";

export default class EmotesRoomSettingsTab extends React.Component {
    static propTypes = {
        roomId: PropTypes.string.isRequired,
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            "emotesPacks": [],
            "saving": false,
            "busy": false,
            "canEdit": false,
            "editStateKey": false,
        };

        this._unmounted = false;
        this._loadEmotePacks = this._loadEmotePacks.bind(this);
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    componentDidMount() {
        this._loadEmotePacks();
    }

    _loadEmotePacks() {
        const client = MatrixClientPeg.get();
        const thisRoom = client.getRoom(this.props.roomId);
        const emoteRooms = client.getAccountData('im.ponies.emote_rooms');
        let emoteRoomsThis = {};
        if (emoteRooms && !emoteRooms.error && emoteRooms.event.content && emoteRooms.event.content.rooms && emoteRooms.event.content.rooms[this.props.roomId]) {
            emoteRoomsThis = emoteRooms.event.content.rooms[this.props.roomId];
        }
        if (thisRoom) {
            let emotePacks = [];
            const events = thisRoom.currentState.getStateEvents('im.ponies.room_emotes');
            for (let event of events) {
                event = event.event || event;
                if (!event.content.pack) {
                    event.content.pack = {};
                }
                emotePacks.push({
                    stateKey: event.state_key,
                    name: event.content.pack.displayname || event.content.pack.name || event.state_key || "Default",
                    activated: Boolean(emoteRoomsThis[event.state_key]),
                    numEmotes: Object.keys(event.content.short).length,
                });
            }
            if (emotePacks.length === 0) {
                // add the default one
                emotePacks.push({
                    stateKey: event.state_key,
                    name: "Default",
                    activated: false,
                    numEmotes: 0,
                });
            }
            this.setState({
                "emotePacks": emotePacks,
                "canEdit": thisRoom.currentState.mayClientSendStateEvent('im.ponies.room_emotes', client),
            });
        }
    }

    _onEmoteRoomToggle(pack) {
        const client = MatrixClientPeg.get();
        const emoteRooms = client.getAccountData('im.ponies.emote_rooms');
        let emoteRoomsContent = {};
        if (emoteRooms && !emoteRooms.error && emoteRooms.event.content) {
            emoteRoomsContent = emoteRooms.event.content;
        }
        if (!emoteRoomsContent.rooms) {
            emoteRoomsContent.rooms = {};
        }
        pack.activated = !pack.activated;
        if (pack.activated) {
            // add it
            if (!emoteRoomsContent.rooms[this.props.roomId]) {
                emoteRoomsContent.rooms[this.props.roomId] = {};
            }
            if (!emoteRoomsContent.rooms[this.props.roomId][pack.stateKey]) {
                emoteRoomsContent.rooms[this.props.roomId][pack.stateKey] = {};
            }
        } else if (emoteRoomsContent.rooms[this.props.roomId]) {
            // remove it
            delete emoteRoomsContent.rooms[this.props.roomId][pack.stateKey];
            if (Object.keys(emoteRoomsContent.rooms[this.props.roomId]).length === 0) {
                delete emoteRoomsContent.rooms[this.props.roomId];
            }
        }
        // alright, store the update
        this.setState({busy: true});
        client.setAccountData('im.ponies.emote_rooms', emoteRoomsContent).then(() => {
            this._loadEmotePacks();
            this.setState({busy: false});
        });
    }

    render() {
        const emotePackRows = [];
        for (const emotePackIndex in this.state.emotePacks) {
            let pack = this.state.emotePacks[emotePackIndex];
            let i = 0;
            emotePackRows.push(
                <tr key={emotePackIndex}>
                    <td key={i++}>
                        <ToggleSwitch checked={pack.activated} disabled={this.state.busy} onChange={() => {
                            this._onEmoteRoomToggle(pack);
                        }}/>
                    </td>
                    <td key={i++}>
                        {pack.name}
                    </td>
                    <td key={i++}>
                        {pack.numEmotes.toString() + " " + _t("Emotes")}
                    </td>
                    <td key={i++}>
                        <AccessibleButton onClick={() => {
                            this.setState({"editStateKey": pack.stateKey});
                        }} kind="primary">
                            { this.state.canEdit ? _t("Edit") : _t("View") }
                        </AccessibleButton>
                    </td>
                </tr>
            );
        }

        let trailing = "";
        if (this.state.editStateKey !== false) {
            trailing = <EmotesPanel key={"edit" + this.state.editStateKey} readonly={!this.state.canEdit} roomId={this.props.roomId} stateKey={this.state.editStateKey} />;
        }

        return (
            <div className="mx_SettingsTab mx_EmotesRoomSettingsTab">
                <div className="mx_SettingsTab_heading">{ _t("Emotes") }</div>
                <div>
                    <p>
                        { _t("This is a list of all emote packs available in this room. To be able to use them elsewhere than only this room, use the switch.")}
                    </p>
                </div>
                <table>
                    <tbody>
                        {emotePackRows}
                    </tbody>
                </table>
                {trailing}
            </div>
        );
    }
}
