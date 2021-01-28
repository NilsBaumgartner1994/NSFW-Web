import React, {Component} from 'react';
import config from './../../config';

export class HomeComponent extends Component {

    render() {
        return (
            <div className="home">
                <div className="introduction">
                    <h1>{config.titleLong}</h1>
                    <h2>{config.title}</h2>
                </div>
                <div className="features">
                    <h3>Why {config.title}?</h3>
                    <p className="features-tagline">Congratulation! <span role="img" aria-label="celebrate">🎉</span>
                        The search for the simple tool is over.</p>

                    <p className="features-description">{config.title} is a collection of a mobile-, backend- and frontend-application.</p>
                </div>
            </div>
        );
    }
}
