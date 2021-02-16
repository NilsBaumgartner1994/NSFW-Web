import React, {Component} from 'react';
import DefaultResourceDatatable from "./DefaultResourceDatatable";

export default class AssociationIndexOverlay extends Component {

    static defaultStyle = {"margin-right":"0.769em","margin-top":"0.769em"};

    static TABLETYPE_View = "View";
    static TABLETYPE_ADD_MULTIPLE = "AddMultiple";
    static TABLETYPE_SET_SINGLE = "SetSingle";
    static TABLETYPE_REMOVE_MULTIPLE = "RemoveMultiple";
    static TABLETYPE_DELETE_MULTIPLE = "DeleteMultiple";

    static MENUDATA_FOR_TABLETYPE = {
        [AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE]: {
            label: "Associate",
            icon: "pi pi-plus"
        },
        [AssociationIndexOverlay.TABLETYPE_SET_SINGLE]: {
            label: "Set",
            icon: "pi pi-plus"
        },
        [AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE]: {
            label: "Disassociate",
            icon: "pi pi-minus"
        },
        [AssociationIndexOverlay.TABLETYPE_DELETE_MULTIPLE]: {
            label: "Delete",
            icon: "pi pi-trash"
        },
    }

    constructor(props) {
        super(props);

        this.state = {
            ownSelectedResources: [],
        };
    }

    handleCallback(resources){
        if(this.props.callbackFunction){
            this.props.callbackFunction(resources);
        }
    }

    onSelectionChange(ownSelectedResources){
        this.setState({
            ownSelectedResources: ownSelectedResources
        })
    }

    getActionItem(){
        let ownSelectedResources = this.state.ownSelectedResources;
        let amount = ownSelectedResources.length;
        let disabled = amount <= 0;

        let actionItem = {
            disabled: disabled,
            command: () => {this.handleCallback(ownSelectedResources)}
        }
        actionItem = Object.assign({}, actionItem, AssociationIndexOverlay.MENUDATA_FOR_TABLETYPE[this.props.tableType]);
        actionItem.label = actionItem.label + " ("+amount+")";
        return actionItem;
    }

    getMenuItems(){
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_View){
            return null;
        } else {
            const items=[
                this.getActionItem()
            ];
            return items;
        }
    }

    getImportLabel(){
        let additionLabel = "";
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE){
            additionLabel=" to disassociate"
        }
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE){
            additionLabel=" to associate"
        }
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_SET_SINGLE){
            additionLabel=" to set"
        }
        return "Import "+additionLabel;
    }

    handleImportResource(resources){
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE ||
            this.props.tableType===AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE
        ) {
            this.handleCallback(resources);
        } else {
            if(resources.length > 0)
            this.handleCallback([resources[0]]);
        }
    }

    render() {
        let resources = null;
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE ||
            this.props.tableType===AssociationIndexOverlay.TABLETYPE_View
        ) {
            resources = this.props.associatedResources
        }

        let preSelectedResources = null;
        let amountMaxSelectedResources = null;
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE ||
            this.props.tableType===AssociationIndexOverlay.TABLETYPE_SET_SINGLE ||
            this.props.tableType===AssociationIndexOverlay.TABLETYPE_View){
            preSelectedResources = this.props.associatedResources;
        }
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_SET_SINGLE){
            amountMaxSelectedResources = 1;
        }



        let onHandleImport = null;
        if(this.props.tableType===AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE ||
            this.props.tableType===AssociationIndexOverlay.TABLETYPE_SET_SINGLE ||
            this.props.tableType===AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE)
        {
            onHandleImport = this.handleImportResource.bind(this);
        }

        return <div>
            <DefaultResourceDatatable
                importLabel={this.getImportLabel()}
                onHandleImport={onHandleImport}
                onSelectionChange={this.onSelectionChange.bind(this)}
                tableName={this.props.tableName}
                amountMaxSelectedResources={amountMaxSelectedResources}
                resources={resources}
                preSelectedResources={preSelectedResources}
                menuItems={this.getMenuItems()} />
        </div>
    }
}
