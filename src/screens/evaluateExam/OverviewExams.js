import React, {Component} from 'react';
import {Growl} from "../../components/growl/Growl";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {DataTableHelper} from "../dataview/DataTableHelper";
import {ProgressSpinner} from "../../components/progressspinner/ProgressSpinner";
import {Card} from "../../components/card/Card";
import {Button} from "../../components/button/Button";
import {OverviewExamtasksStudents} from "./OverviewExamtasksStudents";
import {TutorExamtaskevaluationInstance} from "./TutorExamtaskevaluationInstance";
import {ProgressBar} from "../../components/progressbar/ProgressBar";

import {ResourceAssociationHelper} from "nsfw-connector";

export class OverviewExams extends Component {

    static TABLENAME_EXAMS = "Exams";
    static TABLENAME_STUDENTS = "Students";
    static TABLENAME_EXAMTASKS = "Examtasks";
    static TABLENAME_EXAMTASKEVALUATIONS = "Examtaskevaluations";
    static TABLENAME_TASKVARIATIONS = "Taskvariations";
    static TABLENAME_EVALUATIONS = "Evaluations";
    static TABLENAME_EXPECTATIONS = "Expectations";

    static PROGRESS_STATE_FINISHED = 2;
    static PROGRESS_STATE_PROGRESS = 1;
    static PROGRESS_STATE_UNFINISHED = 0;


    constructor(props) {
        super(props);
        this.keepUpdating = true;
        this.state = {
            exam: null,
            isLoading: true,
        }
    }

    componentDidMount() {
        this.updateInformations();
    }

    async updateInformations() {
        console.log("updateInformations");
        await this.loadResources();
        if (this.keepUpdating) {
            let instance = this;
            let timeout = 5 * 1000;
            setTimeout(function () {
                instance.updateInformations();
            }, timeout);
        }
    }

    componentWillUnmount() {
        this.keepUpdating = false;
    }

    static async getActiveExam(){
        let exams = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMS,0,1,{},{evaluationActive:true});
        if(exams.length===1){
            return exams[0];
        } else {
            return null;
        }
    }

    static async getAllFunctions(){
        let exams = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMS,0,1,{},{evaluationActive:true});
        if(exams.length===1){
            return exams[0];
        } else {
            return null;
        }
    }

    async loadResources(){
        let activeExam = await OverviewExams.getActiveExam();
        let students = [];
        let examtasks = [];
        let examsTaskevaluationsFinished = [];
        let examsTaskevaluationsAll = [];

        let examtasksEvaluationsFinishedDict = {};
        let examtasksEvaluationsAllDict = {};


        let examToEvalueate = null;
        if(!!activeExam){
            examToEvalueate = activeExam;
            examsTaskevaluationsFinished = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,{progressState:OverviewExams.PROGRESS_STATE_FINISHED}) || [];
            examsTaskevaluationsAll = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null) || [];
            students = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_STUDENTS) || [];
            examtasks = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKS) || [];
            examtasks = OverviewExams.orderExamtasks(examtasks);
            for(let i=0; i<examtasks.length; i++){
                let examtask = examtasks[i];
                let examtaskId = examtask.id;
                let finished = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,{ExamtaskId: examtaskId,progressState:OverviewExams.PROGRESS_STATE_FINISHED}) || [];
                examtasksEvaluationsFinishedDict[examtaskId] = finished;

                let all = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,{ExamtaskId: examtaskId}) || [];
                examtasksEvaluationsAllDict[examtaskId] = all;
            }
        }

        await this.setState({
            exam: examToEvalueate,
            students: students,
            examtasks: examtasks,
            examsTaskevaluationsFinished: examsTaskevaluationsFinished,
            examsTaskevaluationsAll: examsTaskevaluationsAll,
            examtasksEvaluationsFinishedDict: examtasksEvaluationsFinishedDict,
            examtasksEvaluationsAllDict: examtasksEvaluationsAllDict,
            isLoading: false,
        });
    }

    static orderExamtasks(examtasks){
        let sortedExamtasks = JSON.parse(JSON.stringify(examtasks));
        sortedExamtasks.sort(function(a, b) {
            let aPosition = a.position || 1000
            let bPosition = b.position || 1000;
            return aPosition-bPosition;
        });
        return sortedExamtasks;
    }

    renderHeader(){
        let title = "Keine Klausurkorrektur aktiv";
        let subtitle = "Der Dozent muss diese zunächst freischalten.";
        let exam = this.state.exam;

        if(!!exam){
            let examsTaskevaluationsFinished = this.state.examsTaskevaluationsFinished;
            let examsTaskevaluationsAll = this.state.examsTaskevaluationsAll;

            title = exam.name+" "+exam.year;
            subtitle = <ProgressBar value={examsTaskevaluationsFinished.length} displayValueTemplate={OverviewExamtasksStudents.displayValueTemplate.bind(this,examsTaskevaluationsAll.length)} />;
        }

        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    handleOpenExamtaskevaluationsForExam(examtask){
        let examtaskId = examtask.id;
        let examId = this.state.exam.id;
        OverviewExamtasksStudents.open(examId,examtaskId);
    }

    renderExamtask(examtask, index){
        let number = index+1;
        let examtaskId = examtask.id;
        let examId = this.state.exam.id;
        let amountFinished = this.state.examtasksEvaluationsFinishedDict[examtaskId].length;
        let amountTotal = this.state.examtasksEvaluationsAllDict[examtaskId].length;

        return(
            <div className="p-col">
                <Card title={"Aufgabe "+number} style={{width: '500px'}}>
                    <div>{examtask.name}</div>
                    <ProgressBar value={amountFinished} displayValueTemplate={OverviewExamtasksStudents.displayValueTemplate.bind(this,amountTotal)} />
                    <Button className="p-button-warning" icon="pi pi-folder-open" label={"Übersicht"} onClick={this.handleOpenExamtaskevaluationsForExam.bind(this,examtask)}/>
                    <Button className="p-button-success" icon="pi pi-pencil" label={"Korregieren"} onClick={() => TutorExamtaskevaluationInstance.openNextOpenExamtaskevaluation(examId,examtaskId,examtask)}/>
                </Card>
            </div>
        )
    }

    renderExamtasks(){
        let content = [];
        let examtasks = this.state.examtasks;
        for(let i=0; i<examtasks.length; i++){
            let examtask = examtasks[i];
            content.push(this.renderExamtask(examtask,i));
        }
        return content;
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        return <div>
            <Growl ref={(el) => this.growl = el} />

            {this.renderHeader()}

            <div className="content-section implementation">

                <div className="p-grid">
                    {this.renderExamtasks()}
                </div>
            </div>
        </div>
    }
}
