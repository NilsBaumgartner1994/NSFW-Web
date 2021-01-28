import React, {Component} from 'react';
import {Exams} from './Exams';
import {Examtasks} from "./Examtasks";
import {Taskvariations} from "./Taskvariations";
import {Expectations} from "./Expectations";

export class Customization extends Component {

    constructor(props) {
        super(props);
    }

    render(){
        let parentState = this.props.parentState;
        let instance = this.props.instance;
        let tableName = parentState.tableName;
        switch(tableName){
            case "Exams" : return <Exams reloadPage={this.props.reloadPage} instance={instance} parentState={this.props.parentState} parentProps={this.props.parentProps} />
            case "Examtasks" : return <Examtasks reloadPage={this.props.reloadPage} instance={instance} parentState={this.props.parentState} parentProps={this.props.parentProps} />
            case "Taskvariations" : return <Taskvariations reloadPage={this.props.reloadPage} instance={instance} parentState={this.props.parentState} parentProps={this.props.parentProps} />
            case "Expectations" : return <Expectations reloadPage={this.props.reloadPage} instance={instance} parentState={this.props.parentState} parentProps={this.props.parentProps} />
        }
        return null;
    }


}
