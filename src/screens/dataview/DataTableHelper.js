import React, {Component} from 'react';
import {Column} from 'primereact/column';
import {Link} from 'react-router-dom';

import {Button} from 'primereact/button';

import {APIRequest, RequestHelper, SchemeHelper, NSFWResource} from "nsfw-connector";

export default class DataTableHelper extends Component {

    static searchLoopIcon = "\ud83d\udd0d";
    static defaultDivStyle = {"textAlign":"center","wordBreak": "break-word"};

    static filterUnimportantAttributeKeys(scheme, attributeKeys){
        let unimportantKeys = SchemeHelper.getDefaultUnimportantAttributeKeys();

        for(let i=0; i<attributeKeys.length; i++){
            let field = attributeKeys[i];
            if(!SchemeHelper.isPrimaryKey(scheme, field)){ //dont filter primary keys
                let isUnimportant = false;
                isUnimportant = SchemeHelper.isTypeJSON(scheme,field) ? true : isUnimportant; //JSON Fields are too big to be that important
                isUnimportant = SchemeHelper.isTypeBLOB(scheme,field) ? true : isUnimportant; //BLOB Fields are too big to be that important
                isUnimportant = SchemeHelper.isReferenceField(scheme,field) ? true : isUnimportant; //References which are not primary also not important

                if(isUnimportant){
                    unimportantKeys.push(field);
                }
            }
        }

        let filtered = attributeKeys.filter(function(value, index, arr){
            return !unimportantKeys.includes(value);
        });

        return filtered;
    }

    static getDefaultSelectedColumns(scheme){
        let importantAttributeKeys = DataTableHelper.getAttributeKeysToDisplay(scheme,false);
        let columns = [];
        for(let i=0; i<importantAttributeKeys.length; i++){
            let key = importantAttributeKeys[i];
            columns.push({field: key, header: key});
        }
        return columns;
    }

    static getAllColumns(scheme){
        let allKeys = SchemeHelper.getSortedAttributeKeys(scheme);
        return DataTableHelper.getColumnsFromKeylist(allKeys);
    }

    static getAllColumnsFromListOfJSON(resources){
        let keysAsDict = {};
        for(let i=0; i<resources.length; i++){
            let resource = resources[i];
            let resourceKeys = Object.keys(resource);
            for(let j=0; j<resourceKeys.length; j++){
                let key = resourceKeys[j];
                keysAsDict[key] = true;
            }
        }
        let allKeys = Object.keys(keysAsDict);
        return DataTableHelper.getColumnsFromKeylist(allKeys);
    }

    static getColumnsFromKeylist(allKeys){
        let columns = [];
        for(let i=0; i<allKeys.length; i++){
            let key = allKeys[i];
            columns.push({field: key, header: key});
        }
        return columns;
    }

    static getAttributeKeysToDisplay(scheme,advanced){
        let attributeKeys = SchemeHelper.getSortedAttributeKeys(scheme);
        if(!advanced){
            attributeKeys = DataTableHelper.filterUnimportantAttributeKeys(scheme, attributeKeys);
        }
        return attributeKeys;
    }

    static renderColumn(scheme,field,headerText){
        let customStyles = DataTableHelper.defaultDivStyle;
        let keyIcon = "";

        if(!!scheme && SchemeHelper.isPrimaryKey(scheme, field)){
            keyIcon = (<div style={{"color": "#FBE64A"}}> <i className="pi pi-key"></i></div>);
        }
        let header = (<div style={customStyles}>{headerText}{keyIcon}</div>);

        let body = null;
        if(!!scheme && SchemeHelper.isReferenceField(scheme,field)){
            body = DataTableHelper.getReferenceFieldBody(scheme, field);
        }

        return DataTableHelper.renderDefaultColumn(scheme,field,header,body);
    }

    static defaultBodyTemplate(field, rowData, column){
        return <div style={DataTableHelper.defaultDivStyle}>{rowData[field]+""}</div>;
    }

    static bodyTemplateJSON(field, rowData, column){
        return <div style={DataTableHelper.defaultDivStyle}>{JSON.stringify(rowData[field])}</div>;
    }

