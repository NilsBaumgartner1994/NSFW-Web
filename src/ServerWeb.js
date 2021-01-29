import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ScrollToTop from './showcase/scrolltotop/ScrollToTop';
import { BrowserRouter as Router } from 'react-router-dom';
import config from './config';
import {ReactComponentToHTMLImageRenderer} from "./helper/ReactComponentToHTMLImageRenderer";

document.title = config.title;

export default class ServerWeb extends Component{

    constructor(props) {
        super(props);
    }

    render(){
        return(
            <div>
                <Router>
                    <ScrollToTop>
                        <App></App>
                    </ScrollToTop>
                </Router>
                {ReactComponentToHTMLImageRenderer.getHiddenContainer()}
            </div>
        )
    }

}

