import React, {Component} from 'react';
import App from "../../App";

export default class Customization extends Component {

    constructor(props) {
        super(props);
    }

    static isDefaultContentHidden(tableName){
        return App.DATAVIEW_CUSTOMIZATIONS_SETTINGS_HIDE_DEFAULT[tableName];
    }

    render(){
        let parentState = this.props.parentState;
        let instance = this.props.instance;
        let tableName = parentState.tableName;

        const CustomComponent = App.DATAVIEW_CUSTOMIZATIONS_CONTENT[tableName];

        console.log("Customization render: ");
        console.log(CustomComponent);
        if (CustomComponent!==null && typeof CustomComponent !== "undefined") {
            return React.createElement(CustomComponent, {
                reloadPage: this.props.reloadPage,
                instance: instance,
                parentState: this.props.parentState,
                parentProps: this.props.parentProps
            });
        }
        return null;
    }


}
