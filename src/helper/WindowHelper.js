import React, {Component} from "react";

export class WindowHelper extends Component {

    static openUrl(url){
        window.location.href = url;
    }

}
