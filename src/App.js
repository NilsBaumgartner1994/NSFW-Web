import React, { Component } from 'react';
import AppMenu from './AppMenu';
import { classNames } from './components/utils/ClassNames';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import "primereact/resources/primereact.css";

import './assets/style/flags.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'prismjs/themes/prism-coy.css';
import './assets/style/app/App.scss';

import AppRouter from './AppRouter';
import AppTopbar from './AppTopbar';
import AppFooter from './AppFooter';
import AppConfig from './AppConfig';

import AppContentContext from './AppContentContext';
import { Toast } from 'primereact/toast';
import PrimeReact from 'primereact/api';
import { AppChangelogDialog } from './AppChangelogDialog';
import {RouteHelper, NSFWConnector, AuthConnector, MyStorage} from "nsfw-connector";
import Login from "./screens/auth/Login";
import WindowHelper, {GlobalHistory} from "./helper/WindowHelper";
import {withRouter} from "react-router-dom";


export class App extends Component {

    static AppInstance = null;

    static onThemeChangeCallback = null;
    static toastInstance = null;

    constructor(props) {
        super(props);
        App.AppInstance = this;

        this.news_key = 'primenews-react';
        this.theme_key = 'primetheme-react';

        this.state = {
            theme: 'saga-blue',
            inputStyle: 'outlined',
            ripple: false,
            darkTheme: false,
            themeCategory: null,
            schemes: {},
            menuMode: null,
            sidebarActive: false,
            configuratorActive: false,
            changelogActive: false,
            searchVal: null,
            isRippleConfigDisabled: false,
            versions: [],
            loading: true,
            loggedIn: false,
        };

        this.onThemeChange = this.onThemeChange.bind(this);
        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.onMaskClick = this.onMaskClick.bind(this);
        this.onInputStyleChange = this.onInputStyleChange.bind(this);
        this.onRippleChange = this.onRippleChange.bind(this);

        this.showChangelogDialog = this.showChangelogDialog.bind(this);
        this.hideChangelogDialog = this.hideChangelogDialog.bind(this);

        PrimeReact.ripple = false;
    }

    async initTheme(){
        const href = window.location.href;
        const queryParams = href.split('?');
        let theme = this.state.theme;

        if (queryParams && queryParams[1]) {
            const searchParams = new URLSearchParams(queryParams[1]);
            theme = searchParams.get('theme');

            const menuMode = searchParams.get('menu');
            if (menuMode) {
                await this.setState({ menuMode });
            }
        }
        else {
            theme = localStorage.getItem(this.theme_key);
        }

        if (theme) {
            const dark = this.isDarkTheme(theme);
            await this.onThemeChange({
                theme,
                dark
            });
        }
    }

    async init() {
        await this.initTheme();
        await this.loadInformations();
    }

    async handleLogout() {
        await this.setLoggedInState(false);
    }

    async loadInformations(){
        NSFWConnector.reset();
        NSFWConnector.Callback_Logout = this.handleLogout.bind(this);
        let loggedIn = await AuthConnector.isLoggedInUser();
        let schemes = await NSFWConnector.getSchemes() || {};
        let tableNames = Object.keys(schemes);

        let currentUser = await MyStorage.getCurrentUser(); //after isLoggedInUser !
        let displayName = "Mr. Nobody";
        if(!!currentUser){
            displayName = currentUser.displayName;
        }

        await this.setState({
            tableNames: tableNames,
            displayName: displayName,
            schemes: schemes,
            loggedIn: loggedIn,
            loading: false,
        })
    }

    async setLoggedInState(loggedIn){
        if(loggedIn){
            await this.loadInformations();
        } else {
            await this.setState({
                loggedIn: loggedIn
            });
        }
    }

    async onThemeChange(event) {
        let { theme, dark: darkTheme} = event;
        let themeElement = document.getElementById('theme-link');
        let themeCategory = /^(md-|mdc-)/i.test(theme) ? 'material' : (/^(bootstrap)/i.test(theme) ? 'bootstrap' : null);
        let state = {};

        if (theme.startsWith('md')) {
            PrimeReact.ripple = true;
            state = { ripple: true };
        }

        themeElement.setAttribute('href', themeElement.getAttribute('href').replace(this.state.theme, event.theme));

        state = {...state, ...{
                theme,
                darkTheme,
                themeCategory
            }
        };

        await this.setState(state, () => {
            localStorage.setItem(this.theme_key, this.state.theme);
        });

        if (!!App.onThemeChangeCallback) {
            let args = {
                theme: theme,
                darkTheme: darkTheme,
                themeCategory: themeCategory
            };
            await App.onThemeChangeCallback(args);
        }
    }

