import React, {Component} from 'react';

export default class DataviewCustomization extends Component {

    static DATAVIEW_CUSTOMIZATIONS_SETTINGS_HIDE_DEFAULT = {

    }

    static DATAVIEW_CUSTOMIZATIONS_CONTENT = {

    }

    static addDataviewCustomization(tableName, component, hideDefault=false){
        DataviewCustomization.DATAVIEW_CUSTOMIZATIONS_CONTENT[tableName] = component;
        if(hideDefault){
            DataviewCustomization.DATAVIEW_CUSTOMIZATIONS_SETTINGS_HIDE_DEFAULT[tableName] = true;
        }
    }

    constructor(props) {
        super(props);
    }

    static isDefaultContentHidden(tableName){
        return DataviewCustomization.DATAVIEW_CUSTOMIZATIONS_SETTINGS_HIDE_DEFAULT[tableName];
    }

    render(){
        let parentState = this.props.parentState;
        let instance = this.props.instance;
        let tableName = parentState.tableName;

        const CustomComponent = DataviewCustomization.DATAVIEW_CUSTOMIZATIONS_CONTENT[tableName];
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
