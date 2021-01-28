import React, {Component} from 'react';
import {Card} from "../../components/card/Card";
import {Button} from "../../components/button/Button";
import {DataTable} from "../../components/datatable/DataTable";
import {Column} from "../../components/column/Column";
import {Link} from "react-router-dom";
import {Taskvariations} from './Taskvariations';
import {NumberHelper} from "../../helper/NumberHelper";
import {ExamExportMenu} from "./ExamExportMenu";

import {NSFWConnector, APIRequest, RequestHelper, RouteHelper} from "nsfw-connector";

export class Examtasks extends Component {

    static TABLENAME_TASKVARIATIONS = "Taskvariations";

    constructor(props) {
        super(props);
        this.state = {
            taskvariationsExpectations : {}}

    }

    async componentDidMount() {
        await this.loadExpectationsOfTaskvariations();
    }

    loadConfigs(){

    }

    async loadExpectationsOfTaskvariations(){
        let associationResources = this.props.parentState.associationResources;
        let taskvariations = associationResources[Examtasks.TABLENAME_TASKVARIATIONS];
        let schemes = await NSFWConnector.getSchemes();
        let modelScheme = await NSFWConnector.getScheme(Examtasks.TABLENAME_TASKVARIATIONS);
        let taskvariationsExpectations = {};

        for(let i=0; i<taskvariations.length; i++){
            let taskvariation = taskvariations[i];
            let instanceRoute = RouteHelper.getInstanceRouteForResource(schemes,modelScheme,Examtasks.TABLENAME_TASKVARIATIONS,taskvariation);
            let expectationsRoute = instanceRoute+"/associations/"+Taskvariations.TABLENAME_EXPECTATIONS;
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,expectationsRoute);
            if(RequestHelper.isSuccess(answer)){
                taskvariationsExpectations[taskvariation.id] = answer.data;
            }

        }
        this.setState({
            taskvariationsExpectations: taskvariationsExpectations
        });
    }

    pointTemplate(rowData, column){
        let id = rowData.id;
        let expectations = this.state.taskvariationsExpectations[id];
        let points = 0;
        if(!!expectations){
            for(let i=0; i<expectations.length; i++){
                let expectation = expectations[i];
                let expectationPoints = expectation.points;
                if(expectationPoints > 0){
                    points += expectationPoints;
                }
            }
            if(points===this.props.instance.resource.points){
                return <div>Punkte passend ({points})</div>
            } else if(points>this.props.instance.resource.points){
                return <div style={{"color":"red"}}>Gibt zu viele Punkte ({points})</div>
            } else if(points<this.props.instance.resource.points){
                return <div style={{"color":"red"}}>Gibt zu wenig Punkte ({points})</div>
            }
        }
        return null;
    }

    actionViewTemplate(rowData, column) {
        if(!this.props.parentState.scheme){
            return null;
        }
        let schemes = this.props.parentState.schemes;
        let tableName = Examtasks.TABLENAME_TASKVARIATIONS;
        let scheme = this.props.parentState.associationSchemes[tableName];

        let route = "/"+RouteHelper.getInstanceRouteForResource(schemes,scheme, tableName, rowData);
        if(!route){
            return (<div></div>);
        }

        return <div>
            <Link to={route}>
                <Button type="button" icon="pi pi-search" className="p-button-success"></Button>
            </Link>
        </div>;
    }

    variationViewTemplate(examtaskTaskvariations, rowData, column){
        let examtaskTaskvariationId = rowData.id;
        let index = ExamExportMenu.getIndexOfExamtaskvariation(examtaskTaskvariationId, examtaskTaskvariations);
        let label = NumberHelper.numToSSColumn(index+1);
        return <Button disabled={true} label={label} />
    }

    questionViewTemplate(rowData, column){
        let question = rowData.question;
        let trimmed = question.substring(0, 120)+"...";
        return <div>{trimmed}</div>
    }

    renderTaskvariationsPoints(){
        let associationResources = this.props.parentState.associationResources;
        if(!!associationResources){
            let taskvariations = associationResources[Examtasks.TABLENAME_TASKVARIATIONS];
            let bodyView = this.actionViewTemplate.bind(this);
            let variationLabelView = this.variationViewTemplate.bind(this,taskvariations);
            let questionViewTemplate = this.questionViewTemplate.bind(this);

            return <div className="p-col-12">
                <Card title={Examtasks.TABLENAME_TASKVARIATIONS+" Übersicht"}>
                    <DataTable value={taskvariations} reorderableColumns={true}>
                        <Column key={"actionColumn"} body={bodyView} style={{textAlign:'center', width: '4em'}}/>
                        <Column key={"variationLabelColumn"} header="Variation" body={variationLabelView} style={{textAlign:'center', width: '6em'}}/>
                        <Column field="id" header="Punkte" body={this.pointTemplate.bind(this)} style={{textAlign:'center', width: '12em'}} />
                        <Column key={"questionViewTemplate"} header="Frage" body={questionViewTemplate} />
                    </DataTable>
                </Card>
            </div>
        }
        return null;
    }

    render() {
        let parentState = this.props.parentState;
        let parentProps = this.props.parentProps;

        let tableName = parentState.tableName;

        let cardList = [];

        cardList.push(this.renderTaskvariationsPoints());

        return cardList
    }
}
