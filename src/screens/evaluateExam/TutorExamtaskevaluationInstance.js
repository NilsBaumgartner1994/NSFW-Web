import React, {Component} from 'react';
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {DataTableHelper} from "../dataview/DataTableHelper";
import {ProgressSpinner} from "../../components/progressspinner/ProgressSpinner";
import {Card} from "../../components/card/Card";
import {OverviewExams} from "./OverviewExams";
import {Button} from "../../components/button/Button";
import {DefaultResourceDatatable} from "../dataview/DefaultResourceDatatable";
import {InputNumber} from "../../components/inputnumber/InputNumber";
import {InputText} from "../../components/inputtext/InputText";
import App from "../../App";
import {ResourceHelper, MyStorage, RequestHelper, ResourceAssociationHelper} from "nsfw-connector";
import {Fieldset} from "../../components/fieldset/Fieldset";
import {ToggleButton} from "../../components/togglebutton/ToggleButton";
import {OverviewExamtasksStudents} from "./OverviewExamtasksStudents";
import {WindowHelper} from "../../helper/WindowHelper";
import {ExamExportMenu} from "../dataviewCustomization/ExamExportMenu";
import {Editor} from "../../components/editor/Editor";
import ShowMoreText from 'react-show-more-text';
import SmoothCollapse from "react-smooth-collapse";

import AwaitLock from "await-lock";
const lock = new AwaitLock(); //create lock for async functions

export class TutorExamtaskevaluationInstance extends Component {

    constructor(props) {
        super(props);

        this.inputRefs = {};
        this.inputRefFirstField = null;
        this.wasRefFirstFieldFocused = false;
        this.keepUpdating = true;
        this.expectationLocks = {};
        this.state = {
            exam: null,
            specialPoints: null,
            isLoading: true,
            expandedExpectations: {},
            expectationEditorKeys: {},
        }
    }

    static open(examtaskevaluationId){
        WindowHelper.openUrl("/evaluateExamtaskevaluation/"+examtaskevaluationId);
    }

    async componentDidMount() {
        const { match: { params } } = this.props;
        this.params = params;
        await this.loadResources(params);
        this.loopReloadExpectationNotes();
    }

    async componentDidUpdate(){
        if(!this.wasRefFirstFieldFocused){
            this.wasRefFirstFieldFocused = true;
            if(!!this.inputRefFirstField) {
                this.handleSetCursorToInputnumberRef(this.inputRefFirstField);
            }
        }
    }

    async loopReloadExpectationNotes() {
        await this.reloadExpectationNotes();
        if (this.keepUpdating) {
            let instance = this;
            let timeout = 1 * 1000;
            setTimeout(function () {
                instance.loopReloadExpectationNotes();
            }, timeout);
        }
    }

    async reloadExpectationNotes(){
        let expectationIds = Object.keys(this.state.expandedExpectations);
        for(let i=0; i<expectationIds.length; i++){
            let expectationid = expectationIds[i];
            let expectation = this.state.expectationsDict[expectationid];
            if(!!expectation){
                await lock.acquireAsync(); //from now on, the we have sure the latest expectation
                try{
                    //since we now have the lock, we are sure, that the expectation we now get will be our last update
                    expectation = this.state.expectationsDict[expectationid];
                    //so we download from the server the current version
                    let answer = await ResourceHelper.handleRequestTypeOnResource(expectation,OverviewExams.TABLENAME_EXPECTATIONS,RequestHelper.REQUEST_TYPE_GET, expectation);
                    if(RequestHelper.isSuccess(answer)){
                        let loadedResource = answer.data;
                        //and if we dont have the latest version
                        if(expectation.updatedAt !== loadedResource.updatedAt){
                            //we should update ours
                            await this.handleReloadedExpectation(answer);
                            await this.reloadEditorsContent(expectationid)
                        }
                    }
                } finally {
                    lock.release();
                }
            }
        }
    }

    async reloadEditorsContent(key){
        let expectationEditorKeys = this.state.expectationEditorKeys;
        expectationEditorKeys[key] = new Date().toISOString();
        await this.setState({
            expectationEditorKeys: expectationEditorKeys
        });
    }

    componentWillUnmount() {
        this.keepUpdating = false;
    }


