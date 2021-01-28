import 'react-app-polyfill/ie9';

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ScrollToTop from './showcase/scrolltotop/ScrollToTop';
import { BrowserRouter as Router } from 'react-router-dom';
import {ReactComponentToHTMLImageRenderer} from "./customHelper/ReactComponentToHTMLImageRenderer";

export default class WebServer extends Component {

    constructor(props) {
        super(props);
        this.config = props.config || WebServer.getDefaultConfig();
        document.title = this.config.title;
    }

    static getDefaultConfig(){
        return {
            "title": "NSFW-Web",
            "titleLong": "NSFW-Web",
            "githubLink": "https://github.com/NilsBaumgartner1994/NSFW-Web",
            "version": "1.0.0",
        };
    }

    render(){
        return(
            <div>
                <Router>
                    <ScrollToTop>
                        <App config={this.config}></App>
                    </ScrollToTop>
                </Router>
                {ReactComponentToHTMLImageRenderer.getHiddenContainer()}
            </div>
        );
    }

    start(){
        ReactDOM.render(
            this,
            document.getElementById('root')
        );
    }

    goToStartPage(){
        let newAddress = window.location.protocol+'//'+window.location.hostname;
        window.location.replace(newAddress)
    }

}