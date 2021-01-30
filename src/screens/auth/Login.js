import React, {Component} from 'react';
import {Card} from "../../components/card/Card";
import {Dropdown} from "../../components/dropdown/Dropdown";
import {InputText} from "../../components/inputtext/InputText";
import StringHelper from "../../helper/StringHelper";
import {Button} from "../../components/button/Button";
import {Checkbox} from "../../components/checkbox/Checkbox";
import config from './../../config.json';

import {APIRequest, AuthConnector, MyStorage, RequestHelper} from "nsfw-connector";
import App from "../../App";

export default class Login extends Component {

    constructor(props) {
        super(props);
        this.state = {
            auths: {},
            selectedAuth: null,
            authSelectItems: [],
            currentUser: null,
            rememberMe: false,
            showPassword: false,
            authInputs: {},
            loggingInProceeding: false,
        };
        this.loadInformations();
    }

    getAuthSelectItems(auths){
        let authSelectItems = [];
        let keys = Object.keys(auths);
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            let label = auths[key].name;
            authSelectItems.push({label: label, value: key});
        }
        return authSelectItems;
    }

    async loadInformations(){
        let auths = await AuthConnector.getAuths();
        let authSelectItems = this.getAuthSelectItems(auths);
        let selectedAuth = null;
        if(!!authSelectItems && authSelectItems.length > 0){
            selectedAuth = authSelectItems[0].value;
            for(let i=0; i<authSelectItems.length; i++){
                let authSelectItem = authSelectItems[i];
                console.log(authSelectItem);
                if(authSelectItem.value === config.preferedAuthMethod){
                    selectedAuth = authSelectItem.value;
                }
            }
        }

        let state = {
            auths: auths,
            authSelectItems: authSelectItems,
            authInputs: {},
            rememberMe: false,
            selectedAuth: selectedAuth,
        };
        let loadedCredentails = await this.loadStoredCredentials();
        state = Object.assign(state, loadedCredentails);
        this.setState(state);
    }

    async loadStoredCredentials(){
        let state = {};
        let selectedAuth = await MyStorage.getAuthMethod();
        if(!!selectedAuth){
            state.selectedAuth = selectedAuth;
        }
        state.currentUser = null;
        let currentUser = await MyStorage.getCurrentUser();
        if(!!currentUser){
            state.currentUser = currentUser;
        }

        return state;
    }

    async handleChangeEvents(selectedAuth,paramKey,event) {

        let authInputs = this.state.authInputs;
        let selectedAuthInputs = authInputs[selectedAuth] || {};
        selectedAuthInputs[paramKey] = event.target.value;
        authInputs[selectedAuth] = selectedAuthInputs;

        await this.setState({
            authInputs: authInputs
        });
    }

    async handleSubmitevents(event) {
        event.preventDefault();
        await this.setState({
            loggingInProceeding: true
        });
        // handle submit events
        let selectedAuthInputs = this.state.authInputs[this.state.selectedAuth] || {};
        let authObject = selectedAuthInputs;
        authObject["authMethod"] = this.state.selectedAuth;

        let authAnswer = await AuthConnector.authorize(authObject,this.state.rememberMe);

        let nextState = {
            loggingInProceeding: false,
            showPassword: false,
        };

        if(RequestHelper.isSuccess(authAnswer)){
            let currentUser = await MyStorage.getCurrentUser();
            nextState.currentUser = currentUser;
            await App.AppInstance.setLoggedInState(true);
        }

        nextState = Object.assign(this.state,nextState);
        await this.setState(nextState);
    }

    isParamPassword(paramKey){
        return paramKey==="password";
    }

    renderParamIcon(paramKey){
        if(this.isParamPassword(paramKey)){
            return <i className="pi pi-key"></i>;
        } else {
            return <i className="pi pi-user"></i>;
        }
    }

    renderShowPasswordIcon(){
        let icon = this.state.showPassword ? "eye" : "eye-slash";

        return (
            <Button icon={"pi pi-"+icon} type={"button"} className="" onClick={() => {this.setState({showPassword: !this.state.showPassword})}}/>
        );
    }

    renderParam(selectedAuth, paramKey,label){
        let isPasswordParam = this.isParamPassword(paramKey);
        let type = "text";
        if(isPasswordParam && !this.state.showPassword){
            type = "password";
        }
        let selectedAuthInputs = this.state.authInputs[selectedAuth] || {};
        let value = selectedAuthInputs[paramKey] || "";

        let rightAddon = isPasswordParam ? this.renderShowPasswordIcon() : null;

        return [
            <div className="p-field p-col" >
                <div className="p-fluid" >
                    <span className="p-inputgroup p-fluid">
                        <span className="p-inputgroup-addon">{this.renderParamIcon(paramKey)}</span>
                        <InputText value={value} placeholder={StringHelper.capitalizeFirstLetter(paramKey)} className="p-fluid" id={paramKey} type={type} onChange={this.handleChangeEvents.bind(this,selectedAuth,paramKey)} />
                        {rightAddon}
                        <label htmlFor={paramKey}></label>
                    </span>
                </div>
            </div>
        ];

    }

    /**

     */

    renderParams(selectedAuth, params){
        let inputs = [];
        let keys = Object.keys(params);
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            let label = params[key];
            inputs.push(this.renderParam(selectedAuth,key,label));
        }
        return inputs;
    }

    renderRememberMe(){
        return(
            <div className="p-field p-col" >
                <div className="p-fluid" >
                        <Checkbox inputId="cb3" value={"Remember me"} onChange={e => this.setState({rememberMe: e.checked})} checked={this.state.rememberMe}></Checkbox>
                        <label htmlFor="cb3" className="p-checkbox-label">{"Remember me"}</label>
                </div>
            </div>
        );
    }

    renderSelectedAuthLogin(){
        let selectedAuth = this.state.selectedAuth;
        let auths = this.state.auths;
        if(!selectedAuth || !auths){
            return null;
        }
        let authMethodInformation = auths[selectedAuth];
        if(!authMethodInformation){
            return null;
        }

        let name = authMethodInformation.name;
        let params = authMethodInformation.params;
        let inputs = this.renderParams(selectedAuth, params);
        let submitText = "LOG IN";
        if(this.state.loggingInProceeding){
            submitText = <i className="pi pi-spin pi-spinner"></i>
        }

        return (
            <form onSubmit={this.handleSubmitevents.bind(this)}>
                {inputs}
                {this.renderRememberMe()}
                <div className="p-field p-col" >
                    <div className="p-fluid">
                        <Button className="p-button-raised" disabled={this.state.loggingInProceeding} data-test="submit" type={"submit"} label={submitText} style={{width:'100%',"font-weight": "bold"}}></Button>
                    </div>
                </div>
            </form>
        )
    }

    renderUserPreview(){
        let currentUser = this.state.currentUser;
        let displayName = " ";
        if(!!currentUser && currentUser.displayName){
            displayName = ", "+currentUser.displayName;
        }
        return(
            <div className="p-grid p-dir-col p-align-center">
                <div className="p-col"><i className="pi pi-user" style={{'fontSize': '6em'}}></i></div>
                <div className="p-col p-card-subtitle">{"WELCOME BACK "+displayName+"!"}</div>
            </div>
        )
    }

    async handleLogout(){
        let answer = await AuthConnector.logout();
        await this.loadStoredCredentials();
    }

    renderLogout(){
        return(
            <div className="p-grid p-dir-col p-align-center" style={{"marginTop":"2em"}}>
                <div className="p-col">
                    <a href="#" className="p-clickable" onClick={this.handleLogout.bind(this)}>
                        <div style={{"text-decoration": "underline"}}>That's not me ! Get me out of here !</div>
                    </a>
                </div>
            </div>
        )
    }

    renderLoginCard(){
        return (
            <div className="p-grid p-justify-center p-align-center" style={{"height":"100vh"}}>
                <div style={{width: "400px"}}>
                    <Card>
                        {this.renderUserPreview()}
                        <Dropdown value={this.state.selectedAuth} options={this.state.authSelectItems} onChange={(e) => {this.setState({selectedAuth: e.value})}} placeholder="Select an Auth"/>
                        {this.renderSelectedAuthLogin()}
                        {this.renderLogout()}
                    </Card>
                </div>
            </div>
        );
    }

    renderAreaForLoginCard(loginCard){
        let filler = <div className="p-col-12 p-sm-0  p-md-1  p-lg-2  p-xl-3"></div>;

        return (
            <div className="p-grid">
                {filler}
                <div className="p-col-12 p-sm-12 p-md-10 p-lg-8 p-xl-6" >
                    {loginCard}
                </div>
                {filler}
        </div>)
    }

    render() {
        return (
            <div className="homeBackground">
                    {this.renderAreaForLoginCard(this.renderLoginCard())}
            </div>
        )

    }
}
