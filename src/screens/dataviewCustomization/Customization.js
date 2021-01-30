import React, {Component} from 'react';

export class Customization extends Component {

    constructor(props) {
        super(props);
    }

    render(){
        let parentState = this.props.parentState;
        let instance = this.props.instance;
        let tableName = parentState.tableName;

        let customComponentForTablename = App.DATAVIEW_CUSTOMIZATIONS[tableName];

        if(!!customComponentForTablename){
            return <customComponentForTablename reloadPage={this.props.reloadPage} instance={instance} parentState={this.props.parentState} parentProps={this.props.parentProps} />
        }
        return null;
    }


}
