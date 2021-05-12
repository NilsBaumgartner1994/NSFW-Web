import "regenerator-runtime/runtime.js";
import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import ServerWeb from "./ServerWeb";
import AppMenu from "./AppMenu";
import App from "./App";

const regeneratorRuntime = require("regenerator-runtime");

const config = {
    "title": "NSFW-Dev",
    "titleLong": "NSFW-Dev",
    "githubLink": "https://github.com/NilsBaumgartner1994/GEG",
    "version": "1.0.0",
    "preferedAuthMethod": "myUOS"
}

App.addDataviewCustomization("Exams", null, true);

ServerWeb.setConfig(config);
ServerWeb.start(ReactDOM);