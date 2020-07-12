/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>
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
import PropTypes from 'prop-types';
import {formatFullDate, formatTime} from '../../../DateUtils';
import SettingsStore from "../../../settings/SettingsStore"; 

export default class MessageTimestamp extends React.Component {
    static propTypes = {
        ts: PropTypes.number.isRequired,
        showTwelveHour: PropTypes.bool,
    };

    render() {
        if (SettingsStore.isFeatureEnabled("feature_interplanetary_time")) {
            const ipt=((244058700000+((this.props.ts+27000)/864))).toFixed(3).match(/(.*)(.)(.)(.)(.)(.{2})(.{2})(.{4})/);
            return (
                <span
                    className="mx_MessageTimestamp"
                    title={ipt[1]+"-"+ipt[2]+"-"+ipt[3]+"-"+ipt[4]+"T"+ipt[5]+":"+ipt[6]+":"+ipt[7]+ipt[8]}
                    aria-hidden={this.props.ariaHidden}
                 >
                    { ipt[5]+":"+ipt[6] }
                </span>
            );

        } else {
        const date = new Date(this.props.ts);
        return (
            <span className="mx_MessageTimestamp" title={formatFullDate(date, this.props.showTwelveHour)} aria-hidden={true}>
                { formatTime(date, this.props.showTwelveHour) }
                </span>
            );
        }
    }
}
