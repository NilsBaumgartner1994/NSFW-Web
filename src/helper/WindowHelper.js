import React, {Component} from "react";

export default class WindowHelper extends Component {

    static openUrl(url){
        window.location.href = url;
    }

}