    async loadResources(params){
        let examtaskevaluationsId = params.Examtaskevaluations_id;
        let answer = null;
        let examtaskevaluation = null;

        let student = null;
        let exam = null;
        let examtask = null;
        let taskvariation = null;
        let expectations = [];
        let rawExpectations = [];
        let evaluations = [];
        let functions = [];

        let specialPoints = 0;
        let sumPoints = 0;

        answer = await ResourceHelper.handleRequestTypeOnResource({id: examtaskevaluationsId}, OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,RequestHelper.REQUEST_TYPE_GET);
        if(RequestHelper.isSuccess(answer)){
            examtaskevaluation = answer.data;
            sumPoints = examtaskevaluation.points;
            specialPoints = examtaskevaluation.specialPoints;

            await this.uploadProgressState(examtaskevaluation,OverviewExams.PROGRESS_STATE_PROGRESS);
            await this.authorCheck(examtaskevaluation);

            let groupNumber = examtaskevaluation.groupNumber;

            let currentUser = MyStorage.getCurrentUser();
            if(!examtaskevaluation.author && !!currentUser && !!currentUser.username){
                examtaskevaluation.author = currentUser.username;
            }
            functions = await ExamExportMenu.getAllFunctions();

            student = await ResourceAssociationHelper.handleGetAssociationsForResource(examtaskevaluation,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,"Student") || null;
            exam = await ResourceAssociationHelper.handleGetAssociationsForResource(examtaskevaluation,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,"Exam") || null;
            examtask = await ResourceAssociationHelper.handleGetAssociationsForResource(examtaskevaluation,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,"Examtask") || null;
            evaluations = await ResourceAssociationHelper.handleGetAssociationsForResource(examtaskevaluation,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,OverviewExams.TABLENAME_EVALUATIONS) || [];
            taskvariation = await ResourceAssociationHelper.handleGetAssociationsForResource(examtaskevaluation,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,"Taskvariation") || null;
            taskvariation.question = await ExamExportMenu.evalVariable(taskvariation.question, groupNumber, functions);
            taskvariation.solution = await ExamExportMenu.evalVariable(taskvariation.solution, groupNumber, functions);
            rawExpectations = await ExamExportMenu.getExpectationsFromTaskvariation(taskvariation);
            expectations = await ExamExportMenu.getAllEvaledExpectations(taskvariation, groupNumber, functions);
            expectations.sort(function(a, b) {
                return b.points - a.points;
            });
        }

        let rawExpectationsDict = this.parseDefaultResourceAsDict(rawExpectations);
        let expectationsDict = this.parseDefaultResourceAsDict(expectations);
        let evaluationsDict = this.parseDefaultResourceAsDict(evaluations);


        this.setState({
            examtaskevaluation: examtaskevaluation,
            student: student,
            exam: exam,
            examtask: examtask,
            functions: functions,
            taskvariation: taskvariation,
            rawExpectationsDict: rawExpectationsDict,
            expectationsDict: expectationsDict,
            evaluationsDict: evaluationsDict,
            specialPoints: specialPoints,
            sumPoints: sumPoints,
            isLoading: false,
        });
    }

    handleAuthorCheckDialog(yesPressed){
        if(!yesPressed){
            this.goBack();
        }
    }

    async authorCheck(examtaskevaluation){
        let currentUser = MyStorage.getCurrentUser();
        let author = (!!examtaskevaluation && !!examtaskevaluation.author) ? examtaskevaluation.author : "anonym";
        let username = (!!currentUser && !!currentUser.username) ? currentUser.username : "anonym";
        if(author==="anonym"){
            examtaskevaluation.author = username;
            let answer = await this.updateExamtaskevaluationToDatabase(examtaskevaluation);
        } else if(author!==username){
            let header = "New Editor !";
            let content = <div>{"This document was/is edited by "+author+"."}</div>
            App.dialog.setDialogStateSimple(header,true,this.handleAuthorCheckDialog.bind(this),content);
        } else {
            //well same editor
        }
    }

    async uploadProgressState(examtaskevaluation, progressState){
        examtaskevaluation.progressState = progressState;
        let answer = await this.updateExamtaskevaluationToDatabase(examtaskevaluation);
        return answer;
    }

    parseDefaultResourceAsDict(resources){
        let dict = {};
        for(let i=0; i<resources.length; i++){
            let resource = resources[i];
            dict[resource.id] = resource;
        }
        return dict;
    }

