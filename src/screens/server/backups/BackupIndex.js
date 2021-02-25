import React, {Component} from 'react';
import {APIRequest, RequestHelper} from "nsfw-connector";
import HeaderTemplate from "../../../templates/HeaderTemplate";
import {ProgressSpinner} from "primereact/progressspinner";
import DefaultResourceDatatable from "../../dataview/DefaultResourceDatatable";

export default class BackupIndex extends Component {

    constructor(schemes) {
        super();
        this.state = {
            reloadNumber: 0,
            resources: null,
            isLoading: true
        };
    }

    async componentDidMount() {
        const { match: { params } } = this.props;
        let backups = await this.loadBackups();

        this.setState({
            isLoading: false,
            resources: backups,
        });
    }

    async loadBackups(){
        let url = "server/backups";
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,url);
        if(RequestHelper.isSuccess(answer)) {
            let resourceList = answer.data;
            return resourceList;
        } else {
            return [];
        }
    }

    render() {
        if(this.state.isLoading){
            return  <div><ProgressSpinner/></div>
        }
        return <div>
            <HeaderTemplate title={"Backups"} subtitle={"List of all found backups"} />
            <DefaultResourceDatatable
                key={this.state.reloadNumber}
                resources={this.state.resources}
            />
        </div>
    }
}
