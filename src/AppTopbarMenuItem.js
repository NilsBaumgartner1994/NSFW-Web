import React, { Component } from 'react';
import { CSSTransition } from 'react-transition-group';

export default class AppTopbarMenuItem extends Component {

    /**
     * @param props = {theme, activeMenuIndex, toggleIndex, onMenuEnter, toggleMenu, displayName}#
     * and can have children
     */
    constructor(props) {
        super(props);
        this.overlayRef = React.createRef();
    }

    render() {
        return(
            <li role="none" className="topbar-submenu">
                <button type="button" role="menuitem" onClick={(e) => this.props.toggleMenu(e, this.props.toggleIndex)} aria-haspopup className="p-link" style={{height: "100%"}}>{this.props.displayName}</button>
                <CSSTransition nodeRef={this.overlayRef} classNames="p-connected-overlay" timeout={{ enter: 120, exit: 100 }} in={this.props.activeMenuIndex === this.props.toggleIndex}
                               unmountOnExit onEntered={this.props.onMenuEnter}>
                    {this.props.children}
                </CSSTransition>
            </li>
        )
    }
}
