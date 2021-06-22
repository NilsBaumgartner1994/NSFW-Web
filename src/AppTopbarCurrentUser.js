import React, { Component } from 'react';
import { PropTypes } from 'prop-types'
import { Link } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { Tooltip } from 'primereact/tooltip';
import { Badge } from 'primereact/badge';
import {AuthConnector, MyStorage} from "nsfw-connector";
import WindowHelper from "./helper/WindowHelper";

export class AppTopbarCurrentUser extends Component {

    constructor(props) {
        super(props);


        this.overlayRef = React.createRef();
        this.state = {
            activeMenuIndex: null,
            displayName: "",
        };
    }

    async componentDidMount() {
        let loggedIn = await AuthConnector.isLoggedInUser();
        let currentUser = await MyStorage.getCurrentUser(); //after isLoggedInUser !
        let displayName = "Mr. Nobody";
        if(!!currentUser){
            displayName = currentUser.displayName;
        }

        this.setState({
            displayName: displayName
        })
    }

    async handleLogout(){
        await AuthConnector.logout();
    }

    renderCurrentUser(){
        return(
            <li role="none" className="topbar-submenu">
                <button type="button" role="menuitem" onClick={(e) => this.props.toggleMenu(e, this.props.toggleIndex)} aria-haspopup className="p-link">{this.state.displayName}</button>
                <CSSTransition nodeRef={this.overlayRef} classNames="p-connected-overlay" timeout={{ enter: 120, exit: 100 }} in={this.props.activeMenuIndex === this.props.toggleIndex}
                               unmountOnExit onEntered={this.props.onMenuEnter}>
                    <ul ref={this.overlayRef} role="menu" aria-label="Templates">
                        <li role="none" className="topbar-submenu-header">Actions</li>
                        <li role="none"><button type="button" className="p-link" role="menuitem" onClick={this.handleLogout.bind(this)}><span>Logout</span></button></li>
                    </ul>
                </CSSTransition>
            </li>
        )
    }

    render() {
        return this.renderCurrentUser();
    }
}

export default AppTopbarCurrentUser;
