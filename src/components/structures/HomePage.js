/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import request from 'browser-request';
import { _t } from '../../languageHandler';
import sanitizeHtml from 'sanitize-html';
import sdk from '../../index';
import { MatrixClient } from 'matrix-js-sdk';
import classnames from 'classnames';

class HomePage extends React.Component {
    static displayName = 'HomePage';

    static propTypes = {
        // URL to use as the iFrame src. Defaults to /home.html.
        homePageUrl: PropTypes.string,
    };

    static contextTypes = {
        matrixClient: PropTypes.instanceOf(MatrixClient),
    };

    state = {
            iframeSrc: '',
            page: '',
    };

    translate(s) {
        // default implementation - skins may wish to extend this
        return sanitizeHtml(_t(s));
    }

    componentWillMount() {
        this._unmounted = false;

        // we use request() to inline the homepage into the react component
        // so that it can inherit CSS and theming easily rather than mess around
        // with iframes and trying to synchronise document.stylesheets.

        const src = this.props.homePageUrl || 'home.html';

        request(
            { method: "GET", url: src },
            (err, response, body) => {
                if (this._unmounted) {
                    return;
                }

                if (err || response.status < 200 || response.status >= 300) {
                    console.warn(`Error loading home page: ${err}`);
                    this.setState({ page: _t("Couldn't load home page") });
                    return;
                }

                body = body.replace(/_t\(['"]([\s\S]*?)['"]\)/mg, (match, g1)=>this.translate(g1));
                this.setState({ page: body });
            },
        );
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    render() {
        const isGuest = this.context.matrixClient.isGuest();
        const classes = classnames({
            mx_HomePage: true,
            mx_HomePage_guest: isGuest,
        });

        if (this.state.iframeSrc) {
            return (
                <div className={classes}>
                    <iframe src={ this.state.iframeSrc } />
                </div>
            );
        } else {
            const GeminiScrollbarWrapper = sdk.getComponent("elements.GeminiScrollbarWrapper");
            return (
                <GeminiScrollbarWrapper autoshow={true} className={classes}>
                    <div className="mx_HomePage_body" dangerouslySetInnerHTML={{ __html: this.state.page }}>
                    </div>
                </GeminiScrollbarWrapper>
            );
        }
    }
}

module.exports = HomePage;
