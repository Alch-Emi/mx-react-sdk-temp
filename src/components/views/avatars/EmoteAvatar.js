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
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import * as sdk from '../../../index';
import {MatrixClientPeg} from '../../../MatrixClientPeg';

export default createReactClass({
    displayName: 'EmoteAvatar',

    propTypes: {
        name: PropTypes.string,
        mxcUrl: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
        resizeMethod: PropTypes.string,
    },

    getDefaultProps: function() {
        return {
            width: 36,
            height: 36,
            resizeMethod: 'crop',
        };
    },

    getPonymoteAvatarUrl: function() {
        return MatrixClientPeg.get().mxcUrlToHttp(
            this.props.mxcUrl,
            this.props.width,
            this.props.height,
            this.props.resizeMethod,
        );
    },

    render: function() {
        const BaseAvatar = sdk.getComponent("avatars.BaseAvatar");
        // extract the props we use from props so we can pass any others through
        // should consider adding this as a global rule in js-sdk?
        /*eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }]*/
        const {name, ...otherProps} = this.props;
        return (
            <BaseAvatar
                name={name}
                idName={name}
                url={this.getPonymoteAvatarUrl()}
                {...otherProps}
            />
        );
    },
});