    renderHeader(){
        let title = "Aufgaben korrektur nicht gefunden ?";
        let subtitle = "Bitte geb dem Dozenten bescheid";
        let examtaskevaluation = this.state.examtaskevaluation;
        let groupNumber = examtaskevaluation.groupNumber;
        let examtask = this.state.examtask;
        let student = this.state.student;

        if(!!examtaskevaluation){
            title = "Aufgabe "+examtask.position;
            subtitle = "Gruppe "+groupNumber+" - "+student.firstname+" "+student.lastname+" ("+student.matrNr+")";
        }

        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    renderTaskvariation(){
        let taskvariation = this.state.taskvariation;
        const header = (
            <div></div>
        );

        let solutionSet = (!!taskvariation.solution && taskvariation.solution.length > 0);
        let solutionField = null;
        if(solutionSet){
            solutionField = (
                <Fieldset legend={"Lösung"} toggleable={true} collapsed={!this.state.panelSolutionCollapsed} onToggle={(e) => this.setState({panelSolutionCollapsed: !e.value})} >
                    <Editor readOnly={true} headerTemplate={header} type="text" value={taskvariation.solution} />
                </Fieldset>
            );
        }


        return(
            <div className="p-col-12 p-xl-7">
                <Fieldset legend={"Aufgabe"} toggleable={true} collapsed={!this.state.panelTaskCollapsed} onToggle={(e) => this.setState({panelTaskCollapsed: !e.value})} >
                    <Editor readOnly={true} headerTemplate={header} type="text" value={taskvariation.question} />
                </Fieldset>
                {solutionField}
            </div>
        )
    }

    onEvaluationCheatPointsChange(evaluationId, event){
        let ticked = event.value;
        let newCheatPoints = ticked ? 1 : 0;
        this.saveEvaluationChange(evaluationId,"cheatPoints",newCheatPoints);
    }

    onEvaluationCommentChange(evaluationId, event){
        let value = event.htmlValue;
        this.saveEvaluationChange(evaluationId,"note",value);
    }

    async onEvaluationPointChange(evaluationId, maxPoints, event){
        let newPoints = event.value;
        if(!newPoints || newPoints===""){
            newPoints = 0;
        }
        newPoints = Math.abs(newPoints);

        if(maxPoints < 0){
            newPoints = -newPoints;
        }


        await this.saveEvaluationChange(evaluationId,"points",newPoints);
        await this.handleSaveExamtaskevaluationPointSum();
    }

    async updateEvaluationToDatabase(evaluation){
        let answer = await ResourceHelper.handleRequestTypeOnResource(evaluation,OverviewExams.TABLENAME_EVALUATIONS,RequestHelper.REQUEST_TYPE_PUT, evaluation);
        return answer;
    }

    async saveEvaluationChange(evaluationId, attribute, value){
        let evaluationsDict = this.state.evaluationsDict;
        let evaluation = evaluationsDict[evaluationId];
        let currentValue = evaluation[attribute];
        if(currentValue!==value){
            evaluation[attribute] = value;
            let answer = await this.updateEvaluationToDatabase(evaluation);
            if(RequestHelper.isSuccess(answer)){
                let savedResource = answer.data;
                evaluationsDict[evaluationId] = savedResource;
                await this.setState({
                    evaluationsDict: evaluationsDict
                });
                //App.addToastMessage("Success","Saved change","success")
            } else {
                App.addToastMessage("Error","Could not save evaluation","error")
            }
        }
    }

    handleTestChange(e){
        this.setState({value15: e.value});
    }

    handleSetCursorToInputnumberRef(inputnumberRef){
        inputnumberRef.inputEl.focus();
        inputnumberRef.inputEl.select();
    }

    handleKeyPress(evaluationId,event){
        let key = event.key;
        if(key === "Enter" || key === "Tab"){
            event.preventDefault();
            let evaluationsDict = this.state.evaluationsDict;
            let evaluationIds = Object.keys(evaluationsDict);
            let nextEvaluationid = null;
            for(let i=0; i<evaluationIds.length; i++){
                let id = evaluationIds[i];
                if(""+id===""+evaluationId){
                    nextEvaluationid = evaluationIds[i+1];
                }
            }
            if(!!nextEvaluationid){
                let nextRef = this.inputRefs[nextEvaluationid];
                if(!!nextRef){
                    this.handleSetCursorToInputnumberRef(nextRef);
                }
            } else {
                let buttonRef = this.inputRefButtonNext;
                if(!!buttonRef && !!buttonRef.element){
                    buttonRef.element.focus();
                }
                //this.inputRefButtonNext.focus();
            }
        }
    }

    registerInputnumberRef(evaluationId,el){
        this.inputRefs[evaluationId] = el
        if(!this.inputRefFirstField){
            this.inputRefFirstField = el;
        }
    }

    renderExpectationSolution(expectation){
        return(
            <div style={DefaultResourceDatatable.DivStyle_BreakWord} dangerouslySetInnerHTML={{__html: expectation.solution}} />
        )
    }

    async handleBlurExpectionNote(expectation, event){
        if(!!event){
            if(!!event.oldRange && event.range===null){
                //console.log("Clicked outside");
            } else {
                //console.log("Clicked inside");
                let answer = await ResourceHelper.handleRequestTypeOnResource(expectation,OverviewExams.TABLENAME_EXPECTATIONS,RequestHelper.REQUEST_TYPE_GET, expectation);
                await this.handleReloadedExpectation(answer);
            }
        }
    }

    async handleOnChangeExpectationNote(expectation, event){
        //the content will already be visible changed, we now only update it to the server
        let newValue = event.htmlValue;
        let currentValue = expectation.note;
        let rawExpectation = this.state.rawExpectationsDict[expectation.id];
        rawExpectation.note = newValue;
        await lock.acquireAsync(); //we dont want to interfer with the auto sync, so only we want access to the expectation
        try{
            let answer = await ResourceHelper.handleRequestTypeOnResource(rawExpectation,OverviewExams.TABLENAME_EXPECTATIONS,RequestHelper.REQUEST_TYPE_PUT, rawExpectation);
            await this.handleReloadedExpectation(answer);
        } finally {
            lock.release();
        }

    }

    async handleReloadedExpectation(answer){
        if(RequestHelper.isSuccess(answer)){
            let expectationsDict = this.state.expectationsDict;
            let rawExpectationsDict = this.state.rawExpectationsDict;
            let savedResource = answer.data;
            let id = savedResource.id;
            let groupNumber = this.state.examtaskevaluation.groupNumber;
            let functions = this.state.functions;
            let evaledExpectation = await ExamExportMenu.evalExpectation(JSON.parse(JSON.stringify(savedResource)), groupNumber, functions);
            expectationsDict[id] = evaledExpectation;
            rawExpectationsDict[id] = savedResource;
            await this.setState({
                expectationsDict: expectationsDict,
                rawExpectationsDict: rawExpectationsDict,
            });
        }
    }

    getDefaultEditorHeader(){
        const header = (
            <span className="ql-formats">
                <button className="ql-bold" aria-label="Bold"></button>
                <button className="ql-italic" aria-label="Italic"></button>
                <button className="ql-underline" aria-label="Underline"></button>
                <button className="ql-image" aria-label="Image"></button>
                <button className="ql-code-block" aria-label="Code"></button>
            </span>
        );
        return header;
    }

    renderExpectationNote(expectation){
        let expectationsDict = this.state.expectationsDict;
        if(!!expectationsDict){
            let reloadedExpectation = expectationsDict[expectation.id];
            if(!!reloadedExpectation){
                expectation = reloadedExpectation;
            }
        }

        let editorKey = this.state.expectationEditorKeys[expectation.id];

        return(
            <Editor key={editorKey} headerTemplate={this.getDefaultEditorHeader()} onSelectionChange={this.handleBlurExpectionNote.bind(this, expectation)} placeholder={"Geteilte Notizen zur Erwartung"} style={{height:'150px'}} id="float-input" type="text" value={expectation.note} onTextChange={this.handleOnChangeExpectationNote.bind(this,expectation)} />
        )
    }

    renderNoteForSubmission(evaluation){
        let evaluationId = evaluation.id;
        return (
            <Editor headerTemplate={this.getDefaultEditorHeader()} placeholder={"Kommentar zur Abgabe des Studierenden"} style={{height:'150px'}} id="float-input" type="text" value={evaluation.note} onTextChange={this.onEvaluationCommentChange.bind(this,evaluationId)} />
        )
    }

    renderExpectation(expectationId){
        let expectationsDict = this.state.expectationsDict;
        let expectation = expectationsDict[expectationId];

        let expantedStateName = "ShowMoreText-ExpecationId-"+expectationId;
        let isExpanded = this.state[expantedStateName];

        let lines = 2;
        let height = 19*lines; //since ShowMoreText renders longer text over more columns we calculate it outself

        let style = isExpanded ? {} : {height: height};

        let solutionGiven = !!expectation.solution && expectation.solution.length > 0;
        let solutionDiv = !solutionGiven ? null : <div><br></br><div style={DefaultResourceDatatable.DivStyle_BreakWord} dangerouslySetInnerHTML={{__html: expectation.solution}} /></div>

        return(
                <div style={style}>
                    <ShowMoreText
                        /* Default options */
                        lines={lines}
                        more='[ mehr ]'
                        less='[ weniger ]'
                        anchorClass='my-anchor-css-class'
                        onClick={(isExpanded) => {this.setState({[expantedStateName] : isExpanded})}}
                        expanded={isExpanded}
                    >
                        <div style={DefaultResourceDatatable.DivStyle_BreakWord} dangerouslySetInnerHTML={{__html: expectation.description}} />
                        {solutionDiv}
                    </ShowMoreText>
                </div>
        )
    }

    renderEvaluationMoreInformation(show, evaluation, expectation){
        let noteDiv = this.renderExpectationNote(expectation);
        let commentDiv = this.renderNoteForSubmission(evaluation);

        return (
            <SmoothCollapse expanded={show}>
                <div className="p-grid p-col-nogutter">
                    <div className="p-col-6 p-nogutter">
                        {noteDiv}
                    </div>
                    <div className="p-col-6 p-nogutter">
                        {commentDiv}
                    </div>
                </div>
            </SmoothCollapse>
        )
    }

    renderEvaluationPoint(evaluationId, evaluation, expectation){
        let points = evaluation.points;
        let maxPoints = expectation.points;

        let buttonClassName = maxPoints < 0 ? "p-button-danger" : "";

        let constraintMaxPoints = Math.abs(maxPoints);
        points = Math.abs(points);

        let prefix = maxPoints < 0 ? "-" : "";

        return(
            <div className="p-inputgroup">
                <div onKeyDown={this.handleKeyPress.bind(this,evaluationId)}>
                    <InputNumber prefix={prefix} ref={this.registerInputnumberRef.bind(this,evaluationId)} inputStyle={{width: "50px"}} min={0} max={constraintMaxPoints+1} value={points} onChange={this.onEvaluationPointChange.bind(this,evaluationId, maxPoints)} />
                </div>
                <div>
                    <Button className={buttonClassName} tooltip={"Volle Punktzahl geben"} tooltipOptions={{position: "top"}} style={{width: "8em"}} label={"/ "+maxPoints+" Punkte"} onClick={() => this.onEvaluationPointChange(evaluationId, maxPoints,{value: maxPoints})}/>
                </div>
            </div>
        )
    }

    async handleExpandEvaluation(expectation){
        let answer = await ResourceHelper.handleRequestTypeOnResource(expectation,OverviewExams.TABLENAME_EXPECTATIONS,RequestHelper.REQUEST_TYPE_GET, expectation);
        await this.handleReloadedExpectation(answer);

        let expandedExpectations = this.state.expandedExpectations;
        let currentState = !!expandedExpectations[expectation.id];
        expandedExpectations[expectation.id] = !currentState;
        await this.setState({
            expandedExpectations : expandedExpectations
        });
    }

    renderEvaluation(evaluation){
        let evaluationId = evaluation.id;
        let expectationId = evaluation.ExpectationId;

        let expectationsDict = this.state.expectationsDict;
        let expectation = expectationsDict[expectationId];

        let cheatPoints = evaluation.cheatPoints;
        let cheatingSet = cheatPoints >= 1;

        let showComment = !!this.state.expandedExpectations[expectationId];
        let commentButtonOnLabel = <div><i className="pi pi-chevron-up" /></div>;
        let commentButtonOffLabel = <div><i className="pi pi-chevron-down" /></div>;

        let commentSet = (!!evaluation.note && evaluation.note.length > 0) || (!!expectation.note && expectation.note.length > 0);
        let commentButtonClassName = commentSet ? "p-button-success" : "";

        let cheatButtonOnLabel = <div><i className="pi pi-exclamation-triangle pi-spin" /></div>;
        let cheatButtonOffLabel = <div><i className="pi pi-exclamation-triangle" /></div>;
        let cheatButtonClassName = cheatingSet ? "p-button-danger" : "";

        return(
            <div className="p-col p-nogutter">
                <div className="p-grid">
                    <div className="p-col-6 p-nogutter">
                        {this.renderExpectation(expectationId)}
                    </div>
                    <div className="p-col-6 p-nogutter">
                        <div className="p-inputgroup">
                            {this.renderEvaluationPoint(evaluationId, evaluation, expectation)}
                            <div>
                                <ToggleButton className={cheatButtonClassName} tooltip={"Verdacht auf Schummeln ?"} tooltipOptions={{position: "top"}} onLabel={cheatButtonOnLabel} offLabel={cheatButtonOffLabel} checked={cheatingSet} onChange={this.onEvaluationCheatPointsChange.bind(this,evaluationId)} />
                            </div>
                            <div style={{marginLeft: "1em"}}>
                                <ToggleButton className={commentButtonClassName} tooltip={"Notizen zur Erwartung und Kommentare zur Abgabe"} tooltipOptions={{position: "top"}} onLabel={commentButtonOnLabel} offLabel={commentButtonOffLabel} checked={showComment} onChange={this.handleExpandEvaluation.bind(this, expectation)} />
                            </div>
                        </div>
                    </div>
                </div>
                {this.renderEvaluationMoreInformation(showComment, evaluation, expectation)}
                <div className="p-fluid" style={{backgroundColor: "black", height: "3px"}}></div>
            </div>
        )
    }

    renderEvaluations(){
        let content = [];
        let evaluationsDict = this.state.evaluationsDict;
        let evaluationIds = Object.keys(evaluationsDict);
        for(let i=0; i<evaluationIds.length; i++){
            let evaluationId = evaluationIds[i];
            let evaluation = evaluationsDict[evaluationId];
            content.push(this.renderEvaluation(evaluation));
        }
        return(
            <div className="p-col-12 p-xl-7">
                <Card>
                    <div className="p-grid p-dir-col">
                        {content}
                    </div>
                </Card>
            </div>
        )
    }

    handleOnAuthorChange(event){
        let value = event.value;
        let examtaskevaluation = this.state.examtaskevaluation;
        examtaskevaluation.author = value;
        this.setState({
            examtaskevaluation: examtaskevaluation
        });
    }

    getEvaluationPointsSum(){
        let sum = 0;
        let evaluationsDict = this.state.evaluationsDict;
        let evaluationIds = Object.keys(evaluationsDict);
        for(let i=0; i<evaluationIds.length; i++){
            let evaluationId = evaluationIds[i];
            let evaluation = evaluationsDict[evaluationId];
            let points = evaluation.points;
            sum += points;
        }

        let examtaskevaluation = this.state.examtaskevaluation;
        let specialPoints = examtaskevaluation.specialPoints;
        specialPoints = isNaN(specialPoints) ? 0 : parseInt(specialPoints);
        sum += specialPoints;

        sum = sum < 0 ? 0 : sum;

        return sum;
    }

    async handleSaveExamtaskevaluationPointSum(){
        let examtaskevaluation = this.state.examtaskevaluation;
        let sum = this.getEvaluationPointsSum();
        examtaskevaluation.points = sum;
        let answer = await this.updateExamtaskevaluationToDatabase(examtaskevaluation);
        return answer;
    }

    async handleSaveExamtaskevaluationPointSumAndFinish(){
        let examtaskevaluation = this.state.examtaskevaluation;
        examtaskevaluation.progressState = OverviewExams.PROGRESS_STATE_FINISHED;
        let answer = await this.updateExamtaskevaluationToDatabase(examtaskevaluation);
        return answer;
    }

    async getNextOpenExamtaskevaluation(){
        let examtaskevaluation = this.state.examtaskevaluation;
        let examId = examtaskevaluation.ExamId;
        let examtaskId = examtaskevaluation.ExamtaskId;
        let evaluationsOpen = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null,1,null,{ExamId:examId, ExamtaskId: examtaskId,progressState: OverviewExams.PROGRESS_STATE_UNFINISHED});
        if(!!evaluationsOpen && evaluationsOpen.length>0){
            return evaluationsOpen[0];
        } else {
            return null;
        }
    }

