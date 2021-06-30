import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import {confirmDialog} from "primereact/confirmdialog";

export default class WindowHelper extends Component {

    static GLOBAL_HISTORY = null;

    static openExternalUrl(url){
        window.location.href = url;
    }

    static openLocalURL(url){
        WindowHelper.GLOBAL_HISTORY.push(url);
    }

    constructor(props) {
        super(props)
        WindowHelper.GLOBAL_HISTORY = props.history;
    }

    componentDidUpdate() {
        WindowHelper.GLOBAL_HISTORY = this.props.history;
    }

    render(){
        return null;
    }

    static showPageChangeDialog(targetLocation){
        console.log("showPageChangeDialog");
        console.log("targetLocation: "+targetLocation);
        console.log(targetLocation);

        confirmDialog({
            message: 'Ihre Änderungen werden nicht gespeichert.',
            header: 'Seite verlassen?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                console.log("Ja");
                WindowHelper.unregisterCheckToBlockPageChange(); //we need to unregister the event
                WindowHelper.GLOBAL_HISTORY.push(targetLocation); //then we retriger the page change
            },
            reject: () => {console.log("Nein")}
        });
    }


    static FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED = null;
    static CUSTOM_COMPONENT_TO_HANDLE_PAGECHANGE = false;

    static _checkPageChangeAllowed(targetLocation, pageReload){
        console.log("_checkPageChangeAllowed");
        if(!!WindowHelper.FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED){
            console.log("Function to check pagechange found");
            let allowed = WindowHelper.FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED(targetLocation, pageReload);
            console.log("Allowed: "+allowed);
            if(!allowed && !!targetLocation && !pageReload && !WindowHelper.CUSTOM_COMPONENT_TO_HANDLE_PAGECHANGE){
                WindowHelper.showPageChangeDialog(targetLocation);
            }
            return allowed;
        }
        return true;
    }

    static useCustomComponentToHandlePageChangeDialog(bool){
        WindowHelper.CUSTOM_COMPONENT_TO_HANDLE_PAGECHANGE = bool;
    }

    static async _checkPageReloadAllowed(event){
        console.log("_checkPageReloadAllowed");
        let allowed = WindowHelper._checkPageChangeAllowed(null, true);
        console.log("RESULT: "+allowed);
        if(!allowed){
            console.log(event);
            event.preventDefault();
            event.returnValue = true;
        }
    }

    static registerCheckToBlockPageChange(func){
        WindowHelper.FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED = func;
        window.addEventListener('beforeunload', WindowHelper._checkPageReloadAllowed.bind(this));
        WindowHelper.unblockPageReloadFunction = WindowHelper.GLOBAL_HISTORY.block(targetLocation => {
            console.log(WindowHelper.GLOBAL_HISTORY);
            console.log("Page transistion noticed");
            // take your action here
            let allowed = WindowHelper._checkPageChangeAllowed(targetLocation, false);
            return allowed;
        });
    }

    static unregisterCheckToBlockPageChange(){
        window.removeEventListener('beforeunload', null);
        window.onbeforeunload = null;
        WindowHelper.unblockPageReloadFunction();
    }



}

export const GlobalHistory = withRouter(WindowHelper);
