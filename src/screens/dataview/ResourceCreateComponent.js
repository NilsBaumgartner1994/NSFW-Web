import React, {Component} from 'react';
import {ProgressSpinner} from 'primereact/progressspinner';
import {Card} from 'primereact/card';
import {ProgressBar} from 'primereact/progressbar';
import {Button} from 'primereact/button';
import WindowHelper from "../../helper/WindowHelper";
import EditableField from "./EditableField";

import {RouteHelper, NSFWConnector, APIRequest, RequestHelper, SchemeHelper, NSFWResource} from "nsfw-connector";
import App from "../../App";


export default class ResourceCreateComponent extends Component {

    /**
     * @param props
     * {
     *  blockOpenWindowNewResource: boolean,
     *  onHandleResourceCreated: callback(resource),
     *
     * }
     */
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isEdited: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
            requestPending: false,
            visibleDialogDeleteResource: false,
            increasingNumber: 0,
        };
    }

    async componentWillReceiveProps(nextProps) { //update when url is changed
        await this.loadResources(nextProps);
    }

    async componentDidMount() {
        await this.loadResources(this.props);
    }

    async loadResources(props){
        console.log("ResourceCreateComponent: loadResources");
        let tableName = props.tableName;
        let scheme = await NSFWConnector.getScheme(tableName);
        let route = await RouteHelper.getIndexRouteForResourceAsync(tableName);
        let routes = await NSFWConnector.getSchemeRoutes(tableName);
        this.resource = props.resource || {};

        this.setState({
            isLoading: false,
            route: route,
            routes: routes,
            scheme: scheme,
            tableName: tableName
        });
    }

    async createResource(){
        let payloadJSON = this.resource;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,this.state.route,payloadJSON);
        if(!RequestHelper.isSuccess(answer)) {
            let detail = !answer ? 'Unkown error!' : answer.error;
            this.setState({
                requestPending: false,
            });
            App.addToastMessage('Error', detail, 'error');
        } else {
            App.addToastMessage('Success', 'Changes saved', 'success');
            //TODO Go To Instance Side
            let resource = answer.data;
            let resourceClass = new NSFWResource(this.props.tableName);
            await resourceClass.loadByResource(resource);

            this.setState({
                resource: resourceClass,
                requestPending: false,
            });
            if(!this.props.blockOpenWindowNewResource){
                WindowHelper.openLocalURL(this.getInstanceRoute(resourceClass));
            }
            if(!!this.props.onHandleResourceCreated){
                this.props.onHandleResourceCreated(resourceClass);
            }
        }
    }

    getInstanceRoute(resource){
        let schemeRouteGET = this.state.routes["GET"];
        schemeRouteGET = schemeRouteGET.replace("/api","");

        let tableName = this.props.tableName;
        let primaryAttributeKeys = SchemeHelper.getPrimaryAttributeKeys(this.state.scheme);
        for(let i=0;i<primaryAttributeKeys.length; i++){
            let key = primaryAttributeKeys[i];
            let value = resource[key];
            if(!!value){
                let routeParamKey = ":"+tableName+"_"+key;
                schemeRouteGET = schemeRouteGET.replace(routeParamKey,value);
            }
        }

        if(schemeRouteGET.includes(":")){ //if there are still unresolved params, we have no complete route
            return undefined;
        }

        let route = schemeRouteGET;
        return route;
    }

    renderDataCard(){
        return(
            <div className="p-col">
                <Card title={"Data"} style={{width: '500px'}}>
                    <div>{}</div>
                    <table style={{border:0}}>
                        <tbody>
                        {this.renderDataFields()}
                        </tbody>
                    </table>
                    <br></br>
                    {this.renderCreateButton()}
                    {this.renderResetButton()}
                    {this.renderRequestPendingBar()}
                </Card>
            </div>
        )
    }

    resetResource(){
        this.resource.resetResource();
        this.setState({
            isEdited: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
        });
    }

    renderResetButton(){
        if(this.state.isEdited && !this.state.requestPending){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" iconPos="right" onClick={() => {this.resetResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" iconPos="right" disabled="disabled" />);
        }
    }

    renderCreateButton(){
        if(!this.state.requestPending){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Create" icon="pi pi-plus" iconPos="right" onClick={() => {this.createResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Create" icon="pi pi-plus" iconPos="right" disabled="disabled" />);
        }
    }

    renderRequestPendingBar(){
        if(this.state.requestPending){
            return(<ProgressBar mode="indeterminate" style={{height: '6px'}}></ProgressBar>);
        }
        return (null);
    }

    renderDataFields(){
        let output = [];
        let attributeKeys = SchemeHelper.getAttributeKeys(this.state.scheme);
        for(let i=0; i<attributeKeys.length; i++){
            let attributeKey = attributeKeys[i];
            let isEditable = SchemeHelper.isEditable(this.state.scheme, attributeKey);
            if(isEditable){
                output.push(this.renderDataField(attributeKey,isEditable));
            }
        }
        return output;
    }

    renderDataField(attributeKey,isEditable){
        let valueField = this.resource[attributeKey];
        if(isEditable){
            valueField = this.renderEditableField(attributeKey);
        }

        let isAllowedNull = SchemeHelper.isAllowedNull(this.state.scheme, attributeKey);
        let starField = isAllowedNull ? "" : <i className="pi pi-star" style={{'fontSize': '0.7em',"margin-right":"0.5em", "vertical-align": "super","color":"red"}}></i>
        let attributeKeyRow = <th>{starField}{attributeKey}</th>

        return(
            <tr>
                {attributeKeyRow}
                <td>{valueField}</td>
            </tr>
        )
    }

    renderEditableField(attributeKey){
        return <EditableField  key={""+this.state.increasingNumber+attributeKey} scheme={this.state.scheme} editable={true} instance={this} attributeKey={attributeKey}/>;
    }

    renderHeader(){
        return(
            <div className="content-section introduction">
                <div className="feature-intro">
                    <h1>{this.props.tableName}</h1>
                    <p>Creation</p>
                </div>
            </div>
        )
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        return (
            <div>
                {this.renderHeader()}

                <div className="content-section implementation">

                    <div className="p-grid">
                        {this.renderDataCard()}
                    </div>
                </div>
            </div>
        );
    }
}
