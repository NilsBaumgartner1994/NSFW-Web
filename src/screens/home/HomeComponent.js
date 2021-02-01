import React, {Component} from 'react';
import ServerWeb from "../../ServerWeb";

export default class HomeComponent extends Component {

    render() {
        return (
            <div className="home">
                <div className="introduction">
                    <h1>{ServerWeb.CONFIG.titleLong}</h1>
                    <h2>{ServerWeb.CONFIG.title}</h2>
                </div>
                <div className="features">
                    <h3>Why {ServerWeb.CONFIG.title}?</h3>
                    <p className="features-tagline">Congratulation! <span role="img" aria-label="celebrate">🎉</span>
                        The search for the simple tool is over.</p>

                    <p className="features-description">{ServerWeb.CONFIG.title} is a collection of a mobile-, backend- and frontend-application.</p>
                </div>
            </div>
        );
    }
}
