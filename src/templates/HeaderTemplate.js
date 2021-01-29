import React, {Component} from 'react';

export class HeaderTemplate extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <div className="content-section introduction">
            <div className="feature-intro">
                <h1>{this.props.title}</h1>
                <p>{this.props.subtitle}</p>
            </div>
        </div>
    }
}
