/*
Copyright 2016 Aviral Dasgupta
Copyright 2017 Vector Creations Ltd
Copyright 2017 New Vector Ltd
Copyright 2018 ponies.im

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Additionally, original modifications by ponies.im are licensed under the CSL.
See https://coinsh.red/csl/csl.txt or the provided CSL.txt for additional information.
These modifications may only be redistributed and used within the terms of 
the Cooperative Software License as distributed with this project.
*/

import React from 'react';
import { _t } from '../languageHandler';
import AutocompleteProvider from './AutocompleteProvider';
import {MatrixClientPeg} from '../MatrixClientPeg';
import QueryMatcher from './QueryMatcher';
import {PillCompletion} from './Components';
import {ICompletion, ISelectionRange} from './Autocompleter';
import {getDisplayAliasForRoom} from '../Rooms';
import * as sdk from '../index';
import _sortBy from 'lodash/sortBy';
import SettingsStore from "../settings/SettingsStore"; 

import PonymoteDataClean from '../ponymotes_clean.json';
import PonymoteDataNSFW from '../ponymotes_nsfw.json';
import MutantStandardData from '../mutant_standard.json';

const PONYMOTE_REGEX = /:([^+\s:]+):?/g;
const LIMIT = 20;
const PONYMOTE_SHORTNAMES = [
    {
        n: 'soru',
        mxc: 'mxc://ponies.im/7067ceb7d8131ae6e3433074bb476a60',
    },
    {
        n: 'maze',
        mxc: 'mxc://ponies.im/a572e0024f2ac2cdc73844cbf10f5e4e',
    },
    {
        n: 'pizza',
        mxc: 'mxc://ponies.im/c5a28ec0c87e967f8011637a8d407c6c',
    },
    {
        n: 'skreeee',
        mxc: 'mxc://ponies.im/db5286571be1ff33ce28e0b194f52a4a',
    },
    {
        n: 'skreeeee',
        mxc: 'mxc://ponies.im/3781248bb7ed984446ba04855b351cb4',
    },
    {
        n: 'porky',
        mxc: 'mxc://ponies.im/b45b2b27fba16ab63b336368a6f43a93',
    },
    {
        n: 'rollsafe',
        mxc: 'mxc://ponies.im/38188fc3b2e4aeef779cba91c5832858',
    },
    {
        n: 'gentoo',
        mxc: 'mxc://ponies.im/81abdf3e3988d6eb9a94c0ce2862058e',
    },
];

function score(query, space) {
    const index = space.indexOf(query);
    if (index === -1) {
        return Infinity;
    } else {
        return index;
    }
}

function matchPonymotes(s) {
    if (s.length == 0) {
        return [];
    }
    s = s.toLowerCase();
    const results = [];

    if (!SettingsStore.isFeatureEnabled("feature_disable_ponymotes")) {
        PonymoteDataClean.forEach((key) => {
            const index = key.toLowerCase().indexOf(s);
            if (index !== -1) {
                results.push({
                    n: key,
                    mxc: 'mxc://ponies.im/bpm.'+key
                });
            }
        });
    }

    if (SettingsStore.isFeatureEnabled("feature_nsfw_ponymotes")) {
        PonymoteDataNSFW.forEach((key) => {
            const index = key.toLowerCase().indexOf(s);
            if (index !== -1) {
                results.push({
                    n: key,
                    mxc: 'mxc://ponies.im/bpm.'+key
                });
            }
        });
    }

    if (!SettingsStore.isFeatureEnabled("feature_disable_mutant_standard")) {
        MutantStandardData.forEach((key) => {
            const index = key.toLowerCase().indexOf(s);
            if (index !== -1) {
                results.push({
                    n: key,
                    mxc: 'mxc://ponies.im/ms.'+key
                });
            }
        });
    }
    return results;
}

export default class PonymoteProvider extends AutocompleteProvider {
    matcher: QueryMatcher<any>;

    constructor() {
        super(PONYMOTE_REGEX);
        this.matcher = new QueryMatcher(PONYMOTE_SHORTNAMES, {
            keys: ['n'],
            // For matching against ascii equivalents
            shouldMatchWordsOnly: false,
        });
    }

    async getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]> {
        let completions = [];
        const {command, range} = this.getCurrentCommand(query, selection);
        if (command) {
            const EmoteAvatar = sdk.getComponent('views.avatars.EmoteAvatar');
            
            const matchedString = command[1];
            completions = this.matcher.match(matchedString);
            completions = completions.concat(matchPonymotes(matchedString));
            completions = _sortBy(completions, [
                (c) => score(matchedString, c.n),
                (c) => c.n.length,
            ]).slice(0, LIMIT).map((result) => {
                const {n, mxc} = result;
                const completion = ':'+n+':';
                return {
                    completion: completion,
                    completionId: mxc,
                    type: 'emote',
                    suffix: ' ',
                    href: 'emote://'+mxc,
                    component: (
                        <PillCompletion initialComponent={<EmoteAvatar width={24} height={24} mxcUrl={mxc} name={n} />} title={n} />
                    ),
                    range,
                };
            });
        }
        return completions;
    }

    getName() {
        return _t('Additional Emotes');
    }

    renderCompletions(completions: React.Component[]): React.ReactNode {
        return <div className="mx_Autocomplete_Completion_container_pill">
            { completions }
        </div>;
    }
}
