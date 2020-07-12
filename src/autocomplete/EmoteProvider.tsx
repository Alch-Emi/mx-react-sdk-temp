/*
Copyright 2018 ponies.im

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
import {ICompletion, ISelectionRange} from './Autocompleter';
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

export default class EmoteProvider extends AutocompleteProvider {
    client: any;
    emoteData: any[];
    fn: any;
    roomFn: any;

    constructor() {
        super(EMOTE_REGEX);
        this.client = MatrixClientPeg.get();
        this.emoteData = [];
        this.loadEmotes();
        this.listenChanges();
    }

    loadEmotes() {
        this.emoteData = [];
        const normalizeEmotePackName = (name) => {
          name = name.replace(/ /g, '-');
          name = name.replace(/[^\w-]/g, '');
          return name.toLowerCase();
        };
        const addEmotePack = (packName, content, packNameOverride?) => {
            if (!content.short) {
                return;
            }
            if (content.pack && content.pack.name) {
                packName = content.pack.name;
            }
            if (packNameOverride) {
                packName = packNameOverride;
            }
            packName = normalizeEmotePackName(packName);
            for (const key of Object.keys(content.short)) {
                if (content.short[key].startsWith('mxc://')) {
                    this.emoteData.push({
                        code: key,
                        mxc: content.short[key],
                        packName: packName,
                    });
                }
            }
        };

        // first add all the room emotes
        const thisRoomId = RoomViewStore.getRoomId();
        const thisRoom = this.client.getRoom(thisRoomId);
        if (thisRoom) {
            const events = thisRoom.currentState.getStateEvents('im.ponies.room_emotes');
            for (let event of events) {
                event = event.event || event;
                addEmotePack(event.state_key || 'room', event.content);
            }
        }
        // now add the user emotes
        const userEmotes = this.client.getAccountData('im.ponies.user_emotes');
        if (userEmotes && !userEmotes.error && userEmotes.event.content) {
            addEmotePack('user', userEmotes.event.content);
        }
        // finally add the external room emotes
        const emoteRooms = this.client.getAccountData('im.ponies.emote_rooms');
        if (emoteRooms && !emoteRooms.error && emoteRooms.event.content && emoteRooms.event.content.rooms) {
            for (const roomId of Object.keys(emoteRooms.event.content.rooms)) {
                if (roomId == thisRoomId) {
                    continue;
                }
                const room = this.client.getRoom(roomId);
                if (!room) {
                    continue;
                }
                for (const stateKey of Object.keys(emoteRooms.event.content.rooms[roomId])) {
                    let event = room.currentState.getStateEvents('im.ponies.room_emotes', stateKey);
                    if (event) {
                        event = event.event || event;
                        addEmotePack(roomId, event.content, emoteRooms.event.content.rooms[roomId][stateKey]['name']);
                    }
                }
            }
        }
    }

    listenChanges() {
        this.fn = (event) => {
            this.loadEmotes();
        };
        this.client.on("accountData", this.fn);
        this.roomFn = (event, room) => {
            if ((event.event || event).type === 'im.ponies.room_emotes') {
                this.loadEmotes();
            }
        };
        this.client.on("Room.timeline", this.roomFn);
    }

    match(s) {
        if (s.length == 0) {
            return [];
        }
        const firstChar = s[0];
        s = s.toLowerCase().substring(1);

        const results = [];
        this.emoteData.forEach((e) => {
            if (e.code[0] == firstChar && e.code.toLowerCase().includes(s)) {
                results.push(e);
            }
        });
        return results;
    }

    async getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]> {
        
        let completions = [];
        const {command, range} = this.getCurrentCommand(query, selection);
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
                            <PillCompletion initialComponent={<EmoteAvatar width={24} height={24} mxcUrl={mxc} name={code} />} title={`${code} (${result.packName})`} />
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
        return _t('Emotes');
    }

    renderCompletions(completions: React.Component[]): React.ReactNode {
        return <div className="mx_Autocomplete_Completion_container_pill">
            { completions }
        </div>;
    }

    destroy() {
        this.client.off("accountData", this.fn);
        this.client.off("Room.timeline", this.roomFn);
    }
}
