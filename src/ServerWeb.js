import "regenerator-runtime/runtime.js";
import 'react-app-polyfill/ie9';
import React, {Component} from 'react';
import {App} from './App';
import ScrollToTop from './showcase/scrolltotop/ScrollToTop';
import { HashRouter, BrowserRouter } from 'react-router-dom';

import {MyStorage} from "nsfw-connector";

export default class ServerWeb extends Component{

    static CONFIG = {

    };

    constructor(props) {
        super(props);
        if(!!props.config){
            ServerWeb.setConfig(props.config);
        }
    }

    static setOnLoggedInStateCallback(callback){
        App.onSetLoggedInStateCallback = callback;
    }

    static setOnThemeChangeCallback(callback) {
        App.onThemeChangeCallback = callback;
    }

    static getNSFWConnectorMyStorage(){
        return MyStorage;
    }

    static setConfig(config){
        config = config || {};
        ServerWeb.CONFIG = config;
        document.title = ServerWeb.CONFIG.title || "";
    }

    static registerCustomRoute(route, component){
        App.CUSTOM_ROUTES[route] = component;
    }

    static addToastMessage(summary, detail, severity="success",cloasable, sticky, life){
        if(App.toastInstance && App.toastInstance.show){
            App.toastInstance.show({severity:severity, summary: summary, detail: detail, cloasable: cloasable, sticky: sticky, life: life});
        }
    }

    static addDataviewCustomization(tableName, component, hideDefault=false){
        App.DATAVIEW_CUSTOMIZATIONS_CONTENT[tableName] = component;
        if(hideDefault){
            App.DATAVIEW_CUSTOMIZATIONS_SETTINGS_HIDE_DEFAULT[tableName] = true;
        }
    }

    static start(ReactDOM){
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
                <BrowserRouter basename={"#"}>
                    <ScrollToTop>
                        <React.StrictMode>
                            <App></App>
                        </React.StrictMode>
                    </ScrollToTop>
                </BrowserRouter>
                {/** ReactComponentToHTMLImageRenderer.getHiddenContainer() */}
            </div>
        )
    }

}

