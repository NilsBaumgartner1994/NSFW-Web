import React, {Component} from 'react';
import {ProgressSpinner} from '../../components/progressspinner/ProgressSpinner';
import {Card} from '../../components/card/Card';
import {Growl} from '../../components/growl/Growl';
import {ProgressBar} from '../../components/progressbar/ProgressBar';
import {Button} from '../../components/button/Button';
import {Dialog} from '../../components/dialog/Dialog';
import {OverlayPanel} from '../../components/overlaypanel/OverlayPanel';
import {AssociationIndexOverlay} from "./AssociationIndexOverlay";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import App from "../../App";
import {MyImageUploader} from "../../helper/MyImageUploader";
import {ResourceCreateComponent} from "./ResourceCreateComponent";
import {EditableField} from "./EditableField";
import {Customization} from "../dataviewCustomization/Customization";

import {RouteHelper, NSFWConnector, APIRequest, RequestHelper, SchemeHelper, ResourceAssociationHelper} from "nsfw-connector";

export default classResourceInstance extends Component {

    constructor(schemes,tableName) {
        super();
        this.state = {
            schemes: schemes,
            tableName: tableName,
            isLoading: true,
            isEdited: false,
            editingAllowed: true,
            isNotFound: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
            dialogs: {},
            requestPending: false,
            visibleDialogDeleteResource: false,
            increasingNumber: 0,
        };
    }

    async componentDidMount() {
		const { match: { params } } = this.props;
		this.params = params;
		console.log(params);
        await this.loadResources(params);
    }

    async reloadPage(){
        await this.loadResources(this.params);
    }

    async loadResources(params){
        let route = RouteHelper.getInstanceRouteForParams(this.state.schemes,this.state.tableName,params);
        let resource = null;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,route);
        if(RequestHelper.isSuccess(answer)){
            resource = answer.data;

            let scheme = await NSFWConnector.getScheme(this.state.tableName);
            let schemes = await NSFWConnector.getSchemes();
            let associations = await NSFWConnector.getSchemeAssociations(this.state.tableName);
            let associationResources = await this.loadAssociationResources(route,associations);
            let associationSchemes = await this.loadAssociationSchemes(associations);

            console.log("resource");
            console.log(resource);
            console.log("associationResources");
            console.log(associationResources);

            this.resource = resource;

            this.setState({
                isLoading: false,
                resourceCopy: JSON.parse(JSON.stringify(resource)),
                associations: associations,
                associationResources: associationResources,
                associationSchemes: associationSchemes,
                route: route,
                scheme: scheme,
                schemes: schemes,
                params: params,
                increasingNumber: this.state.increasingNumber+1
            });
        } else {
            this.setState({
                isLoading: false,
                isNotFound: true,
            });
        }
    }

    async loadAssociationSchemes(associations){
        let associationSchemes = {};

        let associationTableNames = Object.keys(associations);
        for(let i=0; i<associationTableNames.length; i++){
            let key = associationTableNames[i];
            let associationTableName = associations[key]["target"];
            let scheme = await NSFWConnector.getScheme(associationTableName);
            associationSchemes[associationTableName] = scheme;
        }
        return associationSchemes;
    }

    async loadAssociationResources(route,associations){
        let associationResources = {};

        let associationTableNames = Object.keys(associations);
        for(let i=0; i<associationTableNames.length; i++){
            let key = associationTableNames[i];
            let associationName = associations[key]["associationName"];
            let answer = await this.loadAssociation(route,associationName);
            if(!!answer && !answer.error){
                associationResources[associationName] = answer;
            } else {
                associationResources[associationName] = null;
            }
        }
        return associationResources;
    }

    async loadAssociation(route,associationName){
        route = route+"/associations/"+associationName;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,route);
        if(RequestHelper.isSuccess(answer)){
            return answer.data;
        } else {
            return null;
        }
    }

    async updateResource(){
        let resource = this.resource;
        let payloadJSON = resource;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_PUT,this.state.route,payloadJSON);
        if(!RequestHelper.isSuccess(answer)){
            this.setState({
                requestPending: false,
            });
            let detail = !answer ? 'Unkown error!' : answer.error;
            App.addToastMessage("Error",detail,"error");
        } else {
            this.resource = answer.data;

            this.setState({
                resourceCopy: answer.data,
                isEdited: false,
                requestPending: false,
            });
            App.addToastMessage("Success","Changes saved");
        }
    }

    renderDataCard(){
        return(
            <div className="p-col-12">
                <Card title={"Data"}>
                    {this.renderDataFields()}
                    {this.renderUpdateButton()}
                    {this.renderResetButton()}
                    {this.renderRequestPendingBar()}
                </Card>
            </div>
        )
    }

    resetResource(){
        this.resource = JSON.parse(JSON.stringify(this.state.resourceCopy));
        this.setState({
            isEdited: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
            increasingNumber: this.state.increasingNumber+1
        });
    }

    unsavedContentExist(){
        return this.state.isEdited && !this.state.requestPending;
    }

    renderResetButton(){
        if(this.unsavedContentExist()){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" onClick={() => {this.resetResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" disabled={true} />);
        }
    }

    renderUpdateButton(){
        if(this.unsavedContentExist()){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Save" icon="pi pi-check" onClick={() => {this.updateResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Save" icon="pi pi-check" disabled={true} />);
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
            if(!SchemeHelper.isReferenceField(this.state.scheme, attributeKey)){
                let isEditable = SchemeHelper.isEditable(this.state.scheme, attributeKey);
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
        let attributeKeyRow = <div>{starField}{attributeKey}</div>

        return(
            <div className="p-grid">
                <div className="p-col-3" >{attributeKeyRow}</div>
                <div className="p-col-9" >{valueField}</div>
            </div>
        )
    }

    renderEditableField(attributeKey){
        console.log(attributeKey+" editingAllowed: "+this.state.editingAllowed);
        return <EditableField key={""+this.state.increasingNumber+attributeKey} scheme={this.state.scheme} editable={this.state.editingAllowed} instance={this} attributeKey={attributeKey}/>
    }

    renderAssociationCards(){
        let associationTableNames = Object.keys(this.state.associations);
        let output = [];
        for(let i=0; i<associationTableNames.length; i++){
            let key = associationTableNames[i];
            let associationName = this.state.associations[key]["associationName"];
            let associationTableName = this.state.associations[key]["target"];
            output.push(this.renderAssociationCard(associationTableName,associationName));
        }

        return output;
    }

    renderAssociationCard(associationTableName,associationName){
        if(associationTableName==="Images"){
            return this.renderAssociationCardImage(associationTableName,associationName);
        }
        let isPlural = associationTableName === associationName;
        return isPlural ? this.renderAssociationCardPlural(associationTableName,associationName) : this.renderAssociationCardSingle(associationTableName,associationName);
    }

    renderAssociationCardImage(associationTableName,associationName){
        return(
            <div className="p-col-12">
                <Card title={associationName}>
                    <MyImageUploader resource={this.resource} tableName={this.state.tableName} />
                </Card>
            </div>
        )
    }

    renderAssociationCardPlural(associationTableName,associationName){
        let associatedResources = this.state.associationResources[associationName];
        let modelscheme = this.state.associationSchemes[associationTableName];

        let amount = 0;
        if(!!associatedResources){
            amount = associatedResources.length;
        }
        let amountText = "("+amount+")";

        let overlaypanelID = "overlayPanel-"+associationName;
        let overlaypanelIDCreateAndAdd = overlaypanelID+"CreateAndAdd";
        let overlaypanelIDView = overlaypanelID+"View";
        let overlaypanelIDAddNew = overlaypanelID+"AddNew";
        let overlaypanelIDRemove = overlaypanelID+"Remove";

        let addCallbackFunction = this.handleAddAssociationsMultiple.bind(this,overlaypanelIDAddNew,associationTableName,associationName);
        let removeCallbackFunction = this.handleRemoveAssociationsMultiple.bind(this,overlaypanelIDRemove,associationTableName,associationName);

        let noAssociations = amount===0;

        return(
            <div className="p-col-12">
                <Card title={associationName+" "+amountText}>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle} showCloseIcon={true} ref={(el) => this[overlaypanelIDCreateAndAdd] = el}>
                        <ResourceCreateComponent schemes={this.state.schemes} tableName={associationTableName} onHandleResourceCreated={(resource) => {addCallbackFunction([resource]);}} />
                    </OverlayPanel>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle} showCloseIcon={true} ref={(el) => this[overlaypanelIDView] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDView+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_View} showOnlyAssociated={true} tableName={associationTableName} scheme={modelscheme} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle}  showCloseIcon={true} ref={(el) => this[overlaypanelIDAddNew] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDAddNew+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE} callbackFunction={addCallbackFunction} tableName={associationTableName} scheme={modelscheme} associatedResources={associatedResources} ></AssociationIndexOverlay>
                    </OverlayPanel>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle}  showCloseIcon={true} ref={(el) => this[overlaypanelIDRemove] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDRemove+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE} callbackFunction={removeCallbackFunction} tableName={associationTableName} scheme={modelscheme} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>

                    <Button style={{"margin-right":"1em"}} type="button" icon="pi pi-plus" className="p-button-success" label="Create & Add" onClick={(e) => this[overlaypanelIDCreateAndAdd].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={noAssociations} type="button" icon="pi pi-search" label="View" onClick={(e) => this[overlaypanelIDView].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} type="button" icon="pi pi-plus" className="p-button-success" label="Add" onClick={(e) => this[overlaypanelIDAddNew].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={noAssociations} type="button" icon="pi pi-minus" className="p-button-danger" label="Remove" onClick={(e) => this[overlaypanelIDRemove].toggle(e)} />

                </Card>
            </div>
        )
    }

    async handleAddAssociationsMultiple(overlaypanelID,associationTableName,associationName,associationResources){
        let responseJSON = await ResourceAssociationHelper.handleRequestTypeOnMultiplePluralAssociation(
            this.resource,
            this.state.tableName,
            associationTableName,
            associationName,
            associationResources,
            RequestHelper.REQUEST_TYPE_POST
        )

        let amountSuccess = responseJSON.success.length;
        let amountErrors = responseJSON.errors.length;
        if(amountSuccess>0){
            App.addToastMessage("Success",amountSuccess+" "+associationName+" added");
        }
        if(amountErrors>0){
            App.addToastMessage("Error ",amountErrors+" "+associationName+" not added","error");
        }

        this[overlaypanelID].hide();
        this.reloadPage();
    }

    async handleRemoveAssociationsMultiple(overlaypanelID,associationTableName,associationName,associationResources){
        let responseJSON = await ResourceAssociationHelper.handleRequestTypeOnMultiplePluralAssociation(
            this.resource,
            this.state.tableName,
            associationTableName,
            associationName,
            associationResources,
            RequestHelper.REQUEST_TYPE_DELETE
        );

        let amountSuccess = responseJSON.success.length;
        let amountErrors = responseJSON.errors.length;

        if(amountSuccess>0){
            App.addToastMessage("Success",amountSuccess+" "+associationName+" removed");
        }
        if(amountErrors>0){
            App.addToastMessage("Error ",amountErrors+" "+associationName+" not added","error");
        }

        this[overlaypanelID].hide();
        this.reloadPage();
    }

    renderAssociationCardSingle(associationTableName,associationName){
        let resource = this.state.associationResources[associationName];
        let modelscheme = this.state.associationSchemes[associationTableName];
        let amountText = "";

        let isAssociated = !!resource;
        let associatedResources = [];
        if(isAssociated){
            associatedResources = [resource];
        }

        let overlaypanelID = "overlayPanel-"+associationName;
        let overlaypanelIDCreateAndSet = overlaypanelID+"CreateAndSet";
        let overlaypanelIDAddNew = overlaypanelID+"AddNew";
        let overlaypanelIDView = overlaypanelID+"View";

        let addCallbackFunction = this.handleSetAssociationsSingle.bind(this,overlaypanelIDAddNew,associationTableName,associationName);
        let removeCallbackFunction = this.handleRemoveAssociationsSingle.bind(this,associationTableName,associationName);

        return(
            <div className="p-col-12">
                <Card title={associationName}>
                    <OverlayPanel style={{"margin-right":"0.769em"}} showCloseIcon={true} ref={(el) => this[overlaypanelIDCreateAndSet] = el}>
                        <ResourceCreateComponent schemes={this.state.schemes} tableName={associationTableName} onHandleResourceCreated={(resource) => {addCallbackFunction([resource]);}} />
                    </OverlayPanel>
                    <OverlayPanel style={{"margin-right":"0.769em"}} showCloseIcon={true} ref={(el) => this[overlaypanelIDView] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDView+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_View} headerText={"Associated "+associationTableName} tableName={associationTableName} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>
                    <OverlayPanel style={{"margin-right":"0.769em"}} showCloseIcon={true} ref={(el) => this[overlaypanelIDAddNew] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDAddNew+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_SET_SINGLE} callbackFunction={addCallbackFunction} tableName={associationTableName} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>

                    <Button style={{"margin-right":"1em"}} disabled={isAssociated} className="p-button-success" type="button" icon="pi pi-plus" label="Create & Set" onClick={(e) => this[overlaypanelIDCreateAndSet].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={!isAssociated} type="button" icon="pi pi-search" label="View" onClick={(e) => this[overlaypanelIDView].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={isAssociated} className="p-button-success" type="button" icon="pi pi-plus" label="Set" onClick={(e) => this[overlaypanelIDAddNew].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={!isAssociated} className="p-button-danger" type="button" icon="pi pi-minus" label="Remove" onClick={(e) => removeCallbackFunction()} />

                </Card>
            </div>
        )
    }

    async handleSetAssociationsSingle(overlaypanelID,associationTableName,associationName,associationResources){
        let associationModelscheme = this.state.associationSchemes[associationTableName];
        if(!!associationResources && associationResources.length===1){
            let associationResource = associationResources[0];
            let route = RouteHelper.getInstanceRouteForAssociatedResource(this.state.schemes,this.state.scheme,this.state.tableName,this.resource,associationModelscheme,associationTableName,associationName,associationResource);
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,route);
            if(RequestHelper.isSuccess(answer)){
                App.addToastMessage("Success",associationName+" added");
                this[overlaypanelID].hide();
                this.reloadPage();
            }
        } else {
            App.addToastMessage("Error",associationName+" not added","error");
        }
    }

    async handleRemoveAssociationsSingle(associationTableName,associationName){
        let route = RouteHelper.getIndexRouteForAssociation(this.state.schemes,this.state.scheme,this.state.tableName,this.resource,associationName);
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_DELETE,route);

        if(RequestHelper.isSuccess(answer)){
            App.addToastMessage("Success",associationName+" removed");
            this.reloadPage();
        } else {
            App.addToastMessage("Error",associationName+" not removed","error");
        }
    }


    setDialogVisibility(associationTableName,visible){
        let dialogs = this.state.dialogs;
        dialogs[associationTableName] = visible;
        this.setState({dialogs: dialogs});
    }

    openDialogDeleteResource(){
        this.setState({visibleDialogDeleteResource: true});
    }

    async deleteThisResource(){
        let answer = await ResourceInstance.deleteResource(this.resource,this.state.tableName);
        if(RequestHelper.isSuccess(answer)){
            this.props.history.push('/models/'+ this.state.tableName);
        }
    }

    static async deleteResource(resource, tableName){
        console.log("deleteResource");
        console.log(resource);
        console.log(tableName);
        let schemes = await NSFWConnector.getSchemes();
        let modelscheme = await NSFWConnector.getScheme(tableName);
        console.log(modelscheme);
        let route = RouteHelper.getInstanceRouteForResource(schemes,modelscheme,tableName,resource);
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_DELETE,route);
        return answer;
    }


    renderDialogDeleteResource(){
        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" className="p-button-danger p-button-raised" onClick={() => {this.setState({visibleDialogDeleteUser: false}); this.deleteThisResource(); }} />
                <Button label="No" icon="pi pi-times" className="p-button-info p-button-raised" onClick={() => {this.setState({visibleDialogDeleteUser: false}); }} className="p-button-secondary" />
            </div>
        );

        let tableNameSingle = this.state.tableName.slice(0,-1);

        return(
            <Dialog header={"Delete "+tableNameSingle} visible={this.state.visibleDialogDeleteResource} style={{width: '50vw'}} footer={footer} modal={true} onHide={() => this.setState({visibleDialogDeleteResource: false})}>
                <div>Are you sure you want to delete this {tableNameSingle} ? This cannot be undone.</div>
            </Dialog>
        );
    }

    renderDangerZone(){
        let tableNameSingle = this.state.tableName.slice(0,-1);

        return(
            <div className="p-col-12">
                <Card title={"Danger Zone"} >
                    <Button label={"Delete "+tableNameSingle} icon="pi pi-times" className="p-button-danger p-button-raised" onClick={() => this.openDialogDeleteResource()} />
                </Card>
                {this.renderDialogDeleteResource()}
            </div>
        )
    }

    renderHeader(){
        let tableNameSingle = this.state.tableName.slice(0,-1);
        return <HeaderTemplate title={tableNameSingle} subtitle={"All informations"} />
    }

    renderCustomization(){
        return <Customization reloadPage={this.reloadPage.bind(this)} instance={this} parentState={this.state} parentProps={this.props} />;
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }
        if(this.state.isNotFound){
            return <HeaderTemplate title={"404 Error"} subtitle={"The resource you are looking for does not exist :-("} />
        }

        const t = `
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
`;

        return (
            <div>
                <Growl ref={(el) => this.growl = el} />

                {this.renderHeader()}

                <div className="content-section implementation">

                    <div className="p-grid">
                        <div className="p-col-6" >
                            <div className="p-grid">
                                {this.renderDataCard()}
                            </div>
                        </div>
                        <div className="p-col-6" >
                            <div className="p-grid">
                                {this.renderCustomization()}
                                {this.renderAssociationCards()}
                                {this.renderDangerZone()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
