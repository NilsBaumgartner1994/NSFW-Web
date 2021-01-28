import React, {Component} from 'react';
import {Growl} from "../../components/growl/Growl";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {DataTableHelper} from "../dataview/DataTableHelper";
import {ProgressSpinner} from "../../components/progressspinner/ProgressSpinner";
import {Card} from "../../components/card/Card";
import {OverviewExams} from "./OverviewExams";
import {WindowHelper} from "../../helper/WindowHelper";
import {Button} from "../../components/button/Button";
import {TutorExamtaskevaluationInstance} from "./TutorExamtaskevaluationInstance";
import {ProgressBar} from "../../components/progressbar/ProgressBar";

import {RequestHelper, ResourceAssociationHelper, ResourceHelper} from "nsfw-connector";

export class OverviewExamtasksStudents extends Component {

    static TABLENAME_EVALUATIONS = "Evaluations";

    constructor(props) {
        super(props);
        this.state = {
            exam: null,
            isLoading: true
        }
    }

    static open(examId,examtaskId){
        WindowHelper.openUrl("/evaluateExam/"+examId+"/"+examtaskId);
    }

    async componentDidMount() {
        const { match: { params } } = this.props;
        this.params = params;
        console.log(params);
        await this.loadResources(params);
    }

    static parseDefaultResourceToDict(students){
        let dict = {};
        for(let i=0; i<students.length; i++){
            let student = students[i];
            dict[student.id] = student;
        }
        return dict;
    }

