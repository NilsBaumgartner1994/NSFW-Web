import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {Card} from "../../components/card/Card";
import {Button} from "../../components/button/Button";
import {DataTable} from "../../components/datatable/DataTable";
import {Column} from "../../components/column/Column";
import {Examtasks} from "./Examtasks";
import {ExamExportMenu} from "./ExamExportMenu";
import App from "../../App";
import {MyStudipStudentImporter} from "../../customHelper/MyStudipStudentImporter";
import {MyStudipGroupImporter} from "../../customHelper/MyStudipGroupImporter";
import {NumberHelper} from "../../helper/NumberHelper";
import {WindowHelper} from "../../helper/WindowHelper";
import {Taskvariations} from "./Taskvariations";
import {OverviewExamtasksStudents} from "../evaluateExam/OverviewExamtasksStudents";

import {NSFWConnector, APIRequest, RequestHelper, ResourceAssociationHelper, RouteHelper, ResourceHelper} from "nsfw-connector";

export class Exams extends Component {

    static TABLENAME_EXAMTASKS = "Examtasks";
    static TABLENAME_STUDENTS = "Students";
    static TABLENAME_EXAMTASKEVALUATIONS = "Examtaskevaluations";




    constructor(props) {
        super(props);
        this.state =  {
            combinations: []
        }
    }

    componentDidMount() {

    }

    loadConfigs(){

    }

    renderExportTool(){
        let resource = this.props.instance.resource;
        let id = resource.id;
        let route = "/generateExam/"+id;

        return <div className="p-col-12">
            <Card title={"Generate"}>
                <Link to={route}>
                    <Button type="button" icon="pi pi-print" className="p-button-raised" label={"Export Menu"}></Button>
                </Link>
            </Card>
        </div>
    }

    renderExportPDFTool(){
        return <div style={{"margin":"1em"}}><Button disabled={true} label={"ToDo PDF"} /></div>;
    }

    reloadPage(){
        if(!!this.props.reloadPage){
            this.props.reloadPage();
        }
    }

