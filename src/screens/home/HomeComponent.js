import React, {Component} from 'react';

export class HomeComponent extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="home">
                <div className="introduction">
                    <h1>{this.props.config.titleLong}</h1>
                    <h2>{this.props.config.title}</h2>
                </div>
                <div className="features">
                    <h3>Why {config.title}?</h3>
                    <p className="features-tagline">Congratulation! <span role="img" aria-label="celebrate">🎉</span>
                        The search for the simple tool is over.</p>

                    <p className="features-description">{this.props.config.title} is a collection of a mobile-, backend- and frontend-application.</p>
                </div>
            </div>
        );
    }
}
