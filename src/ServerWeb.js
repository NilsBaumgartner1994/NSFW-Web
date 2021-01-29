import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ScrollToTop from './showcase/scrolltotop/ScrollToTop';
import { BrowserRouter as Router } from 'react-router-dom';
import config from './config';
import {ReactComponentToHTMLImageRenderer} from "./helper/ReactComponentToHTMLImageRenderer";

document.title = config.title;

export default class ServerWeb {

    start(){
        let port = window.location.port;
        if(!!port && port===""+3000){
            let newAddress = window.location.protocol+'//'+window.location.hostname;
            window.location.replace(newAddress)
        } else {
            ReactDOM.render(
                <div>
                    <Router>
                        <ScrollToTop>
                            <App></App>
                        </ScrollToTop>
                    </Router>
                    {ReactComponentToHTMLImageRenderer.getHiddenContainer()}
                </div>,
                document.getElementById('root')
            );
        }
    }
}

