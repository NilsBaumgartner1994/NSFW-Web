import React, {Component} from 'react';
import ServerWeb from "../../ServerWeb";

export default class SupportComponent extends Component {

    render() {
        return (
            <div className="home">
                <div className="introduction">
                    <h1>Support is near</h1>
                    <h2>DON'T PANIC</h2>
                </div>
                <div className="features">
                    <h3><a href={ServerWeb.CONFIG.githubLink}>GitHub Repository</a></h3>
                    <p className="features-tagline">Whuups! <span role="img" aria-label="celebrate">🎉</span> Visit our repository for help</p>
                </div>
            </div>
        );
    }
}
