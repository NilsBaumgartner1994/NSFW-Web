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


    static PAGECHANGE_DIALOG_HEADER = null;
    static PAGECHANGE_DIALOG_MESSAGE = null;
    static PAGECHANGE_DIALOG_ICON = null;
    static PAGECHANGE_DIALOG_ACCEPT_LABEL = null;
    static PAGECHANGE_DIALOG_REJECT_LABEL = null;

    static setPageChangeDialog(header, message, acceptLabel, rejectLabel, icon){
        WindowHelper.PAGECHANGE_DIALOG_HEADER = header;
        WindowHelper.PAGECHANGE_DIALOG_MESSAGE = message;
        WindowHelper.PAGECHANGE_DIALOG_ICON = icon;
        WindowHelper.PAGECHANGE_DIALOG_ACCEPT_LABEL = acceptLabel;
        WindowHelper.PAGECHANGE_DIALOG_REJECT_LABEL = rejectLabel;
    }

    static showPageChangeDialog(targetLocation){
        console.log("showPageChangeDialog");
        console.log("targetLocation: "+targetLocation);
        console.log(targetLocation);

        confirmDialog({
            message: WindowHelper.PAGECHANGE_DIALOG_HEADER || "Your changes won't be saved.",
            header: WindowHelper.PAGECHANGE_DIALOG_MESSAGE || 'Leave page?',
            icon: WindowHelper.PAGECHANGE_DIALOG_ICON || 'pi pi-exclamation-triangle',
            acceptLabel: WindowHelper.PAGECHANGE_DIALOG_ACCEPT_LABEL || "Yes",
            rejectLabel: WindowHelper.PAGECHANGE_DIALOG_REJECT_LABEL || "No",
            accept: () => {
                WindowHelper.unregisterCheckToBlockPageChange(); //we need to unregister the event
                WindowHelper.GLOBAL_HISTORY.push(targetLocation); //then we retriger the page change
            },
            reject: () => {}
        });
    }


    static FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED = null;
    static USE_CUSTOM_PAGE_CHANGE_DIALOG = false;

    static _checkPageChangeAllowed(targetLocation, pageReload){
        if(!!WindowHelper.FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED){
            let allowed = WindowHelper.FUNCTION_TO_CHECK_IF_PAGECHANGE_IS_ALLOWED(targetLocation, pageReload);
            if(!allowed && !!targetLocation && !pageReload && !WindowHelper.USE_CUSTOM_PAGE_CHANGE_DIALOG){
                WindowHelper.showPageChangeDialog(targetLocation);
            }
            return allowed;
        }
        return true;
    }

    static useCustomPageChangeDialog(bool){
        WindowHelper.USE_CUSTOM_PAGE_CHANGE_DIALOG = bool;
    }

    static async _checkPageReloadAllowed(event){
        let allowed = WindowHelper._checkPageChangeAllowed(null, true);
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
            // take your action here
            return WindowHelper._checkPageChangeAllowed(targetLocation, false);
        });
    }

    static unregisterCheckToBlockPageChange(){
        window.removeEventListener('beforeunload', null);
        window.onbeforeunload = null;
        WindowHelper.unblockPageReloadFunction();
    }



}

export const GlobalHistory = withRouter(WindowHelper);