    onMenuButtonClick() {
        this.menuClick = true;

        if (this.sidebarActive) {
            this.setState({ sidebarActive: false });
            this.removeClass(document.body, 'blocked-scroll');
        }
        else {
            this.setState({ sidebarActive: true });
            this.addClass(document.body, 'blocked-scroll');
        }
    }

    onMenuItemClick() {
        console.log("Menu Item Click");
        this.setState({ sidebarActive: false });
        this.removeClass(document.body, 'blocked-scroll');
    }

    onMaskClick() {
        this.setState({ sidebarActive: false });
        this.removeClass(document.body, 'blocked-scroll');
    }

    isDarkTheme(theme) {
        return /(dark|vela|arya|luna)/i.test(theme);
    }

    onInputStyleChange(inputStyle) {
        this.setState({ inputStyle });
    }

    onRippleChange(value, isRippleConfigDisabled) {
        PrimeReact.ripple = value;

        this.setState({ ripple: value, isRippleConfigDisabled });
    }

    showChangelogDialog(searchVal) {
        this.setState({
            changelogActive: true,
            searchVal
        });
    }

    hideChangelogDialog() {
        this.setState({ changelogActive: false });
    }

    addClass(element, className) {
        if (element.classList)
            element.classList.add(className);
        else
            element.className += ' ' + className;
    }

    removeClass(element, className) {
        if (element.classList)
            element.classList.remove(className);
        else
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

    hasClass(element, className) {
        if (element.classList)
            return element.classList.contains(className);
        else
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }

    isOutdatedIE() {
        let ua = window.navigator.userAgent;
        if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        if (this.isOutdatedIE()) {
            App.toastInstance.show({ severity: 'warn', summary: 'Limited Functionality', detail: 'Although PrimeReact supports IE11, ThemeSwitcher in this application cannot be not fully supported by your browser. Please use a modern browser for the best experience of the showcase.', life: 6000 });
        }

        this.init();
    }

    render() {
        const wrapperClassName = classNames('layout-wrapper', {
            'layout-overlay': this.state.menuMode && this.state.menuMode === 'overlay',
            'p-input-filled': this.state.inputStyle === 'filled',
            'p-ripple-disabled': this.state.ripple === false,
            [`theme-${this.state.themeCategory}`]: !!this.state.themeCategory,
        });
        const maskClassName = classNames('layout-mask', {
            'layout-mask-active': this.state.sidebarActive
        });

        console.log("logged in: ", this.state.loggedIn);
        console.log("Render App")
        if(this.state.loading){
            console.log("App still loading");
            return null;
        }
        if(!this.state.loggedIn){
            console.log("Show login state");
            return <Login/>;
        }
        console.log("Show logged in App");

        return (
            <div className={wrapperClassName}>
                <GlobalHistory />
                <Toast ref={(el) => App.toastInstance = el} />

                <AppTopbar onMenuButtonClick={this.onMenuButtonClick} onThemeChange={this.onThemeChange} theme={this.state.theme} darkTheme={this.state.darkTheme} versions={this.state.versions} />

                <AppMenu active={this.state.sidebarActive} onMenuItemClick={this.onMenuItemClick} schemes={this.state.schemes} />

                <AppContentContext.Provider value={{
                    ripple: this.state.ripple,
                    inputStyle: this.state.inputStyle,
                    darkTheme: this.state.darkTheme,
                    changelogText: "VIEW CHANGELOG",
                    onChangelogBtnClick: this.showChangelogDialog,
                    onInputStyleChange: this.onInputStyleChange,
                    onRippleChange: this.onRippleChange
                }}>
                    <div className="layout-content">
                        <AppRouter schemes={this.state.schemes}/>

                        <AppChangelogDialog visible={this.state.changelogActive} searchVal={this.state.searchVal} onHide={this.hideChangelogDialog} />

                        <AppFooter />
                    </div>

                    <AppConfig theme={this.state.theme} ripple={this.state.ripple} isRippleConfigDisabled={this.state.isRippleConfigDisabled} onThemeChange={this.onThemeChange} onRippleChange={this.onRippleChange} />
                </AppContentContext.Provider>

                <div className={maskClassName} onClick={this.onMaskClick}></div>
            </div>
        );
    }
}

export default App;
