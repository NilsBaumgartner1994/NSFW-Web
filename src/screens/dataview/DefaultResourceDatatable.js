import React, {Component} from 'react';
import {DataTable} from 'primereact/datatable';
import {Paginator} from 'primereact/paginator';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {ProgressSpinner} from 'primereact/progressspinner';
import {MultiSelect} from 'primereact/multiselect';
import {Link} from 'react-router-dom';

import {Button} from 'primereact/button';

import {Checkbox} from "primereact/checkbox";
import DatatableDownloader from "../../helper/DatatableDownloader";
import DataTableHelper from "./DataTableHelper";
import {Menubar} from "primereact/menubar";
import {OverlayPanel} from "primereact/overlaypanel";
import MyDatatableImporter from "../../helper/MyDatatableImporter";

import {NSFWConnector, APIRequest, RequestHelper, SchemeHelper} from "nsfw-connector";

export default class DefaultResourceDatatable extends Component {

    static DEFAULT_ITEMS_PER_PAGE = 10;
    static searchLoopIcon = "\ud83d\udd0d";
    static DivStyle_BreakWord = {"wordBreak": "break-word", "white-space": 'pre-line'};
    static defaultDivStyle = Object.assign({"textAlign":"center"},DefaultResourceDatatable.DivStyle_BreakWord);

