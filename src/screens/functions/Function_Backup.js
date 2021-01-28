import React, {Component} from 'react';
import queryString from 'query-string';
import {ProgressSpinner} from '../../components/progressspinner/ProgressSpinner';
import {Card} from '../../components/card/Card';
import {Button} from '../../components/button/Button';
import {Dialog} from '../../components/dialog/Dialog';
import {Growl} from '../../components/growl/Growl';
import {ProgressBar} from '../../components/progressbar/ProgressBar';

import {DefaultResourceService} from '../../module/DefaultResourceService';
import {RequestHelper} from "../../sequelizeConnector/RequestHelper";

const additionalPath = "functions/";
const resourceName = additionalPath+"backups";
const resourceNameToUser = "Database Backup";

export class Function_Backup extends Component {

    constructor() {
        super();
        this.state = {
            resource: {},
            isLoading: true,
            visibleDialogDeleteResource: false,
            visibleDialogDeleteResourceImage: false,
            changeMade: false,
            requestPending: false,
        };
    }

    componentDidMount() {
        const values = queryString.parse(this.props.location.search);
        const id = values.id;
        this.setState({
            id: id,
        });
        this.loadResourceInformations(id);
    }

    async loadResourceInformations(resourceId) {
        const resource = await DefaultResourceService.handleGet(resourceName,resourceId);
        console.log(resource);

        this.setState({
            isLoading: false,
            resource: resource,
        });
    }

    renderDialogRestoreResource(){
        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" className="p-button-danger p-button-raised" onClick={() => {this.setState({visibleDialogDeleteResource: false}); this.restoreResource(); }} />
                <Button label="No" icon="pi pi-times" className="p-button-info p-button-raised" onClick={() => {this.setState({visibleDialogDeleteResource: false}); }} className="p-button-secondary" />
            </div>
        );

        return(
            <Dialog header="Löschen" visible={this.state.visibleDialogRestoerResource} style={{width: '50vw'}} footer={footer} modal={true} onHide={() => this.setState({visibleDialogRestoerResource: false})}>
                Möchtest du wirklich wirklich {resourceNameToUser} ({this.state.resource.id} - {this.state.resource.name}) laden? Dieser Vorgang kann nicht rückgängig gemacht werden. Mach bitte vorher ein {resourceNameToUser} !
            </Dialog>
        );
    }


    downloadResource() {
        let fileName = this.state.resource.id;
        let link = document.createElement("a");
        link.href = RequestHelper.handleGetAPIUrl(resourceName+"/"+this.state.resource.id+"/download");
        link.setAttribute("download", fileName);
        link.click();
    }

    renderDownloadButton() {
        return (
            <Button
                className="p-button-raised"
                label={"Download "+resourceNameToUser}
                icon="pi pi-download"
                iconPos="right"
                onClick={this.downloadResource.bind(this)}
            />
        );
    }

    async openDialogRestoreResource(){
        this.setState({visibleDialogRestoerResource: true});
    }

    async restoreResource(){
        let resource = this.state.resource;
        let success = await DefaultResourceService.handleGet(resourceName,resource.id+"/restore");
        if(success!=false){
            this.props.history.push('/'+resourceName);
        }
    }

    renderDialogDeleteResource(){
        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" className="p-button-danger p-button-raised" onClick={() => {this.setState({visibleDialogDeleteResource: false}); this.deleteResource(); }} />
                <Button label="No" icon="pi pi-times" className="p-button-info p-button-raised" onClick={() => {this.setState({visibleDialogDeleteResource: false}); }} className="p-button-secondary" />
            </div>
        );

        return(
            <Dialog header="Löschen" visible={this.state.visibleDialogDeleteResource} style={{width: '50vw'}} footer={footer} modal={true} onHide={() => this.setState({visibleDialogDeleteResource: false})}>
                Möchtest du wirklich wirklich {resourceNameToUser} ({this.state.resource.id} - {this.state.resource.name}) löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.
            </Dialog>
        );
    }

    async openDialogDeleteResource(){
        this.setState({visibleDialogDeleteResource: true});
    }

    async deleteResource(){
        let resource = this.state.resource;
        let success = await DefaultResourceService.handleDelete(resourceName,resource.id);
        if(success!=false){
            this.props.history.push('/'+resourceName);
        }
    }

    renderRequestPendingBar(){
        if(this.state.requestPending){
            return(<ProgressBar mode="indeterminate" style={{height: '6px'}}></ProgressBar>);
        }
        return (null);
    }


    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        if(this.state.resource===undefined){
            return(
                <div>Ein Fehler ist aufgetreten ...</div>
            );
        }

        let informationTitle = this.state.resource.id || "Kein Name";

        return (

            <div>
                {this.renderDialogRestoreResource()}
                {this.renderDialogDeleteResource()}

                <Growl ref={(el) => this.growl = el} />

                <div className="content-section introduction">
                    <div className="feature-intro">
                        <h1>{resourceNameToUser} - {informationTitle}</h1>
                        <p>Hier werden alle Informationen des {resourceNameToUser} angezeigt</p>

                    </div>
                </div>

                <div className="content-section implementation">

                    <div className="p-grid">
                        <div className="p-col">
                            <Card title={informationTitle} style={{width: '500px'}}>

                                <table style={{border:0}}>
                                    <tbody>
                                    <tr>
                                        <th>ID</th>
                                        <td>{this.state.resource.id}</td>
                                    </tr>
                                    <tr>
                                        <th>backupFilePath</th>
                                        <td>{this.state.resource.backupFilePath}</td>
                                    </tr>
                                    <tr>
                                        <th>Created At</th>
                                        <td>{this.state.resource.createdAt}</td>
                                    </tr>
                                    <tr>
                                        <th>Updated At</th>
                                        <td>{this.state.resource.updatedAt}</td>
                                    </tr>
                                    </tbody>
                                </table>
                                <br></br>
                                {this.renderRequestPendingBar()}
                            </Card>
                        </div>

                        <div className="p-col">
                            <Card title="File" style={{width: '500px'}}>
                                {this.renderDownloadButton()}
                            </Card>
                        </div>

                        <div className="p-col">
                            <Card title="Danger Zone" style={{width: '500px'}}>
                                <Button label={"Restore "+resourceNameToUser} icon="pi pi-replay" className="p-button-danger p-button-raised" onClick={() => this.openDialogRestoreResource()} />
                                <br></br>
                                <br></br>
                                <Button label={"Delete "+resourceNameToUser} icon="pi pi-times" className="p-button-danger p-button-raised" onClick={() => this.openDialogDeleteResource()} />
                                <br></br>
                                <br></br>
                            </Card>
                        </div>

                    </div>
                    <br/><br/>
                </div>
            </div>
        );
    }
}
