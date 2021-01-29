import React, {Component} from 'react';

export class Customization extends Component {

    constructor(props) {
        super(props);
    }

    render(){
        let parentState = this.props.parentState;
        let instance = this.props.instance;
        let tableName = parentState.tableName;
        switch(tableName){
            //case "Expectations" : return <Expectations reloadPage={this.props.reloadPage} instance={instance} parentState={this.props.parentState} parentProps={this.props.parentProps} />
        }
        return null;
    }


}