    async loadResources(params){
        let examId = params.Exams_id;
        let examtaskId = params.Examtasks_id;

        let exam = null;
        let examtask = null;
        let answer = null;

        answer = await ResourceHelper.handleRequestTypeOnResource({id: examId}, OverviewExams.TABLENAME_EXAMS,RequestHelper.REQUEST_TYPE_GET);
        if(RequestHelper.isSuccess(answer)){
            exam = answer.data;
        }

        answer = await ResourceHelper.handleRequestTypeOnResource({id: examtaskId}, OverviewExams.TABLENAME_EXAMTASKS,RequestHelper.REQUEST_TYPE_GET);
        if(RequestHelper.isSuccess(answer)){
            examtask = answer.data;
        }

        let students = await ResourceAssociationHelper.handleGetAssociationsForResource(exam,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_STUDENTS) || [];
        let studentDictById = OverviewExamtasksStudents.parseDefaultResourceToDict(students);

        let evaluationsFinished = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null,null,null,{ExamId:examId, ExamtaskId: examtaskId,progressState: OverviewExams.PROGRESS_STATE_FINISHED});
        let evaluationsInProgess = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null,null,null,{ExamId:examId, ExamtaskId: examtaskId,progressState: OverviewExams.PROGRESS_STATE_PROGRESS});
        let evaluationsOpen = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null,null,null,{ExamId:examId, ExamtaskId: examtaskId,progressState: OverviewExams.PROGRESS_STATE_UNFINISHED});

        this.setState({
            exam: exam,
            examtask: examtask,
            students: students,
            studentDictById: studentDictById,
            evaluationsFinished: evaluationsFinished,
            evaluationsInProgess: evaluationsInProgess,
            evaluationsOpen: evaluationsOpen,
            isLoading: false,
        });
    }

    static handleOpenExamtaskevaluation(examtaskevaluation){
        TutorExamtaskevaluationInstance.open(examtaskevaluation.id);
    }

    getIconOpenEvaluation(){
        return <i className="pi pi-circle-off" />;
    }

    getIconActiveEvaluation(){
        return <i className="pi pi-circle-on" />;
    }

    getIconFinishedEvaluation(){
        return <i className="pi pi-check-circle" />;
    }

    renderExamtaskevaluation(examtaskevaluation){
        let studentId = examtaskevaluation.StudentId;
        let student = this.state.studentDictById[studentId];
        let examtask = this.state.examtask;
        let title = <div>Offene Aufgabe {this.getIconOpenEvaluation()}</div>;
        if(examtaskevaluation.progressState===OverviewExams.PROGRESS_STATE_PROGRESS){
            title = <div>In Bearbeitung {this.getIconActiveEvaluation()}</div>;
        }
        if(examtaskevaluation.progressState===OverviewExams.PROGRESS_STATE_FINISHED){
            title = <div>Fertig {this.getIconFinishedEvaluation()}</div>;
        }

        let author = examtaskevaluation.author;
        let authorDiv = !!author ? <div>{"Tutor: "+author}</div> : null;

        return(
            <div className="p-col">
                <Card title={title} style={{width: '500px'}}>
                    <div>{student.firstname+" "+student.lastname+" ("+studentId+")"}</div>
                    <div>{examtaskevaluation.points+"/"+examtask.points} Punkte</div>
                    <div>{"Variation "+examtaskevaluation.TaskvariationId}</div>
                    <div>{"Gruppe "+examtaskevaluation.groupNumber}</div>
                    {authorDiv}
                    <Button className="p-button-success" icon="pi pi-pencil" label={"Korregieren"} onClick={OverviewExamtasksStudents.handleOpenExamtaskevaluation.bind(this,examtaskevaluation)} />
                </Card>
            </div>
        )
    }

    static orderListofExamtaskevaluations(listOfExamtaskevaluations){
        listOfExamtaskevaluations.sort(function(a, b){
            let aVariationNumber = a.TaskvariationId;
            let bVariationNumber = b.TaskvariationId;
            let aGroupNumber = a.groupNumber;
            let bGroupNumber = b.groupNumber;
            if(aVariationNumber===bVariationNumber){
                if(aGroupNumber===bGroupNumber){
                    return 0;
                } else {

                    return aGroupNumber-bGroupNumber;
                }
            } else {
                return aVariationNumber-bVariationNumber;
            }
        });
        return listOfExamtaskevaluations;
    }

    renderExamtaskevaluations(listOfExamtaskevaluations){
        listOfExamtaskevaluations = OverviewExamtasksStudents.orderListofExamtaskevaluations(listOfExamtaskevaluations);
        let content = [];
        for(let i=0; i<listOfExamtaskevaluations.length; i++){
            let examtaskevaluation = listOfExamtaskevaluations[i];
            content.push(this.renderExamtaskevaluation(examtaskevaluation))
        }
        return content;
    }

    renderOpenExamtaskevaluations(){
        return this.renderExamtaskevaluations(this.state.evaluationsOpen);
    }

    renderProgressExamtaskevaluations(){
        return this.renderExamtaskevaluations(this.state.evaluationsInProgess);
    }

    renderFinishedExamtaskevaluations(){
        return this.renderExamtaskevaluations(this.state.evaluationsFinished);
    }

    renderHeader(){
        let title = "Aufgabe oder Klausur nicht gefunden ?";
        let subtitle = "Bitte geb dem Dozenten bescheid";
        let examtask = this.state.examtask;

        if(!!examtask){
            title = "Aufgabe "+examtask.position+" - "+examtask.name;
            subtitle = this.renderProgressBar();
        }

        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    static displayValueTemplate(max, value){
        return (
            <div style={{color: "black"}}>{value}/{max} korrigiert</div>
        );
    }

    renderProgressBar(){
        let amountOpen = this.state.evaluationsOpen.length;
        let amountActive = this.state.evaluationsInProgess.length;
        let amountFinished = this.state.evaluationsFinished.length;
        let amountTotal = amountOpen+amountActive+amountFinished;
        return <ProgressBar value={amountFinished} displayValueTemplate={OverviewExamtasksStudents.displayValueTemplate.bind(this,amountTotal)} />
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
                    {this.renderOpenExamtaskevaluations()}
                    <div className="p-col-12" style={{backgroundColor: "grey"}}></div>
                    {this.renderProgressExamtaskevaluations()}
                    <div className="p-col-12" style={{backgroundColor: "grey"}}></div>
                    {this.renderFinishedExamtaskevaluations()}
                </div>
            </div>
        </div>
    }
}
