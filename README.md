# Discontinued

Since of becomming aware of strapi (https://strapi.io/) I wont continue on this project.


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/nsfw-web.svg)](https://badge.fury.io/js/nsfw-web)

# NSFW-Web

NSFW-Web (NodeJS Framework - Web) is a build on [PrimeReact](https://www.primefaces.org/primereact) and implements an automatic connection to the [NSFW-API](https://www.npmjs.com/package/nsfw-api) via the [NSFW-Connector](https://www.npmjs.com/package/nsfw-connector), which allows the manipulation of defined Databases and Functions. 

## Download

NSFW-Web is available at npm, if you have an existing application run the following command to download it to your project.

```
npm install nsfw-web --save
```

You will also need the [public](https://github.com/NilsBaumgartner1994/NSFW-Web/tree/main/public) folder for your react app. This public folder includes themes, styles and more stuff of PrimeReact.

## QuickStart

An [example application](https://github.com/NilsBaumgartner1994/NSFW-Example) is available at github. This example shows the combination of [NSFW-API](https://www.npmjs.com/package/nsfw-api), [NSFW-Proxy](https://www.npmjs.com/package/nsfw-proxy) and [NSFW-Web](https://www.npmjs.com/package/nsfw-web).

## Import

```javascript
//import {ComponentName} from 'nsfw-web';
import {ServerWeb} from 'nsfw-web';
//TODO why is auto import not working :-/
```

## Dependencies

Majority of NSFW-Web components (95%) are from PrimeReact. PrimeReact has almost only native dependecies, there are some exceptions having 3rd party dependencies such as Google Maps for GMap.
In addition, components require PrimeIcons for icons and react-transition-group for animations.

```json
  "peerDependencies": {
    "nsfw-connector": "^1.0.26",
    "primereact": "^6.4.1",
    "primeicons": "^4.1.0",
    "react": "^16.14.0",
    "react-dom": "^16.14.0",
    "react-router": "^4.3.1",
    "react-router-dom": "^4.3.1"
  },
  "dependencies": {
    "chart.js": "^3.3.2",
    "csv": "^5.5.0",
    "luxon": "^1.27.0",
    "quill": "^1.3.7",
    "react-transition-group": "^4.4.2",
    "webpack-node-externals": "^3.0.0"
  }
```
