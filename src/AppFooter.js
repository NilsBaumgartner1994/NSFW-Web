import React, { Component } from 'react';
import npmPackage from "./../package.json";

class AppFooter extends Component {

    constructor(props) {
        super(props);

        let pkg = require('../package.json') || {};
        this.projectName = pkg.name;
        this.projectURL = "";
        if(!!pkg.repository.url){
            this.projectURL = pkg.repository.url;
        }

        this.version = npmPackage.version;
        this.name = npmPackage.name;
        this.repositoryUrl = npmPackage.repository.url;
    }

    render() {
        return (
            <div className="layout-footer">
                <div className="layout-footer-left">
                    <a href={this.projectURL} target="_blank" rel="noopener noreferrer">{this.projectName}</a>
                    <span> powered by </span>
                    <a href={this.repositoryUrl} target="_blank" rel="noopener noreferrer">{this.name}</a>
                    <span> (v. {this.version})</span>
                </div>

                <div className="layout-footer-right">
                    <a href={this.repositoryUrl} target="_blank" rel="noopener noreferrer" className="p-mr-3">
                        <i className="pi pi-github"></i>
                    </a>
                </div>
            </div>
        );
    }
}

export default AppFooter;