    goBack(){
        let examtaskevaluation = this.state.examtaskevaluation;
        let examId = examtaskevaluation.ExamId;
        let examtaskId = examtaskevaluation.ExamtaskId;
        OverviewExamtasksStudents.open(examId,examtaskId);
    }

    static async getNextOpenExamtaskevaluation(examId, examtaskId, TaskvariationId=null, groupNumber=null){
        let filterParams = {
            ExamId:examId,
            ExamtaskId: examtaskId,
            progressState: OverviewExams.PROGRESS_STATE_UNFINISHED
        };
        if(!!groupNumber){
            filterParams.groupNumber = groupNumber;
        }
        if(!!TaskvariationId){
            filterParams.TaskvariationId = TaskvariationId;
        }

        let evaluationsOpen = await DataTableHelper.loadResourceFromServer(OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,null,1,null,filterParams);
        if(!!evaluationsOpen && evaluationsOpen.length>0){
            return evaluationsOpen[0];
        } else {
            return null;
        }
    }

    static async openNextOpenExamtaskevaluation(examId, examtaskId, TaskvariationId=null, groupNumber=null){
        let nextExamtaskevaluation = await TutorExamtaskevaluationInstance.getNextOpenExamtaskevaluation(examId, examtaskId, TaskvariationId, groupNumber);
        if(!!nextExamtaskevaluation){
            TutorExamtaskevaluationInstance.open(nextExamtaskevaluation.id);
            return true;
        } else {
            console.log("Lulz no found")
            OverviewExamtasksStudents.open(examId,examtaskId);
            return false;
        }
    }

