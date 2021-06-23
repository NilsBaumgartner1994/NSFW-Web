import React, {Component} from "react";
import {withRouter} from "react-router-dom";

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

}

export const GlobalHistory = withRouter(WindowHelper);
