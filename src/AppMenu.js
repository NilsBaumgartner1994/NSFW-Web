import React, {Component} from 'react';
import classNames from 'classnames';
import {Link} from 'react-router-dom';
import {CSSTransition} from 'react-transition-group';
import StringHelper from "./helper/StringHelper";

import {NSFWConnector} from "nsfw-connector";
import App from "./App";

export default class AppMenu extends Component {

    static CUSTOM_MENU_CONTENT = {

    }

    static addCustomMenuContent(menuName, icon, index, mapOfNameToRoutes){
        AppMenu.CUSTOM_MENU_CONTENT[index] = {
            menuName: menuName,
            icon: icon,
            mapOfNameToRoutes: mapOfNameToRoutes
        };
    }

    static defaultDivStyle = {"textAlign":"left","wordBreak": "break-word"};

    constructor(props) {
        super(props);
        this.state = {
            activeMenu: undefined,
            loading: true,
            advanced: false,
        };
        this.loadInformations();
    }

    toggleMenu(val) {
        let active = this.state.activeMenu === val;

        this.setState({activeMenu: active ? undefined : val});
    }

    async loadInformations(){
        let schemes = await NSFWConnector.getSchemes();
        this.setState({
            tableNames: this.getTableNamesSingle(schemes),
            associationTables: this.getTableNamesAssociations(schemes),
            loading: false,
        })
    }

    filterAdvancedSchemes(schemes){

        return schemes;
    }

    getTableNamesSingle(schemes){
        let tableNames = [];
        if(schemes){
            let allTableNames = Object.keys(schemes);
            for(let i=0; i<allTableNames.length; i++){
                let tableName = allTableNames[i];
                let getRouteScheme = schemes[tableName]["GET"];
                let amountOfParams = StringHelper.occurrences(getRouteScheme,":");
                if(amountOfParams<=1){
                    tableNames.push(tableName);
                }
            }
        }
        return tableNames;
    }

    getTableNamesAssociations(schemes){
        let singleTableNames = this.getTableNamesSingle(schemes);
        let schemeCopy = JSON.parse(JSON.stringify(schemes));
        for(let i=0; i<singleTableNames.length; i++){
            let tableName = singleTableNames[i];
            delete schemeCopy[tableName];
        }
        let associationTableNames = Object.keys(schemeCopy) || [];
        return associationTableNames;
    }

    renderBulletLink(name,url){
        return(
            <Link style={AppMenu.defaultDivStyle} to={url}>&#9679;&nbsp;{name}</Link>
        )
    }

    renderSchemesSingle(){
        return this.renderSchemes(this.state.tableNames);
    }

    renderSchemesAssociations(){
        return this.renderSchemes(this.state.associationTables);
    }

    renderSchemes(tableNames = []){
        let linkList = [];
        for(let i=0; i<tableNames.length; i++){
            let tableName = tableNames[i];
            linkList.push(this.renderBulletLink(tableName,'/models/'+tableName));
        }

        return <div>{linkList}</div>;
    }

    renderServerFunctions(){
        let linkList = [];
        linkList.push(this.renderBulletLink("Backups",'/server/backups'));
        return <div>{linkList}</div>;
    }

    renderSidebarMenu(index, title, iconName, content){
        return (
                [<button key={"renderSidebarMenu-"+index} id="data_menutitle" onClick={() => this.toggleMenu(index)}
                         className={classNames({'active-menuitem': this.state.activeMenu === index})}>
                    <img alt="data" className="layout-menu-icon-inactive"
                         src={"/showcase/resources/images/mono/"+iconName+".svg"}/>
                    <img alt="data" className="layout-menu-icon-active"
                         src={"/showcase/resources/images/mono/"+iconName+"-active.svg"}/>
                    <span>{title}</span>
                </button>,
                    <CSSTransition classNames="layout-submenu" timeout={{enter: 400, exit: 400}}
                                   in={this.state.activeMenu === index}>
                        <div className="layout-submenu">
                            {content}
                        </div>
                    </CSSTransition>
                ]
        )
    }

    renderSidebarListOfBulletLinks(mapNameURL){
        let links = [];
        let names = Object.keys(mapNameURL);
        for(let i=0; i<names.length; i++){
            let name = names[i];
            let url = mapNameURL[name];
            links.push(this.renderBulletLink(name,url));
        }

        return(
            <div>
                {links}
            </div>
        )
    }

    static ICON_CHARTS = "charts";
    static ICON_COMPONENTS = "components";
    static ICON_DATA = "data";
    static ICON_FILE = "file";
    static ICON_DRAGDROP = "dragrop";
    static ICON_INPUT = "input";
    static ICON_MESSAGE = "message";
    static ICON_MISC = "misc";
    static ICON_MULTIMDEIA = "multimedia";
    static ICON_OVERLAY = "overlay";
    static ICON_PANEL = "panel";

    getSortedCustomMenuKeys(){
        let customMenuContents = AppMenu.CUSTOM_MENU_CONTENT;
        let keys = Object.keys(customMenuContents);
        keys.sort(function(a, b){
            if(isNaN(a)){
                return 1;
            }
            if(isNaN(b)){
                return -1;
            }
            return parseInt(a)-parseInt(b);
        });
        return keys;
    }

    renderCustomMenuContentList(menuContentList, startIndex){
        let index = startIndex;
        let output = [];
        for(let i=0; i<menuContentList.length; i++){
            let menuContent = menuContentList[i];
            let menuName = menuContent.menuName;
            let icon = menuContent.icon;
            let mapOfNameToRoutes = menuContent.mapOfNameToRoutes;
            output.push(this.renderSidebarMenu(index++,menuName,icon,this.renderSidebarListOfBulletLinks(mapOfNameToRoutes)));
        }
        return output;
    }

    render() {
        let topMenuContent = [];
        let bottomMenuContent = [];

        let sortedCustomMenuKeys = this.getSortedCustomMenuKeys();
        for(let i=0; i<sortedCustomMenuKeys.length; i++){
            let menuKey = sortedCustomMenuKeys[i];
            let customMenuObject = AppMenu.CUSTOM_MENU_CONTENT[menuKey];
            if(!isNaN(menuKey) && parseInt(menuKey) < 0){
                topMenuContent.push(customMenuObject);
            } else {
                bottomMenuContent.push(customMenuObject);
            }
        }

        let index = 0;

        return (
            <div className="layout-menu">
                {this.renderCustomMenuContentList(topMenuContent, -topMenuContent.length)}
                {this.renderSidebarMenu(index++,"Tables",AppMenu.ICON_DATA,this.renderSchemesSingle())}
                {this.renderSidebarMenu(index++,"Associations",AppMenu.ICON_DATA,this.renderSchemesAssociations())}
                {this.renderSidebarMenu(index++,"Server",AppMenu.ICON_DATA,this.renderServerFunctions())}
                {this.renderCustomMenuContentList(bottomMenuContent, index)}
            </div>
        );
    }
}
