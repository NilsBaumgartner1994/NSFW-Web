import React, {Component} from 'react';
import {Growl} from "../../components/growl/Growl";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {ProgressSpinner} from "../../components/progressspinner/ProgressSpinner";
import {OverviewExamtasksStudents} from "./OverviewExamtasksStudents";
import {OverviewExams} from "./OverviewExams";
import {MyChartHelper} from "../../helper/MyChartHelper";

import {ResourceAssociationHelper} from "nsfw-connector";

export class DozentExamTranscriptOfRecords extends Component {

    constructor(props) {
        super(props);
        this.state = {
            exam: null,
            isLoading: true
        }
    }

    componentDidMount() {
        this.loadResources();
    }

    async loadResources(){
        console.log("loadResources")
        let examToEvalueate = await OverviewExams.getActiveExam();
        console.log("examToEvalueate");
        console.log(examToEvalueate)

        let students = [];
        let examsTaskevaluationsAll = [];
        let examtasks = [];

        if(!!examToEvalueate){
            students = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_STUDENTS) || [];
            examsTaskevaluationsAll = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null) || [];
            examtasks = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKS) || [];
        }

        let studentDictById = OverviewExamtasksStudents.parseDefaultResourceToDict(students);
        let examsTaskevaluationsByStudentId = DozentExamTranscriptOfRecords.parseExamtaskevaluationsToStudentIdDict(examsTaskevaluationsAll);
        let dictPointSumsByStudentId = DozentExamTranscriptOfRecords.parseStudentsExamtaskevaluationToExamPointsDict(examsTaskevaluationsByStudentId);
        let exampointsDict = DozentExamTranscriptOfRecords.getAmountPointDistribution(dictPointSumsByStudentId);

        let maxPoints = DozentExamTranscriptOfRecords.getMaxPointsPossible(examtasks);

        this.setState({
            exam: examToEvalueate,
            students: students,
            examtasks: examtasks,
            maxPoints: maxPoints,
            studentDictById: studentDictById,
            examsTaskevaluationsByStudentId: examsTaskevaluationsByStudentId,
            dictPointSumsByStudentId: dictPointSumsByStudentId,
            exampointsDict: exampointsDict,
            isLoading: false,
        });
    }

    static getMaxPointsPossible(examtasks){
        let maxPoints = 0;
        for(let i=0; i<examtasks.length; i++){
            let examtask = examtasks[i];
            maxPoints += examtask.points;
        }
        return maxPoints;
    }

    static parseExamtaskevaluationsToStudentIdDict(examsTaskevaluationsAll){
        let examsTaskevaluationsByStudentId = {};
        for(let i=0; i<examsTaskevaluationsAll.length; i++){
            let examsTaskevaluation = examsTaskevaluationsAll[i];
            let studentId = examsTaskevaluation.StudentId;
            let examtaskId = examsTaskevaluation.ExamtaskId;
            let studentsExamtaskevaluations = examsTaskevaluationsByStudentId[studentId] || {};
            studentsExamtaskevaluations[examtaskId] = examsTaskevaluation;
            examsTaskevaluationsByStudentId[studentId] = studentsExamtaskevaluations;
        }
        return examsTaskevaluationsByStudentId;
    }

    static parseStudentsExamtaskevaluationToExamPointsDict(examsTaskevaluationsByStudentId){
        let dictPointSumsByStudentId = {};
        let studentIds = Object.keys(examsTaskevaluationsByStudentId);
        for(let i=0; i<studentIds.length; i++){
            let studentId = studentIds[i];
            let dictOfExamtaskevaluations = examsTaskevaluationsByStudentId[studentId];
            let sum = 0;
            let examtaskIds = Object.keys(dictOfExamtaskevaluations);
            for(let j=0; j<examtaskIds.length; j++){
                let examtaskId = examtaskIds[j];
                let examtaskevaluation = dictOfExamtaskevaluations[examtaskId];
                let points = examtaskevaluation.points;
                sum += points;
            }
            dictPointSumsByStudentId[studentId] = sum;
        }
        return dictPointSumsByStudentId;
    }

    static getAmountPointDistribution(dictPointSumsByStudentId){
        let exampointsDict = {};
        let studentIds = Object.keys(dictPointSumsByStudentId);
        for(let i=0; i<studentIds.length; i++) {
            let studentId = studentIds[i];
            let sum = dictPointSumsByStudentId[studentId];
            let listOfStudentsForPoints = exampointsDict[sum] || [];
            listOfStudentsForPoints.push(studentId);
            exampointsDict[sum] = listOfStudentsForPoints;
        }
        return exampointsDict;
    }

    renderHeader(){
        let title = "Keine Klausurkorrektur aktiv";
        let subtitle = "Der Dozent muss diese zunächst freischalten.";
        let exam = this.state.exam;

        if(!!exam){
            title = "Notenspiegel";
            subtitle = exam.title+" "+exam.year;
        }

        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    functionCountAmountStudentsForExampointsDict(listOfStudents){
        return listOfStudents.length;
    }

    coloringFunctionForPointDistributions(lowestValue,highestValue,value,i,maxLimit){

    }

    renderChart(){
        let counted = MyChartHelper.getCountedJSONObject(
            this.state.exampointsDict,
            this.functionCountAmountStudentsForExampointsDict.bind(this)
        );

        let data = MyChartHelper.getDatasetForCountedData(
            counted,
            null,
            null,
            true,
            MyChartHelper.coloringModeFirstIsBetter,
            null,
            MyChartHelper.sortingModeHigherIndexFirst,
        );

        return MyChartHelper.renderChartDataCard(
            this,
            data,
            "bar",
            "Erreichte Punkte",
            "Anzahl Studierender",
            null,
            "Verteilung der erreichten Punkte",
            null,
            null,
            null,
        );
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
                    {this.renderChart()}
                </div>
            </div>
        </div>
    }
}