    async handleSaveAndNextStudent(){
        let answer = await this.handleSaveExamtaskevaluationPointSumAndFinish();
        if(RequestHelper.isSuccess(answer)){
            let examtaskevaluation = this.state.examtaskevaluation;
            let ExamId = examtaskevaluation.ExamId;
            let ExamtaskId = examtaskevaluation.ExamtaskId;
            let groupNumber = examtaskevaluation.groupNumber;
            let TaskvariationId = examtaskevaluation.TaskvariationId;
            let openedSameGroupAndVariation = await TutorExamtaskevaluationInstance.openNextOpenExamtaskevaluation(ExamId, ExamtaskId, groupNumber, TaskvariationId);
            if(!openedSameGroupAndVariation){
                let openedSameVariation = await TutorExamtaskevaluationInstance.openNextOpenExamtaskevaluation(ExamId, ExamtaskId, TaskvariationId);
                if(!openedSameVariation){
                    let openedSameExamtask = await TutorExamtaskevaluationInstance.openNextOpenExamtaskevaluation(examtaskevaluation.ExamId, examtaskevaluation.ExamtaskId);
                    if(!openedSameExamtask){
                        this.goBack();
                    }
                }
            }

        } else {
            App.addToastMessage("Error","Could not save summary points","error")
        }
    }

