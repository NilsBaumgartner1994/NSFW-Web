import React, {Component} from 'react';
import {Skeleton} from "primereact/skeleton";

export default class DefaultComponent extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log('componentDidMount');
    }

    componentDidUpdate() {

        console.log('componentDidUpdate');
    }

    render() {
        console.log("Render Default Component");
        return (
            <div className="home">
                <div className="introduction">
                    <h1>Default Component</h1>
                </div>
                <div className="features">

                </div>
            </div>
        );
    }
}
