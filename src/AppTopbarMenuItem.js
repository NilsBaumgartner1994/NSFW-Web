import React, { Component } from 'react';
import { CSSTransition } from 'react-transition-group';
import {Skeleton} from "primereact/skeleton";

export default class AppTopbarMenuItem extends Component {

    static ZERO_SPACE_CHARACTER = <span>&#8203;</span>;

    /**
     * @param props = {theme, activeMenuIndex, toggleIndex, onMenuEnter, toggleMenu, displayName}#
     * and can have children
     */
    constructor(props) {
        super(props);
        this.overlayRef = React.createRef();
    }

    static renderLoadingDisplayname(){
            return(
                <div style={{height: "100%" ,flexDirection:"row", display: "flex", alignItems: "center"}}>
                    <div style={{width: "1rem"}}/>{AppTopbarMenuItem.ZERO_SPACE_CHARACTER}<Skeleton borderRadius="16px" width="8rem" height={"1rem"}/><div style={{width: "1rem"}}/>
                </div>
            );
    }

    static renderLoadingActions(actionName){
        let displayActionName = "Actions";
        if(!!actionName){
            displayActionName = actionName;
        }
        return (
            <ul role="menu" aria-label="Templates">
                <>
                    <li role="none" className="topbar-submenu-header">{displayActionName}</li>
                    <li role="none"> <Skeleton borderRadius="16px" width="10rem" className="p-mb-2"/></li>
                </>
            </ul>
        )
    }

    render() {
        let displayContent = this.props.displayName;
        let childContent = this.props.children;
        if(this.props.isLoading){
            displayContent = AppTopbarMenuItem.renderLoadingDisplayname();
            childContent = AppTopbarMenuItem.renderLoadingActions(this.props.loadingActionName);
        }

        return(
            <li role="none" className="topbar-submenu">
                <button type="button" role="menuitem" onClick={(e) => this.props.toggleMenu(e, this.props.toggleIndex)} aria-haspopup className="p-link" >{displayContent}</button>
                <CSSTransition nodeRef={this.overlayRef} classNames="p-connected-overlay" timeout={{ enter: 120, exit: 100 }} in={this.props.activeMenuIndex === this.props.toggleIndex}
                               unmountOnExit onEntered={this.props.onMenuEnter}>
                    {childContent}
                </CSSTransition>
            </li>
        )
    }
}
