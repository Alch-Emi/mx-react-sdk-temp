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

import EmotesPanel from "../../EmotesPanel.js";
import { _t } from '../../../../../languageHandler';

export default class EmotesUserSettingsTab extends React.Component {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        return (
            <div className="mx_SettingsTab mx_EmotesUserSettingsTab">
                <div className="mx_SettingsTab_heading">{ _t("Emotes") }</div>
                <EmotesPanel />
            </div>
        );
    }
}
