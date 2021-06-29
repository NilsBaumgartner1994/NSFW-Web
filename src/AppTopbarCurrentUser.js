import React, { Component } from 'react';
import {AuthConnector, MyStorage} from "nsfw-connector";
import AppTopbarMenuItem from "./AppTopbarMenuItem";
import {Skeleton} from "primereact/skeleton";

export class AppTopbarCurrentUser extends Component {

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
            displayName: displayName,
            loggedIn: loggedIn,
            //isLoading: false
        })
    }

    async handleLogout(){
        await AuthConnector.logout();
    }

    renderUserMenuItem(displayContent, menuContent){
        return(
            <AppTopbarMenuItem theme={this.props.theme} activeMenuIndex={this.props.activeMenuIndex} toggleIndex={this.props.toggleIndex} onMenuEnter={this.props.onMenuEnter} toggleMenu={this.props.toggleMenu} displayName={displayContent} >
                <ul role="menu" aria-label="Templates">
                    {menuContent}
                </ul>
            </AppTopbarMenuItem>
        )
    }

    renderLoadingSkeleton(){
        let displayContent = (
            <div className="p-grid" style={{width: "100px", height: "70px", alignContent: "center", backgroundColor: "red"}}>
                <div className="p-col-4">
                    <Skeleton shape="circle" size="40px" />
                </div>
                <div className="p-col-1">

                </div>
                <div className="p-col-6">
                    <Skeleton width="100%" height="1rem" borderRadius="16px" />
                    <Skeleton width="80%" height="1rem" borderRadius="16px" style={{margin: "5px"}} />
                </div>
                <div className="p-col-1">

                </div>
            </div>
        );

        let actions = (
            <>
                <li role="none" className="topbar-submenu-header">Actions</li>
                <li role="none"> <Skeleton borderRadius="16px" width="10rem" className="p-mb-2"></Skeleton></li>
            </>
        )

        return this.renderUserMenuItem(displayContent, actions);
    }

    render() {
        if(this.state.isLoading){
            return this.renderLoadingSkeleton();
        }

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