    async updateExamtaskevaluationToDatabase(examtaskevaluation){
        let answer = await ResourceHelper.handleRequestTypeOnResource(examtaskevaluation,OverviewExams.TABLENAME_EXAMTASKEVALUATIONS,RequestHelper.REQUEST_TYPE_PUT, examtaskevaluation);
        if(RequestHelper.isSuccess(answer)){
            let savedResource = answer.data;
            this.setState({
                examtaskevaluation: savedResource
            });
            return answer;
            //App.addToastMessage("Success","Saved change","success")
        } else {
            App.addToastMessage("Error","Could not save evaluation","error")
            return null;
        }
    }

    async saveExamtaskevaluationChange(attribute, value){
        let examtaskevaluation = this.state.examtaskevaluation;
        let currentValue = examtaskevaluation[attribute];
        if(currentValue!==value){
            examtaskevaluation[attribute] = value;
            await this.updateExamtaskevaluationToDatabase(examtaskevaluation);
        }
    }

    async onExamtaskevaluationPointChange(event){
        let newPoints = event.value;
        if(!newPoints || newPoints===""){
            newPoints = 0;
        }
        await this.saveExamtaskevaluationChange("points",newPoints);
    }

    async onExamtaskevaluationSpecialPointsChange(event){
        let newPoints = event.target.value
        this.setState({specialPoints: newPoints});
        if(!newPoints || newPoints==="" || isNaN(newPoints)){
            newPoints = 0;
        } else {
            newPoints = parseInt(newPoints);
        }

        await this.saveExamtaskevaluationChange("specialPoints",newPoints);
        await this.handleSaveExamtaskevaluationPointSum();
    }