    static OVERLAYPANEL_IMPORT_ID = "overlayPanelImportID";

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            limit : DefaultResourceDatatable.DEFAULT_ITEMS_PER_PAGE,
            preSelectedResourceMap: {},
            selectedResourcesMap: {},
            selectedColumns: [],
            attributeKeys: [],
            offset : 0,
            page: 0,
            count: 0,
            multiSortMeta: {},
            importFileExtension: null,
            delimiterCSV: null,
        };
    }

    componentDidMount() {
        this.loadConfigs();
    }

    getPreSelectedResourceMap(preSelectedResources,routes,scheme){
        let preSelectedResourceMap =  {};
        if(!!preSelectedResources && !!routes && !!scheme){
            for(let i=0; i<preSelectedResources.length; i++){
                let resource = preSelectedResources[i];
                let route = this.getInstanceRoute(resource,routes,scheme);
                preSelectedResourceMap[route] = resource;
            }
        }
        return preSelectedResourceMap;
    }

    async loadConfigs() {
        let scheme = await NSFWConnector.getScheme(this.props.tableName);
        let routes = await NSFWConnector.getSchemeRoutes(this.props.tableName);
        let countAnswer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,"models/"+"count/"+this.props.tableName);
        let preSelectedResourceMap = this.getPreSelectedResourceMap(this.props.preSelectedResources,routes,scheme);

        let count = 0;
        if(RequestHelper.isSuccess(countAnswer)){
            count = countAnswer.data.count;
        }

        let attributeKeys = [];
        let selectedColumns = [];

        if(!!scheme) {
            selectedColumns = DataTableHelper.getDefaultSelectedColumns(scheme);
            attributeKeys = DataTableHelper.getAllColumns(scheme);
        } else {
            attributeKeys = DataTableHelper.getAllColumnsFromListOfJSON(this.props.resources);
            selectedColumns = DataTableHelper.getAllColumnsFromListOfJSON(this.props.resources);
        }

        if(!!this.props.selectedColumns){
            selectedColumns = this.props.selectedColumns;
        }

        await this.setState({
            isLoading: false,
            scheme: scheme,
            count: count,
            routes: routes,
            preSelectedResourceMap: preSelectedResourceMap,
            selectedColumns: selectedColumns,
            attributeKeys: attributeKeys,
        });

        await this.loadResourcesFromServer();
    }

    async loadResourcesFromServer(){
        if(this.props.resources){
            await this.setState({
                resources: this.props.resources,
                count: this.props.resources.length
            });
        } else {
            let offset = this.state.offset;
            let limit = this.state.limit;
            let multiSortMeta = this.state.multiSortMeta;
            let filterParams = this.state.filters;
            let resources = await DataTableHelper.loadResourceFromServer(this.props.tableName,offset,limit,multiSortMeta,filterParams);

            await this.setState({
                resources: resources,
            });
        }
    }

    getAmountSelectedResources(){
        let ownSelected = Object.keys(this.state.selectedResourcesMap).length;
        let preSelected = Object.keys(this.state.preSelectedResourceMap).length;
        return ownSelected+preSelected;
    }

    renderHeader() {
        return (
            <div className="p-grid">
                <div style={{textAlign:'left'}}>
                    <MultiSelect value={this.state.selectedColumns} options={this.state.attributeKeys} optionLabel="field" onChange={this.onColumnToggle.bind(this)} style={{width:'250px'}}/>
                </div>
                <div className="p-col" align="center">
                    <i className="pi pi-search" style={{margin: '4px 4px 0 0'}}/>
                    <InputText type="search" onInput={(e) => this.setState({globalFilter: e.target.value})}
                               placeholder="Global Search" size="50"/>
                </div>
            </div>
        );
    }

    renderColumns(){
        let scheme = this.state.scheme;
        let dataFieldColumns = DataTableHelper.renderCleanColumns(scheme,this.state.selectedColumns);

        let frontColumns = [];
        frontColumns.push(this.renderActionSelectColumn());
        if(!!this.state.scheme){
            frontColumns.push(this.renderActionViewColumn());
        }

        let backColumns = [];

        let columns = frontColumns.concat(dataFieldColumns.concat(backColumns));
        return columns;
    }

    renderActionViewColumn(){
        let body = this.actionViewTemplate.bind(this);
        return (<Column key={"actionColumn"} body={body} style={{textAlign:'center', width: '4em'}}/>);
    }

    actionViewTemplate(rowData, column) {
        let route = this.getInstanceRoute(rowData);
        if(!route){
           return (<div></div>);
        }

        return <div>
            <Link to={route}>
            <Button type="button" icon="pi pi-search" className="p-button-success"></Button>
            </Link>
        </div>;
    }

    renderActionSelectColumn(){
        let keyIcon = <div style={{"color": "#FBE64A"}}> <i className="pi pi-shopping-cart"></i></div>;
        let customStyles = DataTableHelper.defaultDivStyle;
        let amountSelected = this.getAmountSelectedResources();
        let header = (<div style={customStyles}>{amountSelected+" Selected"}{keyIcon}</div>);
        let body = this.actionSelectTemplate.bind(this);
        let actionSelectFilter = this.renderSelectAllFilter();
        return (<Column key={"actionSelectColumn"} filter={true} filterElement={actionSelectFilter} header={header} body={body} style={{textAlign:'center', width: '6em'}}/>);
    }

    renderSelectAllFilter(){
        let isSelected = this.areAllRowsSelected();
        let disabled = !this.state.resources;

        if(this.props.amountMaxSelectedResources){
            return <div></div>
        }

        return <div>
            <Checkbox onChange={e => {
                let resourcesOnThisPage = this.state.resources;
                let selectedResourcesMap = this.state.selectedResourcesMap;

                if (!!resourcesOnThisPage) {
                    for (let i = 0; i < resourcesOnThisPage.length; i++) {
                        let resource = resourcesOnThisPage[i];
                        let key = this.getResourceKey(resource);
                        if (e.checked) {
                            if(!this.isSelected(key)){
                                selectedResourcesMap[key] = resource;
                            }
                        } else {
                            delete selectedResourcesMap[key];
                        }
                    }
                }
                this.onSelectionChange(selectedResourcesMap);
                this.setState({selectedResourcesMap: selectedResourcesMap});
            }} checked={isSelected} disabled={disabled}/>
        </div>;
    }

    getOwnSelectedResources(selectedResourcesMap=this.state.selectedResourcesMap){
        let list = [];
        let keys = Object.keys(selectedResourcesMap);
        for(let i=0; i<keys.length; i++){
            list.push(selectedResourcesMap[keys[i]]);
        }
        return list;
    }

    getResourceKey(resource){
        if(!!this.state.scheme){
            return this.getInstanceRoute(resource);
        } else {
            return JSON.stringify(resource);
        }
    }

    areAllRowsSelected(){
        let resourcesOnThisPage = this.state.resources;
        if(!!resourcesOnThisPage){
            let allSelected = true;

            for(let i=0; i<resourcesOnThisPage.length; i++){
                let resource = resourcesOnThisPage[i];
                let key = this.getResourceKey(resource);
                if(!this.isSelected(key)){
                    allSelected = false;
                }
            }
            return allSelected;
        } else {
            return false;
        }
    }

    isSelected(key){
        return !!this.state.selectedResourcesMap[key] || !!this.state.preSelectedResourceMap[key];
    }

    onSelectionChange(selectedResourcesMap){
        if(this.props.onSelectionChange){
            this.props.onSelectionChange(this.getOwnSelectedResources(selectedResourcesMap))
        }
    }

    actionSelectTemplate(rowData, column) {
        let key = this.getResourceKey(rowData);
        let isSelected = this.isSelected(key);
        let isDisabled = !!this.state.preSelectedResourceMap[key];

        if(!isSelected && !!this.props.amountMaxSelectedResources && this.getAmountSelectedResources() >= this.props.amountMaxSelectedResources){
            isDisabled = true;
        }

        return <div>
            <Checkbox disabled={isDisabled} onChange={e => {
                let selectedResourcesMap = this.state.selectedResourcesMap;
                if(e.checked){
                    selectedResourcesMap[key] = rowData;
                } else {
                    delete selectedResourcesMap[key];
                }
                this.onSelectionChange(selectedResourcesMap);
                this.setState({selectedResourcesMap: selectedResourcesMap});
            }} checked={isSelected}></Checkbox>
        </div>;
    }

    onColumnToggle(event) {
        let selectedColumns = event.value;
        let orderedSelectedColumns = this.state.attributeKeys.filter(col => selectedColumns.some(sCol => sCol.field === col.field));
        this.setState({selectedColumns: orderedSelectedColumns});
    }

    getInstanceRoute(rowData, routes=this.state.routes, scheme=this.state.scheme){
        let schemeRouteGET = routes["GET"];
        schemeRouteGET = schemeRouteGET.replace("/api","");

        let primaryAttributeKeys = SchemeHelper.getPrimaryAttributeKeys(scheme);
        for(let i=0;i<primaryAttributeKeys.length; i++){
            let key = primaryAttributeKeys[i];
            let value = rowData[key];
            if(!!value){
                let routeParamKey = ":"+this.props.tableName+"_"+key;
                schemeRouteGET = schemeRouteGET.replace(routeParamKey,value);
            }
        }

        if(schemeRouteGET.includes(":")){ //if there are still unresolved params, we have no complete route
            return undefined;
        }

        let route = schemeRouteGET;
        return route;
    }


    async handleOnSort(event){
        await this.setState({multiSortMeta: event.multiSortMeta});
        await this.loadResourcesFromServer();
    }

    async handleOnFilter(event){
        //TODO implement good filtering on backend
        // https://sequelize.org/master/manual/model-querying-basics.html OPERATORS
        await this.setState({filters: event.filters});
        await this.loadResourcesFromServer();
    }

    renderDataTable(){
        let emptyMessage = "No records found";
        if (this.state.isLoading) {
            emptyMessage = <ProgressSpinner/>
        }

        let columns = this.renderColumns();

        const header = this.renderHeader();

            return (
                <DataTable key={"Datatable:"+this.state.limit+JSON.stringify(this.state.multiSortMeta)}
                    ref={(el) => this.dt = el}
                   filters={this.state.filters}
                   onFilter={(e) => this.handleOnFilter(e)}
                    sortMode="multiple"
                   multiSortMeta={this.state.multiSortMeta} onSort={(e) => this.handleOnSort(e)}
                   responsive={true}

                   paginator={!!this.props.resources} //this paginator is for given resources
                   first={this.state.offset} rows={this.state.limit} totalRecords={this.state.count}
                   rowsPerPageOptions={[DefaultResourceDatatable.DEFAULT_ITEMS_PER_PAGE,25,50]}
                   onPageChange={(e) => this.handlePaginationChanged(e)}

                   value={this.state.resources}
                   rows={this.state.limit}
                   header={header}
                   globalFilter={this.state.globalFilter} emptyMessage={emptyMessage}>
                    {columns}
                </DataTable>
            );
    }

    async handlePaginationChanged(event){
        await this.setState({page: event.page, offset: event.first, limit: event.rows});
        await this.loadResourcesFromServer();
    }

    getSelectedResourcesAsList(){
        let selectedResourcesMap = Object.assign(this.state.selectedResourcesMap, this.state.preSelectedResourceMap);
        let keys = Object.keys(selectedResourcesMap);
        let list = [];
        for(let i=0; i<keys.length; i++){
            list.push(selectedResourcesMap[keys[i]]);
        }
        return list;
    }

    getExportMenu(){
        let amount = this.getAmountSelectedResources();

        return {
           label:'Export ('+amount+")",
           icon:'pi pi-download',
            disabled: amount <= 0,
            items: [
                {
                    label: "JSON",
                    icon: "pi pi-file",
                    command: () => {DatatableDownloader.downloadTableAsJSON(this.getSelectedResourcesAsList(), this.props.tableName)}
                },
                {
                    label: "CSV",
                    icon: "pi pi-file",
                    command: () => {DatatableDownloader.downloadTableAsCSV(this.getSelectedResourcesAsList(), this.props.tableName)}
                },
            ]
        };
    }

    getImportItem(){
        let importLabel = this.props.importLabel || "Import";

        const item=
            {
                label: importLabel,
                icon:'pi pi-upload',
                items: [
                    {
                        label: "JSON",
                        icon: "pi pi-file",
                        command: async() => {
                            await this.setState({
                                importFileExtension: MyDatatableImporter.FILETYPE_JSON
                            });
                            this.openDialogImportResources()
                        }
                    },
                    {
                        label: "CSV",
                        icon: "pi pi-file",
                        items: [
                            {
                                label: "Seperator ,",
                                icon: "pi pi-file",
                                command: async() => {
                                    await this.setState({
                                        delimiterCSV: ",",
                                        importFileExtension: MyDatatableImporter.FILETYPE_JSON
                                    });
                                    this.openDialogImportResources()}
                            },
                            {
                                label: "Seperator ;",
                                icon: "pi pi-file",
                                command: async() => {
                                    await this.setState({
                                        delimiterCSV: ";",
                                        importFileExtension: "csv"
                                    });
                                    this.openDialogImportResources()}
                            },
                        ]
                    }
                ]
            };

        return item;
    }

    openDialogImportResources(){
        this[DefaultResourceDatatable.OVERLAYPANEL_IMPORT_ID].toggle(true);
    }

    renderMenu(){
        let menuItems = [];
        if(!!this.props.menuItems){
            menuItems = menuItems.concat(this.props.menuItems);
        }
        menuItems.push(this.getExportMenu());
        if(!!this.props.onHandleImport){
            menuItems.push(this.getImportItem());
        }
        return <Menubar model={menuItems} />
    }

    render() {
        let dataTable = this.renderDataTable();

        let amountOfResources = "?";
        if(!!this.state.count){
            amountOfResources = this.state.count;
        }

        let paginator = null;
        if(!this.props.resources){ //this paginator is for resources which will be downloaded
            paginator = <Paginator first={this.state.offset} rows={this.state.limit} totalRecords={this.state.count} rowsPerPageOptions={[DefaultResourceDatatable.DEFAULT_ITEMS_PER_PAGE,25,50]} onPageChange={(e) => this.handlePaginationChanged(e)}></Paginator>
        }

        return (
            <div>
                <div className="content-section introduction">
                    <div className="feature-intro">
                        <h1>All {this.props.tableName} ({amountOfResources})</h1>
                        <p></p>
                    </div>
                </div>

                <div className="content-section implementation">
                    {this.renderMenu()}
                </div>

                <div className="content-section implementation">
                    <OverlayPanel style={{"margin-right":"0.769em"}} showCloseIcon={true} ref={(el) => this[DefaultResourceDatatable.OVERLAYPANEL_IMPORT_ID] = el}>
                        <MyDatatableImporter onResourceParse={this.props.onHandleImport} fileExtension={this.state.importFileExtension} delimiter={this.state.delimiterCSV} />
                    </OverlayPanel>
                    {dataTable}
                    {paginator}
                </div>
            </div>
        );
    }
}
