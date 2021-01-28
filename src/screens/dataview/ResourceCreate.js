import React, {Component} from 'react';
import {ResourceCreateComponent} from './ResourceCreateComponent';

export class ResourceCreate extends Component {

    constructor(schemes,tableName) {
        super();
        this.state = {
            schemes: schemes,
            tableName: tableName,
        };
    }

    render() {
        return <ResourceCreateComponent schemes={this.state.schemes} tableName={this.state.tableName} />;
    }
}