    onExamtaskevaluationCommentChange(event){
        let value = event.htmlValue;
        this.saveExamtaskevaluationChange("note",value);
    }

    renderAdditionalPoints(){
        let examtaskevaluation = this.state.examtaskevaluation;

        let collapsed = !this.state.panelAdditionalEvaluationCollapsed;
        if(!!examtaskevaluation.note && examtaskevaluation.note.length > 0){
            collapsed = false;
        }
        if(parseInt(examtaskevaluation.specialPoints) !== 0){
            collapsed = false;
        }

        return(
            <div className="p-col-12 p-xl-7">
                <Fieldset legend={"Zusätzliche Bewertung"} toggleable={true} collapsed={collapsed} onToggle={(e) => this.setState({panelAdditionalEvaluationCollapsed: !e.value})} >
                    <div className="p-grid">
                        <div className="p-col-6 p-nogutter">
                            <div className="p-field" style={{marginTop: "1em"}}>
                                <Editor headerTemplate={this.getDefaultEditorHeader()} placeholder={"Kommentar zur Bewertung"} style={{height:'150px'}} id="float-input" type="text" value={examtaskevaluation.note} onTextChange={this.onExamtaskevaluationCommentChange.bind(this)} />
                            </div>
                        </div>
                        <div className="p-col-6 p-nogutter">
                            <div className="p-inputgroup">
                                <InputText inputStyle={{width: "50px"}} value={this.state.specialPoints} onChange={this.onExamtaskevaluationSpecialPointsChange.bind(this)}/>
                            </div>
                        </div>
                    </div>
                </Fieldset>
            </div>
        )
    }

