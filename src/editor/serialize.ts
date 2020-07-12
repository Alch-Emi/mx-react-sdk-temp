/*
Copyright 2019 New Vector Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.
Copyright 2019 ponies.im

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

import Markdown from '../Markdown';
import {makeGenericPermalink} from "../utils/permalinks/Permalinks";
import EditorModel from "./model";

export function mdSerialize(model: EditorModel) {
    return model.parts.reduce((html, part) => {
        switch (part.type) {
            case "newline":
                return html + "\n";
            case "plain":
            case "command":
            case "pill-candidate":
            case "at-room-pill":
                return html + part.text;
            case "room-pill":
            case "user-pill":
                return html + `[${part.text.replace(/[[\\\]]/g, c => "\\" + c)}](${makeGenericPermalink(part.resourceId)})`;
            case "emote":
                return html + `![${part.code}](emote:${part.mxc})`;
        }
    }, "");
}

export function htmlSerializeIfNeeded(model: EditorModel, {forceHTML = false} = {}) {
    const md = mdSerialize(model);
    const parser = new Markdown(md);
    if (!parser.isPlainText() || forceHTML) {
        let html = parser.toHTML();
        // we need to make emotes nicer
        html = html.replace(/<img +src="emote:([^"]+)" +alt="([^"]+)"/gi, '<img data-mx-emote src="$1" height="32" alt="$2" title="$2" vertical-align="middle"');
        return html;
    }
    // ensure removal of escape backslashes in non-Markdown messages
    if (md.indexOf("\\") > -1) {
        return parser.toPlaintext();
    }
}

export function textSerialize(model: EditorModel) {
    return model.parts.reduce((text, part) => {
        switch (part.type) {
            case "newline":
                return text + "\n";
            case "plain":
            case "command":
            case "pill-candidate":
            case "at-room-pill":
                return text + part.text;
            case "room-pill":
            case "user-pill":
                return text + `${part.text}`;
            case "emote":
                return text + part.code;
        }
    }, "");
}

export function containsEmote(model: EditorModel) {
    return startsWith(model, "/me ", false);
}

export function startsWith(model: EditorModel, prefix: string, caseSensitive = true) {
    const firstPart = model.parts[0];
    // part type will be "plain" while editing,
    // and "command" while composing a message.
    let text = firstPart && firstPart.text;
    if (!caseSensitive) {
        prefix = prefix.toLowerCase();
        text = text.toLowerCase();
    }

    return firstPart && (firstPart.type === "plain" || firstPart.type === "command") && text.startsWith(prefix);
}

export function stripEmoteCommand(model: EditorModel) {
    // trim "/me "
    return stripPrefix(model, "/me ");
}

export function stripPrefix(model: EditorModel, prefix: string) {
    model = model.clone();
    model.removeText({index: 0, offset: 0}, prefix.length);
    return model;
}

export function unescapeMessage(model: EditorModel) {
    const {parts} = model;
    if (parts.length) {
        const firstPart = parts[0];
        // only unescape \/ to / at start of editor
        if (firstPart.type === "plain" && firstPart.text.startsWith("\\/")) {
            model = model.clone();
            model.removeText({index: 0, offset: 0}, 1);
        }
    }
    return model;
}
