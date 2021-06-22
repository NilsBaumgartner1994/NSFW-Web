import React, { Component } from 'react';
import { Route, withRouter } from 'react-router-dom';
import AppContentContext from './AppContentContext';

import NSFWDatabaseMenu from "./nsfwDatabaseMenu/NSFWDatabaseMenu";
import AppMenu from "./AppMenu";

class AppRouter extends Component {

    addPagePath(path) {
        window['gtag']('config', 'UA-93461466-1', {
            'page_path': '/primereact' + path
        });
    }

    constructor(props) {
        super(props);
        this.state = {
            renderedNSFWDatabaseRoutes: null,
        };
    }

    async componentDidMount() {
        let renderedNSFWDatabaseRoutes = await NSFWDatabaseMenu.renderNSFWDatabaseRoutes();
        this.addPagePath(this.props.location.pathname);

        this.unlisten = this.props.history.listen((location) => {
            if (this.props.location.pathname !== location.pathname) {
                this.addPagePath(location.pathname);
            }
        });

        this.setState({
            renderedNSFWDatabaseRoutes: renderedNSFWDatabaseRoutes,
        })
    }

    componentWillUnmount() {
        this.unlisten();
    }

    registerCustomMenuRoutes(){
        let menuItems = AppMenu.CUSTOM_MENUS;
        let routes = [];
        for(let menuParent of menuItems){
            let menuRoutes = menuParent.toRouterList();
            for(let menuRoute of menuRoutes){
                routes.push(<Route exact path={menuRoute.path} component={menuRoute.component}/>);
            }
        }

        let hiddenRoutes = AppMenu.HIDDEN_ROUTES;
        let hiddenRouteExactPaths = Object.keys(hiddenRoutes);
        for(let exactPath of hiddenRouteExactPaths){
            let component = hiddenRoutes[exactPath];
            routes.push(<Route exact path={exactPath} component={component}/>);
        }

        return routes;
    }

    render() {
        return (
            <AppContentContext.Consumer>
                {
                    context => (
                        <>
                            <Route exact path="/" component={AppMenu.CUSTOM_HOME_COMPONENT} />
                            <Route path="/support" component={AppMenu.CUSTOM_SUPPORT_COMPONENT} />
                            {this.state.renderedNSFWDatabaseRoutes}
                            {this.registerCustomMenuRoutes()}
                        </>
                    )
                }
            </AppContentContext.Consumer>
        );
    }
}

export default withRouter(AppRouter);
