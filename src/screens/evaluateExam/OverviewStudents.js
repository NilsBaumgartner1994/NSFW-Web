import React, {Component} from 'react';
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {ProgressSpinner} from "../../components/progressspinner/ProgressSpinner";
import {Card} from "../../components/card/Card";
import {OverviewExamtasksStudents} from "./OverviewExamtasksStudents";
import {OverviewExams} from "./OverviewExams";
import {DozentExamTranscriptOfRecords} from "./DozentExamTranscriptOfRecords";
import {DefaultResourceDatatable} from "../dataview/DefaultResourceDatatable";

import {ResourceAssociationHelper} from "nsfw-connector";

export class OverviewStudents extends Component {

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
        let examToEvalueate = await OverviewExams.getActiveExam();

        let students = [];
        let examsTaskevaluationsAll = [];
        let examtasks = [];

        if(!!examToEvalueate){
            students = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_STUDENTS) || [];
            examsTaskevaluationsAll = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null) || [];
            examtasks = await ResourceAssociationHelper.handleGetAssociationsForResource(examToEvalueate,OverviewExams.TABLENAME_EXAMS,OverviewExams.TABLENAME_EXAMTASKS) || [];
            examtasks = OverviewExams.orderExamtasks(examtasks);
        }

        let studentDictById = OverviewExamtasksStudents.parseDefaultResourceToDict(students);
        let examtasksDictById = OverviewExamtasksStudents.parseDefaultResourceToDict(examtasks);
        let examsTaskevaluationsByStudentId = DozentExamTranscriptOfRecords.parseExamtaskevaluationsToStudentIdDict(examsTaskevaluationsAll);
        console.log("examsTaskevaluationsByStudentId");
        console.log(examsTaskevaluationsByStudentId);

        students = this.removeUnimportantKeysFromStudents(students,examsTaskevaluationsByStudentId,examtasksDictById);
        let sortedStudentsByLastname = OverviewStudents.sortStudentsByLastname(students);

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
            sortedStudentsByLastname: sortedStudentsByLastname,
            dictPointSumsByStudentId: dictPointSumsByStudentId,
            exampointsDict: exampointsDict,
            isLoading: false,
        });
    }

    removeUnimportantKeysFromStudents(students,examsTaskevaluationsByStudentId,examtasksDictById){
        let newStudents = [];
        for(let i=0; i<students.length; i++){
            let student = students[i];
            let studentId = student.id;

            delete student["ExamStudents"];
            delete student["mail"];
            delete student["createdAt"];
            delete student["updatedAt"];

            let studentsExamtaskevaluations = examsTaskevaluationsByStudentId[studentId];
            console.log("studentsExamtaskevaluations");
            console.log(studentsExamtaskevaluations);
            if(!!studentsExamtaskevaluations){
                let examtaskIds = Object.keys(studentsExamtaskevaluations);
                for(let j=0; j<examtaskIds.length; j++){
                    let examtask = examtasksDictById[examtaskIds[j]];
                    student["A"+examtask.position] = examtask.points;
                }
            }
            newStudents.push(student);
        }
        return newStudents;
    }

    static sortStudentsByLastname(students){
        let sortedList = JSON.parse(JSON.stringify(students));
        sortedList.sort(function(a, b) {
            let aLastname = a.lastname;
            let bLastname = b.lastname;
            let aFirstname = a.firstname;
            let bFirstname = b.firstname;
            if(aLastname===bLastname){
                if(aFirstname===bFirstname) return 0;
                return aFirstname > bFirstname ? 1 : -1;
            }
            return aLastname > bLastname ? 1 : -1;
        });
        return sortedList;
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
            title = "Studierenden Übersicht";
            subtitle = exam.name+" "+exam.year;
        }

        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    renderStudent(student){
        let title = student.firstname+" "+student.lastname+" ("+student.matrNr+")";
        return(
            <div className="p-col-12">
                <Card title={title}>
                    <div>HIER AUFGABEN</div>
                </Card>
            </div>
        )
    }

    renderStudents(){
        let content = [];
        let students = this.state.sortedStudentsByLastname;
        for(let i=0; i<students.length; i++){
            let student = students[i];
            content.push(this.renderStudent(student));
        }
        return content;
    }

    onSelectionChange(ownSelectedResources){
        this.setState({
            ownSelectedResources: ownSelectedResources
        })
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        let students = this.state.sortedStudentsByLastname;

        return <div>
            <DefaultResourceDatatable
                onSelectionChange={this.onSelectionChange.bind(this)}
                resources={students}
            />
        </div>
    }
}
