import "regenerator-runtime/runtime.js";
import React, {Component} from 'react';
import App from './App';
import ReactDOM from 'react-dom';
import ScrollToTop from './showcase/scrolltotop/ScrollToTop';
import { BrowserRouter as Router } from 'react-router-dom';
import ReactComponentToHTMLImageRenderer from "./helper/ReactComponentToHTMLImageRenderer";

export default class ServerWeb extends Component{

    static CONFIG = {

    };

    constructor(props) {
        super(props);
        if(!!props.config){
            ServerWeb.setConfig(props.config);
        }
    }

    static setConfig(config){
        config = config || {};
        ServerWeb.CONFIG = config;
        document.title = ServerWeb.CONFIG.title || "";
    }

    static start(){
        let port = window.location.port;
        if(!!port && port===""+3000){
            let newAddress = window.location.protocol+'//'+window.location.hostname;
            window.location.replace(newAddress)
        } else {
            ReactDOM.render(
                <ServerWeb />,
                document.getElementById('root')
            );
        }
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