    static renderDefaultColumn(scheme,field,header,body){
        if(!body){
            body = DataTableHelper.defaultBodyTemplate.bind(this, field);
        }

        let filterType = "text";

        if(!!scheme){
            if(SchemeHelper.isTypeJSON(scheme,field)){
                body = DataTableHelper.bodyTemplateJSON.bind(this,field);
            }
            if(SchemeHelper.isTypeInteger(scheme, field)){
                filterType = "number";
            }
            //TODO implement Type specific filter
            // https://www.primefaces.org/primereact/showcase/#/datatable/filter
            //const dateFilter = <Calendar value={this.state.selectedDate} onChange={(e) => this.setState({ selectedDate: e.value })} dateFormat="yy-mm-dd" className="p-column-filter" placeholder="Registration Date"/>;

            //TODO implement differend filterMatchMode
            // Add a button to choose the filterMatchMode
            // https://www.primefaces.org/primereact/showcase/#/datatable
        }

        return (<Column key={field} filterType={filterType} field={field} header={header} body={body} sortable filterMatchMode="contains" filter filterPlaceholder={DataTableHelper.searchLoopIcon+" search"}/>);
    }

    static getReferenceFieldBody(scheme, field){
        return DataTableHelper.referenceFieldBodyTemplate.bind(this, scheme, field);
    }

    static referenceFieldBodyTemplate(scheme, field, rowData, column) {
        let referenceId = rowData[field];
        if(!referenceId){
            return (<div></div>);
        }

        let referenceTableName = scheme[field].references.model;
        let route = '/models/'+referenceTableName+"/"+referenceId;

        return <div style={DataTableHelper.defaultDivStyle}>
            <Link to={route}>
                <Button type="button" className="p-button-success" label={""+referenceId} iconPos="right" icon="pi pi-search" style={{"width":"100%"}} ></Button>
            </Link>
        </div>;
    }


    /**
     * Association
     */

    static renderCleanColumns(scheme, selectedAttributeKeyMapList){
        let columns = [];

        let attributeColumns = [];
        for(let i=0; i<selectedAttributeKeyMapList.length; i++){
            let selectedAttributeKeyMap = selectedAttributeKeyMapList[i];
            let field = selectedAttributeKeyMap.field;
            let header = selectedAttributeKeyMap.header;
            attributeColumns.push(DataTableHelper.renderColumn(scheme,field,header));
        }

        columns.push(attributeColumns);
        return columns;
    }

    static getURLFilterParamsAddon(filterParams){
        let filterParam = "&params=";
        if(!!filterParams){
            let customFilterObject =  {};
            let attributeKeys = Object.keys(filterParams);
            for(let i=0; i<attributeKeys.length; i++){
                let attributeKey = attributeKeys[i];
                let content = filterParams[attributeKey];
                let hasValue = content.hasOwnProperty("value");
                if(hasValue){ //is from Datatablefilter Parsed
                    let value = content.value;
                    if(typeof value === "string" || typeof value === "number"){
                        customFilterObject[attributeKey] = {"substring":content.value};
                    } else {
                        customFilterObject[attributeKey] = value;
                    }
                } else { //User defined content
                    customFilterObject[attributeKey] = content;
                }
            }
            filterParam+=JSON.stringify(customFilterObject);
        }
        return filterParam;
    }

    static async loadResourceFromServer(tableName, offset, limit, multiSortMeta,filterParams, selectedColumns){
        let orderParam = "";
        if(!!multiSortMeta && multiSortMeta.length>0){
            orderParam = orderParam+"&order=[";
            for(let i=0; i<multiSortMeta.length; i++){
                if(i>0){
                    orderParam+=",";
                }
                let field = multiSortMeta[i].field;
                let ascending = multiSortMeta[i].order === 1;
                let ASCDESC = ascending ? "ASC" : "DESC";
                orderParam = orderParam+'["'+field+'","'+ASCDESC+'"]';
            }
            orderParam = orderParam+"]";
        }
        let limitParam = "";
        if(!!limit){
            limitParam = "&limit="+limit;
        }
        let attributesParam = "";
        if(!!selectedColumns && selectedColumns.length > 0){
            attributesParam = "&attributes=[";
            for(let i=0; i<selectedColumns.length; i++){
                if(i>0){
                    attributesParam+=",";
                }
                let selectedColumn = selectedColumns[i];
                attributesParam += '"'+selectedColumn.field+'"';
            }
            attributesParam += "]";
        }

        let offsetParam = "";
        if(!!offset){
            offsetParam="&offset="+offset;
        }

        let filterParam = DataTableHelper.getURLFilterParamsAddon(filterParams);

        let url = "models/"+tableName+"?"+limitParam+offsetParam+attributesParam+orderParam+filterParam;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,url);
        if(RequestHelper.isSuccess(answer)){
            let resourceList = answer.data;
            let resourceClassList = [];
            for(let i=0; i<resourceList.length; i++){
                let resource = resourceList[i];
                let resourceClass = new NSFWResource(tableName);
                await resourceClass._setSynchronizedResource(resource);
                resourceClassList.push(resourceClass);
            }

            return resourceClassList;
        } else {
            return []; // gebe leere Liste aus
        }
    }


}
