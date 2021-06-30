import React, { Component } from 'react';
import {AuthConnector, MyStorage} from "nsfw-connector";
import AppTopbarMenuItem from "./AppTopbarMenuItem";
import {Skeleton} from "primereact/skeleton";

export class AppTopbarCurrentUser extends Component {

    static ZERO_SPACE_CHARACTER = <span>&#8203;</span>;

    constructor(props) {
        super(props);
        this.state = {
            currentUserFound: false,
            displayName: "",
            isLoading: true,
        };
    }

    async componentDidMount() {
        let loggedIn = await AuthConnector.isLoggedInUser();
        let currentUser = await MyStorage.getCurrentUser(); //after isLoggedInUser !
        let displayName = "Mr. Nobody";
        let currentUserFound = false;
        if(!!currentUser){
            currentUserFound = true;
            displayName = currentUser.displayName;
        }

        this.setState({
            currentUserFound: currentUserFound,
            displayName: displayName,
            loggedIn: loggedIn,
        })
    }

    async handleLogout(){
        await AuthConnector.logout();
    }

    renderUserMenuItem(displayContent, menuContent){
        return(
            <AppTopbarMenuItem isLoading={this.state.isLoading} theme={this.props.theme} activeMenuIndex={this.props.activeMenuIndex} toggleIndex={this.props.toggleIndex} onMenuEnter={this.props.onMenuEnter} toggleMenu={this.props.toggleMenu} displayName={displayContent} >
                <ul role="menu" aria-label="Templates">
                    {menuContent}
                </ul>
            </AppTopbarMenuItem>
        )
    }

    render() {
        if(this.state.currentUserFound){
            let actions = <>
                <li role="none" className="topbar-submenu-header">Actions</li>
                <li role="none"><button type="button" className="p-link" role="menuitem" onClick={this.handleLogout.bind(this)}><span>Logout</span></button></li>
            </>;

            return this.renderUserMenuItem(this.state.displayName, actions);
        } else {
            return null;
        }
    }
}

export default AppTopbarCurrentUser;
