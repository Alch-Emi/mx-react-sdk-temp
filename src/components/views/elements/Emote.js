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
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {MatrixClientPeg} from '../../../MatrixClientPeg';

const REGEX_EMOTE = /^emote:\/\/(.*)$/;

const Emote = createReactClass({
    statics: {
        isEmoteUrl: (url) => {
            return !!REGEX_EMOTE.exec(url);
        },
    },

    props: {
        url: PropTypes.string,
        alt: PropTypes.string,
    },

    render: function() {
        const cli = MatrixClientPeg.get();
        const url = cli.mxcUrlToHttp(this.props.url.replace('emote://', ''), 800, 32);
        return <img src={url} height={32} alt={this.props.alt} title={this.props.alt} />;
    }
});

export default Emote;
