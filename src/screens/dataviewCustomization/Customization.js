import React, {Component} from 'react';
import App from "../../App";

export default class Customization extends Component {

    constructor(props) {
        super(props);
    }

    render(){
        let parentState = this.props.parentState;
        let instance = this.props.instance;
        let tableName = parentState.tableName;

        const CustomComponent = App.DATAVIEW_CUSTOMIZATIONS[tableName];

        if (typeof CustomComponent !== "undefined") {
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