    renderExamtaskevaluation(){
        let examtaskevaluation = this.state.examtaskevaluation;

        let examtask = this.state.examtask;
        let maxPoints = examtask.points;

        /**
         <Button style={{marginTop: "1em"}} className="p-button-warning" label={"TODO: Keine Abgabe, weiter"} />
         <Button style={{marginTop: "1em"}} className="p-button-warning" label={"TODO: Korrektur schließen"} />
         */

        return(
            <div className="p-col-12 p-xl-7">
                <Card title={"Zusammenfassung"}>
                    <div className="p-grid">
                        <div className="p-col-6">
                            <div className="p-fluid">
                                <div className="p-field">
                                    <label htmlFor="firstname1">Korrekteur</label>
                                    <InputText placeholder={"Korrekteur"} value={examtaskevaluation.author} onChange={this.handleOnAuthorChange.bind(this)}/>
                                </div>
                            </div>
                        </div>
                        <div className="p-col-3">
                            <div className="p-fluid">
                                <div className="p-field">
                                    <label htmlFor="firstname1">Summe</label>
                                    <div className="p-inputgroup">
                                        <InputNumber inputStyle={{width: "50px"}} value={examtaskevaluation.points} onChange={this.onExamtaskevaluationPointChange.bind(this)}/>
                                        <div>
                                            <Button label={"/ "+maxPoints+" Punkte"} onClick={() => this.onExamtaskevaluationPointChange({value: maxPoints})}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-field" style={{marginTop: "1em"}}>
                                    <Button ref={(el) => this.inputRefButtonNext = el} icon="pi pi-arrow-right" iconPos="right" className="p-button-success" label={"Abschließen & Nächster Student"} onClick={this.handleSaveAndNextStudent.bind(this)} />
                                </div>
                                <div className="p-field" style={{marginTop: "1em"}}>
                                    <Button icon="pi pi-arrow-left" iconPos="right" className="p-button-warning" label={"Zur Übersicht"} onClick={this.goBack.bind(this)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        return <div>
            {this.renderHeader()}

            <div className="content-section implementation" style={{paddingTop: 0}}>
                <div className="p-grid">
                    {this.renderTaskvariation()}
                    {this.renderEvaluations()}
                    {this.renderAdditionalPoints()}
                    {this.renderExamtaskevaluation()}
                </div>
            </div>
        </div>
    }
}