    static async getTaskvariations(examtask){
        let schemes = await NSFWConnector.getSchemes();
        let modelScheme = await NSFWConnector.getScheme(Exams.TABLENAME_EXAMTASKS);
        let instanceRoute = RouteHelper.getInstanceRouteForResource(schemes,modelScheme,Exams.TABLENAME_EXAMTASKS,examtask);
        let taskvariationsRoute = instanceRoute+"/associations/"+Examtasks.TABLENAME_TASKVARIATIONS;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,taskvariationsRoute);
        if(RequestHelper.isSuccess(answer)){
            return answer.data;
        }
        return null;
    }

    async getExamtasksTaskvariationsDict(){
        let examtasksTaskvariations = {};
        let examtasks = this.getExamtasks();
        for(let i=0; i<examtasks.length; i++){
            let examtask = examtasks[i];
            examtasksTaskvariations[examtask.id] = await Exams.getTaskvariations(examtask);
        }
        return examtasksTaskvariations;
    }

    async onRowReorder(event){
        let newOrder = event.value;
        console.log(newOrder);
        let schemes = await NSFWConnector.getSchemes();
        let modelScheme = await NSFWConnector.getScheme(Exams.TABLENAME_EXAMTASKS);
        let position = 1;
        let noErrors = true;
        for(let i=0; i<newOrder.length && noErrors; i++){
            let examTask = newOrder[i];
            let route = RouteHelper.getInstanceRouteForResource(schemes,modelScheme,Exams.TABLENAME_EXAMTASKS,examTask);
            examTask.position = position;
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_PUT,route,examTask);
            if(!RequestHelper.isSuccess(answer)){
                noErrors = false;
                App.addToastMessage("Error","Could not reorder: examTask: "+examTask.id,"error");
            }
            position=position+1;
        }
        if(noErrors){
            App.addToastMessage("Success",null,"success");
        }
        this.reloadPage();
    }

    static orderExamTasks(examtasks){
        examtasks.sort(function(a, b){return a.position-b.position});
        return examtasks;
    }

    getExamtasks(){
        let associationResources = this.getAssociationResources();
        let examtasks = associationResources[Exams.TABLENAME_EXAMTASKS];
        return examtasks;
    }

    getOrderedExamtasks(){
        let examtasks = this.getExamtasks();
        examtasks = Exams.orderExamTasks(examtasks);
        return examtasks;
    }

    getAssociationResources(){
        return this.props.parentState.associationResources;
    }

    getTotalPointsFromExamtasks(examtasks){
        let totalPoints = 0;
        for(let i=0; i<examtasks.length; i++){
            let examtask = examtasks[i];
            let points = examtask.points;
            totalPoints+=points;
        }
        return totalPoints;
    }

    actionViewTemplate(rowData, column) {
        if(!this.props.parentState.scheme){
            return null;
        }
        let schemes = this.props.parentState.schemes;
        let tableName = ExamExportMenu.TABLENAME_EXAMTASKS;
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

    renderExamTaskOrder(){
        if(!!this.getAssociationResources()){
            let examtasks = this.getOrderedExamtasks();
            let totalPoints = this.getTotalPointsFromExamtasks(examtasks);
            let bodyView = this.actionViewTemplate.bind(this);

            return <div className="p-col-12">
                <Card title={"Aufgaben Reihenfolge"} >
                    <div>Zum ändern einfach Zeile ziehen</div>
                    <DataTable value={examtasks} reorderableColumns={true} onRowReorder={this.onRowReorder.bind(this)}>
                        <Column rowReorder={true} style={{width: '3em'}} />
                        <Column key={"actionColumn"} body={bodyView} style={{textAlign:'center', width: '4em'}}/>
                        <Column columnKey="position" field="position" header="Position" style={{width: '5em'}}/>
                        <Column columnKey="name" field="name" header="Name"/>
                        <Column columnKey="points" field="points" header="Punkte" style={{width: '5em'}}/>
                    </DataTable>
                    <div style={{"text-align":"right"}}>Gesamtpunkte: {totalPoints}</div>
                </Card>
            </div>
        }
        return null;
    }

    getAssociatedStudents(){
        let associationResources = this.getAssociationResources();
        let students = associationResources[Exams.TABLENAME_STUDENTS];
        return students;
    }

    static showProgressIfNeeded(index,max,processName, showEveryStep=false){
        let i = index+1;
        if(i%10==0 || showEveryStep){
            App.addToastMessage("Progress "+processName,(i)+"/"+max,"info");
        }
    }

    async onHandleStudentImport(studentsAsList,proceed){
        if(proceed){
            let key = Exams.TABLENAME_STUDENTS;
            let associationName = this.props.parentState.associations[key]["associationName"];
            let associationTableName = this.props.parentState.associations[key]["target"];

            let responseJSON = null;

            let currentStudents = this.getAssociatedStudents();
            await ResourceHelper.handleRequestTypeOnMultipleResources(currentStudents,Exams.TABLENAME_STUDENTS,RequestHelper.REQUEST_TYPE_DELETE,true);

            /**
             * Since we simply delete old students we dont need to unassociate them
            let responseJSON = await ResourceAssociationHelper.handleRequestTypeOnMultiplePluralAssociation(
                this.props.instance.resource,
                this.props.parentState.tableName,
                associationTableName,
                associationName,
                currentStudents,
                RequestHelper.REQUEST_TYPE_DELETE
            );
            let successfullyRemovedOldStudents = responseJSON.success.length===currentStudents.length;
             */



            let studentCreateRoute = await RouteHelper.getIndexRouteForResourceAsync(Exams.TABLENAME_STUDENTS);
            let amountStudents = studentsAsList.length;
            for(let i=0; i<amountStudents; i++){
                let student = studentsAsList[i];
                Exams.showProgressIfNeeded(i,amountStudents, "Student Import");
                let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,studentCreateRoute,student);
                if(!RequestHelper.isSuccess(answer)) {
                    if(!!answer.error && answer.error.error === "SequelizeUniqueConstraintError: Validation error"){
                        //yeah totaly fine, this student already exists
                    } else {
                        console.log(answer);
                    }
                } else {
                    let createdStudent = answer.data;
                    studentsAsList[i] = createdStudent;
                }
            }

            responseJSON = await ResourceAssociationHelper.handleRequestTypeOnMultiplePluralAssociation(
                this.props.instance.resource,
                this.props.parentState.tableName,
                associationTableName,
                associationName,
                studentsAsList,
                RequestHelper.REQUEST_TYPE_POST
            );
            let amountAdded = responseJSON.success.length;
            let amountNotAdded = responseJSON.errors.length;

            if(amountAdded>0){
                App.addToastMessage("Success",amountAdded+" "+Exams.TABLENAME_STUDENTS+" set");
            }
            if(amountNotAdded>0){
                App.addToastMessage("Error ",amountNotAdded+" "+Exams.TABLENAME_STUDENTS+" not added","error");
            }
            this.reloadPage();
        }
    }

    onHandleStudentImportCheck(studentsAsList){
        let currentStudents = this.getAssociatedStudents();
        let header = "OPIuM student import";
        let content = <div>{"Replace current ("+currentStudents.length+") students with new found ("+studentsAsList.length+")  students?"}</div>
        App.dialog.setDialogStateSimple(header,true,this.onHandleStudentImport.bind(this,studentsAsList),content);
    }

    renderStudipStudentImport(){
        return <div className="p-col-12">
            <Card title={"Anmeldungen aus OPIuM importieren"}>
                <div>Importieren der in der Veranstaltung angemeldeten Studierenden</div>
                    <MyStudipStudentImporter onResourceParse={this.onHandleStudentImportCheck.bind(this)} />
            </Card>
        </div>
    }

    getAssociatedExamtaskEvaluations(){
        let associationResources = this.getAssociationResources();
        let examtaskevaluations = associationResources[Exams.TABLENAME_EXAMTASKEVALUATIONS];
        return examtaskevaluations;
    }

    async deleteAllExamtaskevaluations(){
        console.log("deleteAllExamtaskevaluations");
        let tablename = Exams.TABLENAME_EXAMTASKEVALUATIONS;
        let examtaskevaluations = this.getAssociatedExamtaskEvaluations();
        let answer = await ResourceHelper.handleRequestTypeOnMultipleResources(examtaskevaluations,tablename,RequestHelper.REQUEST_TYPE_DELETE,true);
        if(RequestHelper.isSuccess(answer)){
            console.log("Deleted: "+answer.success.length+"/"+examtaskevaluations.length);
            let successfullyRemoved = answer.success.length===examtaskevaluations.length;
            return successfullyRemoved;
        }
        console.log("Delete not successfull");
        console.log(answer);
        return false;
    }


    async getExpectationsForTaskvariation(taskvariation){
        let expectations = await ResourceAssociationHelper.handleGetAssociationsForResource(taskvariation,Examtasks.TABLENAME_TASKVARIATIONS,Taskvariations.TABLENAME_EXPECTATIONS) || [];
        return expectations;
    }

    async genreateEvaluationsForExamtaskevaluation(examtaskevaluation, variationId){
        console.log("genreateEvaluationsForExamtaskevaluation");
        let taskvariation = {id: variationId};
        let expectations = await this.getExpectationsForTaskvariation(taskvariation);
        console.log("Found "+expectations.length+" expectations");

        let errorList = [];
        let successList = [];
        let evaluationIndexRoute = await RouteHelper.getIndexRouteForResourceAsync(OverviewExamtasksStudents.TABLENAME_EVALUATIONS);
        for(let i=0; i<expectations.length;i++){
            let expectation = expectations[i];
            let evaluation = {
                ExamtaskevaluationId: examtaskevaluation.id,
                ExpectationId: expectation.id,
                points: 0,
            };
            let payloadJSON = evaluation;
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,evaluationIndexRoute,payloadJSON);
            console.log(answer);
            let success = RequestHelper.isSuccess(answer);
            if(success){
                let associationResource = answer.data;
                successList.push(associationResource);
            } else {
                errorList.push(answer);
            }
        }
        return {
            success: successList,
            errors: errorList,
        }
    }

    async generateExamtaskevaluationsFromVariationForStudent(variation, student, groupNumber){
        let exam = this.props.instance.resource;
        let examtaskIds = Object.keys(variation);
        let errorsFound = false;
        let amountOfExamtasks = examtaskIds.length;
        for(let i=0; i<amountOfExamtasks; i++){
            let examtaskId = examtaskIds[i];
            let variationId = variation[examtaskId];
            let examtaskevaluation = {
                ExamId: exam.id,
                StudentId: student.id,
                ExamtaskId: examtaskId,
                TaskvariationId: variationId,
                groupNumber: groupNumber,
                progressState: 0,
                points: 0,
            };
            let createRoute = await RouteHelper.getIndexRouteForResourceAsync(Exams.TABLENAME_EXAMTASKEVALUATIONS);
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,createRoute,examtaskevaluation);
            if(!RequestHelper.isSuccess(answer)) {
                errorsFound = true;
                console.log(answer);
            } else {
                examtaskevaluation = answer.data;
                answer = await this.genreateEvaluationsForExamtaskevaluation(examtaskevaluation, variationId);
                if(!RequestHelper.isSuccess(answer)){
                    errorsFound = true;
                    console.log(answer);
                }
            }
        }
        return errorsFound;
    }

    async assignStudentsGroupnumber(students, groupNr){
        console.log("assignStudentsGroupnumber");
        for(let i=0; i<students.length; i++){
            let student = students[i];
            student.groupNr = groupNr;
            students[i] = student;
        }
        console.log(students);
        let answer = await ResourceHelper.handleRequestTypeOnMultipleResources(students,Exams.TABLENAME_STUDENTS,RequestHelper.REQUEST_TYPE_PUT,true,students);
        return answer;
    }

    async onHandleGroupImport(groupsWithStudents,proceed){
        if(proceed){
            console.log("onHandleGroupImport");
            console.log(groupsWithStudents);
            //TODO Check if they all Examtasks possess VariationId

            let exam = this.props.instance.resource;
            let groupnames = Object.keys(groupsWithStudents);
            let errorsFound = false;
            let amountOfGroups = groupnames.length
            for(let i=0; i<amountOfGroups; i++){
                let groupname = groupnames[i];
                let groupNr = NumberHelper.getNumberInString(groupname);
                let studentsInGroup = groupsWithStudents[groupname];
                let answer = await this.assignStudentsGroupnumber(studentsInGroup,groupNr);
                if(!!answer && !!answer.errors && answer.errors.length > 0){
                    errorsFound = true;
                }
            }

            if(!errorsFound){
                App.addToastMessage("Success","onHandleGroupImport");
            } else {
                App.addToastMessage("Warning","Not all generations successed","warning");
            }
            this.reloadPage();
        }
    }

    onHandleGrouplistImportCheck(groupsWithStudents){
        let header = "StudIP Group Import";
        let content = <div>{"Assign Groups to students"}</div>
        App.dialog.setDialogStateSimple(header,true,this.onHandleGroupImport.bind(this,groupsWithStudents),content);
    }

    renderStudipGrouplistImport(){
        return <div className="p-col-12">
            <Card title={"StudIP Gruppen Import"}>
                <div>StudIP Gruppenliste wird benötigt.</div>
                <div>Generiert für alle Studenten eine Klausur die korrigiert werden kann, abhängig von der Gruppenzuordnung.</div>
                <MyStudipGroupImporter associatedStudents={this.getAssociatedStudents()} onResourceParse={this.onHandleGrouplistImportCheck.bind(this)} />
            </Card>
        </div>
    }

    getAmountOfGroups(){
        let currentStudents = this.getAssociatedStudents();
        let groupIdDict = {};
        for(let i=0; i<currentStudents.length; i++){
            let student = currentStudents[i];
            let groupNr = student.groupNr;
            if(!isNaN(groupNr)){
                groupIdDict[groupNr] = true;
            }
        }
        return Object.keys(groupIdDict).length;
    }

    onHandleGrouplistImportCheckEnoughVariations(proceed){
        if(proceed){
            let exam = this.props.instance.resource;
            let examtaskvariations = exam.examtaskvariations || [];
            let amountOfVariations = examtaskvariations.length;
            let amountOfGroups = this.getAmountOfGroups();

            let content = <div>{"Unkown Error"}</div>
            let continueFunction = null;
            if(amountOfGroups===amountOfVariations){
                continueFunction = this.generateExamtaskevaluations.bind(this);
                content =
                    <div>{" "+amountOfGroups+" groups can be matched to "+amountOfVariations+" variations exactly ! :-)"+
                    "Alte Korrekturen werden gelöscht !"}
                    </div>
            }
            if(amountOfGroups<amountOfVariations){
                continueFunction = this.generateExamtaskevaluations.bind(this);
                content = <div>{"There are more variations ("+amountOfVariations+") than found groups ("+amountOfGroups+") ! You can still proceed but some of your variations won't be used"}</div>
            }
            if(amountOfGroups>amountOfVariations){
                continueFunction = WindowHelper.openUrl.bind(this,"/generateExam/"+exam.id);
                content = <div>{"Not enough variations ("+amountOfVariations+") for found groups ("+amountOfGroups+") ! Please add more variations"}</div>
            }

            let header = "Korrekturbögen";
            App.dialog.setDialogStateSimple(header,true,continueFunction,content);
        }
    }

    async generateExamtaskevaluations(procced){
        if(procced){
            let successfullyRemoved = await this.deleteAllExamtaskevaluations();
            let currentStudents = this.getAssociatedStudents();
            let exam = this.props.instance.resource;
            let examtaskvariations = exam.examtaskvariations;

            let amountStudents = currentStudents.length;
            if(!!examtaskvariations){
                for(let i=0; i<amountStudents; i++){
                    App.addToastMessage("Evaluations for Students: ",(i+1)+"/"+amountStudents,"info");
                    let student = currentStudents[i];
                    let groupNr = student.groupNr;
                    console.log(student);
                    if(!isNaN(groupNr)){
                        let variationIndex = groupNr-1;
                        let variation = examtaskvariations[variationIndex];
                        if(!!variation){
                            await this.generateExamtaskevaluationsFromVariationForStudent(variation, student, groupNr);
                        }
                    } else {

                    }
                }
            }
            this.reloadPage();
        }
    }

    renderExamtaskevaluationGeneration(){
        return <div className="p-col-12">
            <Card title={"Digitale Korrekturbögen generieren"}>
                <div>Generiert die digitalen Korrekturbögen anhand der gewählten Variationen und Gruppen.</div>
                <Button type="button" icon="pi pi-print" className="p-button-raised" label={"Generieren"} onClick={this.onHandleGrouplistImportCheckEnoughVariations.bind(this)}></Button>
            </Card>
        </div>
    }


    render() {
        let cardList = [];
        cardList.push(this.renderExportTool());
        cardList.push(this.renderStudipStudentImport());
        cardList.push(this.renderStudipGrouplistImport());
        cardList.push(this.renderExamtaskevaluationGeneration());
        cardList.push(this.renderExamTaskOrder());

        return cardList
    }
}
