import React, {Component} from 'react';
import {NSFWConnector, RouteHelper} from "nsfw-connector";
import StringHelper from "../helper/StringHelper";
import { Route, withRouter } from 'react-router-dom';
import ResourceInstance from "../screens/dataview/ResourceInstance";
import ResourceCreate from "../screens/dataview/ResourceCreate";
import ResourceIndex from "../screens/dataview/ResourceIndex";
import AppMenu from "../AppMenu";

export default class NSFWDatabaseMenu extends Component {

    static MENU_ALL = "NSFWDatabaseMenu";

    static renderIndexRoutes(schemes){
        return <Route exact path={"/models/:tableName"} component={withRouter(ResourceIndex.bind(null,schemes))}/>;
    }

    static renderInstanceRoute(path, tableName, schemes){
        return <Route exact path={path} component={withRouter(ResourceInstance.bind(null,schemes,tableName))} />;
    }

    static renderInstanceCreateRoute(path, tableName, schemes){
        return <Route exact path={path} component={withRouter(ResourceCreate.bind(null,schemes,tableName))} />;
    }

    static async renderNSFWDatabaseRoutes(){
        let schemes = await NSFWConnector.getSchemes();
        let tableNames = NSFWDatabaseMenu.getTableNamesSingle(schemes);

        if(!!schemes && !!tableNames){
            let output = [];
            output.push(NSFWDatabaseMenu.renderIndexRoutes(schemes));

            tableNames.forEach(tableName => {
                let getRoute = RouteHelper.getInstanceRoute(schemes, tableName);
                let createRoute = RouteHelper.getCreateRouteForResource(schemes, tableName);

                output.push(NSFWDatabaseMenu.renderInstanceRoute(getRoute,tableName, schemes));
                output.push(NSFWDatabaseMenu.renderInstanceCreateRoute(createRoute,tableName, schemes));
            });

            return output;
        } else {
            return (<div></div>)
        }
    }

    static async getMenu(){
        if(AppMenu.HIDE_MENU_CONTENT[NSFWDatabaseMenu.MENU_ALL]){
            return {};
        }

        let schemes = await NSFWConnector.getSchemes();
        console.log("NSFWDatabaseMenu getMenu");
        console.log(schemes);

        let tableNames = NSFWDatabaseMenu.getTableNamesSingle(schemes);
        let associationTables = NSFWDatabaseMenu.getTableNamesAssociations(schemes);

        let menu = {
            "name": "Datatables",
            "meta": [
                "datatables"
            ],
            "children": [
                NSFWDatabaseMenu.getMenuSingleEntities(tableNames),
                NSFWDatabaseMenu.getMenuAssociations(associationTables)
            ]
        }
        return menu;
    }

    static getTableNamesSingle(schemes){
        let tableNames = [];
        if(schemes){
            let allTableNames = Object.keys(schemes);
            allTableNames.forEach(tableName => {
                let getRouteScheme = schemes[tableName]["GET"];
                let amountOfParams = StringHelper.occurrences(getRouteScheme,":");
                if(amountOfParams<=1){
                    tableNames.push(tableName);
                }
            });
        }
        return tableNames;
    }

    static getTableNamesAssociations(schemes){
        let singleTableNames = NSFWDatabaseMenu.getTableNamesSingle(schemes);
        let schemeCopy = JSON.parse(JSON.stringify(schemes));
        singleTableNames.forEach(tableName => {
            delete schemeCopy[tableName];
        });
        let associationTableNames = Object.keys(schemeCopy) || [];
        return associationTableNames;
    }

    static getRouteToDatatableModel(tableName){
        return '/models/'+tableName;
    }

    static getMetaForDatatableModel(tableName){
        return [
            tableName,
            tableName+"s"
        ];
    }

    static getTableSingleEntity(tableName){
        return {
            "name": tableName,
            "to": NSFWDatabaseMenu.getRouteToDatatableModel(tableName),
            "meta": NSFWDatabaseMenu.getMetaForDatatableModel(tableName)
        };
    }

    static getMenuSingleEntities(tableNames){
        let children = [];

        tableNames.forEach(tableName => {
            children.push(NSFWDatabaseMenu.getTableSingleEntity(tableName));
        });

        return {
            "name": "Entities",
            "meta": [
                "entities"
            ],
            "children": children
        }
    }

    static getMenuAssociations(associationTables){
        let children = [];

        associationTables.forEach(associationTable => {
            children.push(NSFWDatabaseMenu.getTableSingleEntity(associationTable));
        });

        return {
            "name": "Associations",
            "meta": [
                "associations"
            ],
            "children": children
        }
    }

}
