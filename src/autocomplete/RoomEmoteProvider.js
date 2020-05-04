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
import { _t } from '../languageHandler';
import AutocompleteProvider from './AutocompleteProvider';
import {MatrixClientPeg} from '../MatrixClientPeg';
import {PillCompletion} from './Components';
import * as sdk from '../index';
import _sortBy from 'lodash/sortBy';
import RoomViewStore from "../stores/RoomViewStore";

const EMOTE_REGEX = /(\S+)/g;
const LIMIT = 20;

function score(query, space) {
    const index = space.indexOf(query);
    if (index === -1) {
        return Infinity;
    } else {
        return index;
    }
}

export default class RoomEmoteProvider extends AutocompleteProvider {
    constructor() {
        super(EMOTE_REGEX);
        this.client = MatrixClientPeg.get();
        this.emoteData = [];
        this.roomId = RoomViewStore.getRoomId();
        this.loadEmotesRoom();
        this.listenChanges();
    }

    listenChanges() {
        this.fn = (event, room) => {
            if (room && room.roomId == this.roomId) {
                this.loadEmotes(event);
            }
        };
        this.client.on("Room.timeline", this.fn);
    }

    loadEmotesRoom() {
        const room = this.client.getRoom(this.roomId);
        if (room) {
            const event = room.currentState.getStateEvents('im.ponies.room_emotes', '');
            this.loadEmotes(event);
        }
    }

    loadEmotes(event) {
        if (!event || event.error) {
            return;
        }

        const emote_data_event = event.event || event;
        if (emote_data_event.type !== 'im.ponies.room_emotes' || typeof emote_data_event.state_key !== 'string') {
            return;
        }

        const emote_data_content = emote_data_event.content;
        if (!emote_data_content.short) {
            return;
        }

        this.emoteData = [];
        for (const emote of Object.keys(emote_data_content.short)) {
            this.emoteData.push({
                code: emote,
                mxc: emote_data_content.short[emote],
            });
        }
    }

    match(s) {
        if (s.length == 0) {
            return [];
        }
        s = s.toLowerCase();

        const results = [];
        this.emoteData.forEach((e) => {
            const index = e.code.toLowerCase().indexOf(s);
            if (index === 0) {
                results.push(e);
            }
        });
        return results;
    }

    async getCompletions(query: string, selection: {start: number, end: number}, force = false) {
        
        let completions = [];
        const {command, range} = this.getCurrentCommand(query, selection, force);
        if (command) {
            const EmoteAvatar = sdk.getComponent('views.avatars.EmoteAvatar');

            const matchedString = command[1];
            completions = this.match(matchedString);
            try {
                completions = _sortBy(completions, [
                    (c) => score(matchedString, c.code),
                    (c) => c.code.length,
                ]).slice(0, LIMIT).map((result) => {
                    const mxc = result.mxc;
                    const code = result.code;
                    return {
                        completion: code,
                        completionId: mxc,
                        type: 'emote',
                        suffix: ' ',
                        href: 'emote://'+mxc,
                        component: (
                            <PillCompletion initialComponent={<EmoteAvatar width={24} height={24} mxcUrl={mxc} name={code} />} title={code} />
                        ),
                        range,
                    };
                });
            } catch (e) {
                console.error(e);
                completions = [];
            }
        }
        return completions;
    }

    getName() {
        return _t('Room Emotes');
    }

    renderCompletions(completions: [React.Component]): ?React.Component {
        return <div className="mx_Autocomplete_Completion_container_pill">
            { completions }
        </div>;
    }

    destroy() {
        this.client.off("Room.timeline", this.fn);
    }
}
