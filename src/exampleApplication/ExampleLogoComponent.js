import React, {Component} from 'react';

export default class ExampleLogoComponent extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        let color = this.props.darkTheme ? "purple" : "orange";

        return (
            <div style={{height: 40, width: 100, backgroundColor: color}}></div>
        );
    }
}
