import React, {Component} from 'react';
import {DataTable} from '../../components/datatable/DataTable';
import {Column} from '../../components/column/Column';
import {InputText} from '../../components/inputtext/InputText';
import {ProgressSpinner} from '../../components/progressspinner/ProgressSpinner';
import {Link} from 'react-router-dom';
import {Button} from '../../components/button/Button';
import {InputSwitch} from '../../components/inputswitch/InputSwitch';
import {DefaultResourceService} from "../../module/DefaultResourceService";
import {FileUpload} from "../../components/fileupload/FileUpload";
import {RequestHelper} from "../../sequelizeConnector/RequestHelper";
import {Growl} from "../../components/growl/Growl";

const additionalPath = "functions/";
const resourceName = additionalPath+"backups";
const resourcePathToSingle = additionalPath+"backup";
const resourceNameToUser = "Database Backups";

export class Function_Backups extends Component {

    constructor() {
        super();
        this.state = {
            isLoading: true,
            advanced: false,
        };
    }

    componentDidMount() {
        this.loadResources();
    }

    async loadResources() {
        const resources = await DefaultResourceService.handleIndex(resourceName);

        this.setState({
            isLoading: false,
            resources: resources,
        });
    }

    async createResource(){
        await this.setState({
            isLoading: true,
        });
        const success = await DefaultResourceService.handleGet(resourceName+"create","");
        console.log(success);
        if(success!=false){
            this.props.history.push('/');
            this.props.history.push('/'+resourceName);
        }
    }

    renderHeader() {
        return (
            <div style={{'textAlign': 'left'}}>
                <i className="pi pi-search" style={{margin: '4px 4px 0 0'}}/>
                <InputText type="search" onInput={(e) => this.setState({globalFilter: e.target.value})}
                           placeholder="Global Search" size="50"/>
            </div>
        );
    }

    static tokenTemplate(rowData, column) {
        return (
            <div>
                {Function_Backups.getLinkTo(rowData.id,rowData.id)}
            </div>);
    }

    static getLinkTo(resourceId,displayText){
        return(
            <Link to={{
                pathname: '/'+resourcePathToSingle,
                search: "?id=" + resourceId,
            }}>{displayText}</Link>
        );
    }

    renderDataTable(){
        let emptyMessage = "No records found";
        if (this.state.isLoading) {
            emptyMessage = <ProgressSpinner/>
        }

        const header = this.renderHeader();

        if(this.state.advanced){
            return (
                <DataTable ref={(el) => this.dt = el} value={this.state.resources} paginator={true} rows={10}
                           header={header}
                           globalFilter={this.state.globalFilter} emptyMessage={emptyMessage}>
                    <Column field="id" header="ID" filter={true} body={Function_Backups.tokenTemplate} sortable={true}/>
                    <Column field="backupFilePath" header="FilePath" filter={true} sortable={true}/>
                    <Column field="createdAt" header="Created At" filter={true} sortable={true}/>
                    <Column field="updatedAt" header="Updated At" filter={true} sortable={true}/>
                </DataTable>
            );
        } {
            return (
                <DataTable ref={(el) => this.dt = el} value={this.state.resources} paginator={true} rows={10}
                           header={header}
                           globalFilter={this.state.globalFilter} emptyMessage={emptyMessage}>
                    <Column field="id" header="ID" filter={true} body={Function_Backups.tokenTemplate} sortable={true}/>
                    <Column field="createdAt" header="Created At" filter={true} sortable={true}/>
                    <Column field="updatedAt" header="Updated At" filter={true} sortable={true}/>
                </DataTable>
            );
        }
    }

    onSuccessFileUpload(event) {
        this.growl.show({severity: 'success', summary: 'Erfolg', detail: 'Datei erfolgreich hochgeladen'});
        window.location.reload();
    }

    onErrorFileUpload(event) {
        this.growl.show({severity: 'error', summary: 'Fehler', detail: 'Die Datei konnte nicht hochgeladen werden'});
    }

    render() {
        let dataTable = this.renderDataTable();

        let amountOfResources = "?";
        if(this.state.resources!==undefined){
            amountOfResources = this.state.resources.length;
        }

        let uploadToUrl = RequestHelper.handleGetAPIUrl(resourceName);
        console.log("uploadToUrl: "+uploadToUrl);

        return (
            <div>

                <Growl ref={(el) => this.growl = el} />
                <div className="content-section introduction">
                    <div className="feature-intro">
                        <h1>{resourceNameToUser} ({amountOfResources})</h1>
                        <p></p>
                        <table style={{width: "100%"}}>
                            <tr>
                                <td align={"left"}>
                                    <FileUpload chooseLabel={"Upload Backup"} multiple={false} auto={true} mode="basic" name="backup" url={uploadToUrl} accept=".gz" maxFileSize={50*1024*1024} onError={(event) => this.onErrorFileUpload(event)} onUpload={(event) => this.onSuccessFileUpload(event)} />
                                </td>
                                <td align={"left"}>
                                    <Button label="Create Backup" icon="pi pi-plus" className="p-button-success" onClick={this.createResource.bind(this)} />
                                </td>
                                <td align="right">
                                    <p>Advanced: </p>
                                    <InputSwitch checked={this.state.advanced} onChange={(e) => this.setState({advanced: e.value})} />
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div className="content-section implementation">
                    {dataTable}
                </div>
            </div>
        );

    }
}
