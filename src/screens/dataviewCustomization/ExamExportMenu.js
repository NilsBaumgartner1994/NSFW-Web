import React, {Component} from 'react';
import {Growl} from "../../components/growl/Growl";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {Card} from "../../components/card/Card";
import {Button} from "../../components/button/Button";
import {ExamXMLExport} from "./ExamXMLExport";
import {ExamPDFExport} from "./ExamPDFExport";

import {Examtasks} from "./Examtasks";
import {ZipDownloader} from "../../helper/ZipDownloader";
import {TabMenu} from "../../components/tabmenu/TabMenu";
import {PickList} from "primereact/picklist";
import {Exams} from "./Exams";
import {SelectButton} from "../../components/selectbutton/SelectButton";
import {NumberHelper} from "../../helper/NumberHelper";
import {InputText} from "../../components/inputtext/InputText";
import App from "../../App";

import './variationPicklist.css';
import {ExamOptimizer} from "./ExamOptimizer";
import {ExamExportHelper} from "./ExamExportHelper";
import {VariationGenerator} from "../../customHelper/VariationGenerator";
import {OverviewExams} from "../evaluateExam/OverviewExams";
import {MyStudipExamWrapper} from "../../customHelper/MyStudipExamWrapper";
import {MyExamPDFExtractorWrapper} from "../../customHelper/MyExamPDFExtractorWrapper";

import {NSFWConnector, APIRequest, RequestHelper, ResourceAssociationHelper, RouteHelper} from "nsfw-connector";

const JSZip = require("jszip");

export class ExamExportMenu extends Component {

    static TABLENAME_EXAMS = "Exams";
    static TABLENAME_EXAMTASKS = "Examtasks";
    static TABLENAME_EXAMGROUPS = "Examgroups";

    static EXPORT_FORMAT_XML = "XML";
    static EXPORT_FORMAT_PDF = "TEX";

    static DEFAULT_EXPORT_FORMAT = ExamExportMenu.EXPORT_FORMAT_PDF;

    static EXPORT_FORMAT_MAP = {
        [ExamExportMenu.EXPORT_FORMAT_XML] : ExamXMLExport,
        [ExamExportMenu.EXPORT_FORMAT_PDF] : ExamPDFExport

    }

    static EXPORT_FORMATS_BUTTONS = [
        {value: ExamExportMenu.EXPORT_FORMAT_XML, label: ExamExportMenu.EXPORT_FORMAT_XML},
        {value: ExamExportMenu.EXPORT_FORMAT_PDF, label: ExamExportMenu.EXPORT_FORMAT_PDF},
    ]

    static VARIATION_SUGGESTIONS_DEFAULT = 32;

    constructor(props) {
        super(props);
        this.variationPicklist = React.createRef();
        let initialTab = {label: 'Export', icon: 'pi pi-fw pi-download', content: this.renderExportConfig.bind(this)};
        this.state = {
            activeIndex: 0,
            activeItem: initialTab,
            selectedFormat: ExamExportMenu.DEFAULT_EXPORT_FORMAT,
            selectedExportInterface: ExamExportMenu.EXPORT_FORMAT_MAP[ExamExportMenu.DEFAULT_EXPORT_FORMAT],
            variationEditor: {},
            selectedVariations: [],
            savedVariations: [],
            availableVariations: [],
            items: [
                initialTab,
                {label: 'Variations', icon: 'pi pi-fw pi-sort-alt', content: this.renderVariations.bind(this)},
                {label: 'StudIP Exam', icon: 'pi pi-fw pi-file', content: this.renderStudIPWrapper.bind(this)},
                {label: 'PDF Extractor', icon: 'pi pi-fw pi-file', content: this.renderPDFExtractorWrapper.bind(this)},
            ]
        }
        this.loadInformations();
    }

    async loadInformations(){
        const { match: { params } } = this.props;
        let schemes = await NSFWConnector.getSchemes();
        let instanceRoute = RouteHelper.getInstanceRouteForParams(schemes,ExamExportMenu.TABLENAME_EXAMS,params);
        let exam = await this.getExam(instanceRoute);
        let orderedExamtasks = await this.getOrderedExamtasks(instanceRoute);
        let examtasksTaskvariations = await this.getExamtaskVariations(orderedExamtasks);
        let functions = await ExamExportMenu.getAllFunctions();

        await this.setState({
            params: params,
            exam: exam,
            functions: functions,
            savedVariations: this.loadSavedVariations(exam.examtaskvariations),
            route: instanceRoute,
            orderedExamtasks: orderedExamtasks,
            examtasksTaskvariations: examtasksTaskvariations
        })
    }

    loadSavedVariations(savedVariations){
        if(!savedVariations){
            return [];
        } else {
            for(let i=0; i<savedVariations.length;i++){
                let variation = savedVariations[i];
                variation = this.addKeyToVariation(variation);
                savedVariations[i] = variation;
            }
            return savedVariations;
        }
    }

    getSavedVariationsWithoutKey(savedVariations){
        let copy = JSON.parse(JSON.stringify(savedVariations));
        for(let i=0; i<copy.length; i++){
            delete copy[i].key;
        }
        return copy;
    }

    async saveChoosenVariations(savedVariations){
        let payloadJSON = {
            examtaskvariations: this.getSavedVariationsWithoutKey(savedVariations)
        };
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_PUT,this.state.route,payloadJSON);
        if(!RequestHelper.isSuccess(answer)){
            this.setState({
                requestPending: false,
                savedVariations: savedVariations,
            });
            let detail = !answer ? 'Unkown error!' : answer.error;
            App.addToastMessage("Error",detail,"error");
        } else {
            this.setState({
                requestPending: false,
            });
            App.addToastMessage("Success","Changes saved","success");
        }
    }

    async getOrderedExamtasks(instanceRoute){
        let route = instanceRoute+"/associations/"+ExamExportMenu.TABLENAME_EXAMTASKS;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,route);
        if(RequestHelper.isSuccess(answer)){
            let examtasks = answer.data;
            let orderedExamtasks = Exams.orderExamTasks(examtasks);
            return orderedExamtasks;
        }
        return null;
    }

    async getExamtaskVariations(orderedExamtasks){
        let examtasksTaskvariations = {};
        for(let i=0; i<orderedExamtasks.length; i++){
            let examtask = orderedExamtasks[i];
            let taskvariations = await Exams.getTaskvariations(examtask);
            examtasksTaskvariations[examtask.id] = taskvariations;
        }
        return examtasksTaskvariations;
    }

    async getExam(instanceRoute){
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,instanceRoute);
        if(RequestHelper.isSuccess(answer)){
            return answer.data;
        }
        return null;
    }

    static async getAllFunctions(){
        let route = await RouteHelper.getIndexRouteForResourceAsync("Functions");
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,route);
        if(RequestHelper.isSuccess(answer)){
            return answer.data;
        }
        return null;
    }

    renderHeader(){
        let tableNameSingle = "Exam Export Generation";
        return <HeaderTemplate title={tableNameSingle} subtitle={"Specify how to export the Exam"} />
    }

    static async evalVariable(string = "", groupNumber, functions){
        string = await ExamExportHelper.replaceVariables(string,groupNumber);
        string = await ExamExportHelper.evalFunctions(string, functions);
        return string;
    }

    static async evalExpectation(expectation, groupNumber, functions){
        expectation.solution = await ExamExportMenu.evalVariable(expectation.solution, groupNumber, functions);
        expectation.description = await ExamExportMenu.evalVariable(expectation.description, groupNumber, functions);
        return expectation;
    }

    static async evalAllExpectations(expectations, groupNumber, functions){
        for(let i=0; i<expectations.length; i++){
            let expectation = expectations[i];
            expectations[i] = await ExamExportMenu.evalExpectation(expectation, groupNumber, functions);
        }
        return expectations;
    }

    static async getAllEvaledExpectations(examtaskTaskvariation, groupNumber, functions){
        let expectations = await ExamExportMenu.getExpectationsFromTaskvariation(examtaskTaskvariation);
        expectations = await ExamExportMenu.evalAllExpectations(expectations, groupNumber, functions);
        return expectations;
    }

    static async getExpectationsFromTaskvariation(examtaskTaskvariation){
        return await ResourceAssociationHelper.handleGetAssociationsForResource(examtaskTaskvariation,OverviewExams.TABLENAME_TASKVARIATIONS,OverviewExams.TABLENAME_EXPECTATIONS) || [];
    }

    async getMappingTaskvariationsToExpectations(examtasksTaskvariations){
        let mapping = {};
        let examtaskIds = Object.keys(examtasksTaskvariations);
        for(let i=0; i<examtaskIds.length; i++){
            let taskvariations = examtasksTaskvariations[examtaskIds[i]];
            for(let j=0; j<taskvariations.length; j++){
                let taskvariation = taskvariations[j];
                let expectations = await ExamExportMenu.getExpectationsFromTaskvariation(taskvariation);
                mapping[taskvariation.id] = expectations;
            }
        }
        return mapping;
    }

    async handleDownloadExportedExam(){
        let exam = this.state.exam;
        let orderedExamtasks = this.state.orderedExamtasks;
        let examtasksTaskvariations = this.state.examtasksTaskvariations;
        let mappingTaskvariationsToExpectations = await this.getMappingTaskvariationsToExpectations(examtasksTaskvariations);

        let functions = this.state.functions;
        let savedVariations = this.getSavedVariationsWithoutKey(this.state.savedVariations);

        let selectedFormat = this.state.selectedFormat;
        let selectedExportInterface = this.state.selectedExportInterface;

        let zip = new JSZip();
        let filename = exam.name+"_Exams_"+selectedFormat;
        let folder = zip.folder(filename);

        for(let i=0; i<savedVariations.length;i++){
            let groupNumber = i+1;
            console.log("groupNumber: "+groupNumber);
            let savedVariation = savedVariations[i];
            let variationMapping = ExamExportHelper.getExamtaskMappingToVariation(orderedExamtasks,savedVariation,examtasksTaskvariations);
            let expectationsForExamtaskIdMapping = {};
            for(let i=0; i<orderedExamtasks.length; i++){
                let examtask = JSON.parse(JSON.stringify(orderedExamtasks[i]));
                let examtaskTaskvariation = JSON.parse(JSON.stringify(variationMapping[examtask.id]));
                console.log("  examtaskTaskvariation: "+examtaskTaskvariation.id);
                let rawExpectations = JSON.parse(JSON.stringify(mappingTaskvariationsToExpectations[examtaskTaskvariation.id]));
                let expectations = await ExamExportMenu.evalAllExpectations(rawExpectations,groupNumber, functions);
                expectationsForExamtaskIdMapping[examtask.id] = expectations;
                examtaskTaskvariation.question = await ExamExportMenu.evalVariable(examtaskTaskvariation.question,groupNumber,functions);
                examtaskTaskvariation.solution = await ExamExportMenu.evalVariable(examtaskTaskvariation.solution,groupNumber,functions);
                variationMapping[examtask.id] = examtaskTaskvariation;
            }

            let groupFolder = folder.folder("Gruppe_"+groupNumber);
            await selectedExportInterface.generateExam(groupFolder, groupNumber,exam,orderedExamtasks,variationMapping, expectationsForExamtaskIdMapping);
        }
        try{
            await selectedExportInterface.generateTopLevelFiles(folder, exam);
        } catch (err){
            console.log(err);
            console.log("Probably dont have any top level files");
        }

        App.addToastMessage("Generation","Done, compressing files");

        zip.generateAsync({type:"blob"}).then(function(blob) {
            // see FileSaver.js
            ZipDownloader.downloadBlob(filename+".zip",blob);
        });
    }

    renderExportConfig(){
        let disabled = true;
        let disabledText = <div>{"Please create atleast one Variation"}</div>;
        if(!!this.state.savedVariations && this.state.savedVariations.length > 0){
            disabled = false;
            disabledText = "";
        }

        return(
            <div className="p-col">
                <Card title={"Export"} style={{width: '500px'}}>
                    {disabledText}
                    <Button disabled={disabled} label={"Download"} icon={"pi pi-download"} onClick={() => {this.handleDownloadExportedExam()}}/>
                    <div>TODO Link Exports direct to Studip Groups :-/</div>
                    <div>StudIP XML is not reimportable, due to specific formatation of studip...</div>
                </Card>
            </div>
        )
    }


    variationTemplate(variation) {
        let variationChars = [];
        let orderedExamtasks = this.state.orderedExamtasks;
        for(let i=0; i<orderedExamtasks.length; i++){
            let examtask = orderedExamtasks[i];
            let examtaskId = examtask.id;
            let examtaskTaskvariationId = variation[examtaskId];
            let label = this.getExamtaskVariationIndexAsCharacter(examtaskId,examtaskTaskvariationId);
            variationChars.push(label);
        }

        return (
            <div className="p-clearfix">
                <div>{JSON.stringify(variationChars)}</div>
            </div>
        );
    }

    variationEditorTemplate(option){
        return(
            <div style={{textAlign: 'center', padding: '1em', width: '50px'}}>
                <div>{option.label}</div>
            </div>
        )
    }

    addKeyToVariation(variation){
        let key = Math.random();
        variation.key = key;
        return variation;
    }

    handleCreateNewVariation(){
        let orderedExamtasks = this.state.orderedExamtasks;
        let examtasksTaskvariations = this.state.examtasksTaskvariations;
        if(!!orderedExamtasks && !!examtasksTaskvariations) {
            let newVariationPossible = true;
            let newVariation = {};
            for (let i = 0; i < orderedExamtasks.length; i++) {
                let examtask = orderedExamtasks[i];
                let examtaskId = examtask.id;
                let examtaskTaskvariations = examtasksTaskvariations[examtaskId];
                if(examtaskTaskvariations.length > 0){
                    let examtaskTaskvariation = examtaskTaskvariations[0];
                    newVariation[examtaskId] = examtaskTaskvariation.id;
                } else {
                    newVariationPossible = false;
                }
            }
            if(newVariationPossible){
                let availableVariations = this.state.availableVariations;
                newVariation = this.addKeyToVariation(newVariation);
                availableVariations.push(newVariation);
                this.setState({
                    availableVariations: availableVariations,
                    lastSelectedVariation: newVariation
                })
            }
        }
    }

    getIndexOfExamtaskvariation(examtaskId, examtaskTaskvariationId){
        let examtasksTaskvariations = this.state.examtasksTaskvariations;
        if(!!examtasksTaskvariations && !!examtasksTaskvariations[examtaskId]){
            let examtaskTaskvariations = examtasksTaskvariations[examtaskId];
            return ExamExportMenu.getIndexOfExamtaskvariation(examtaskTaskvariationId, examtaskTaskvariations);
        }
        return null;
    }

    static getIndexOfExamtaskvariation(examtaskTaskvariationId, examtaskTaskvariations){
        for(let i=0; i<examtaskTaskvariations.length; i++){
            let examtaskTaskvariation = examtaskTaskvariations[i];
            if(examtaskTaskvariation.id === examtaskTaskvariationId){
                return i;
            }
        }
        return null;
    }

    getExamtaskVariationIndexAsCharacter(examtaskId, examtaskTaskvariationId){
        let index = this.getIndexOfExamtaskvariation(examtaskId, examtaskTaskvariationId);
        let label = NumberHelper.numToSSColumn(index+1);
        return label;
    }

    async handleEditSelectedVariations(examtaskId, examtaskTaskvariationId){
        if(!!examtaskTaskvariationId){
            let selectedVariations = this.state.selectedVariations;
            let availableVariations = this.state.availableVariations;
            let savedVariations = this.state.savedVariations;
            let savedVariationsChanged = false;

            for(let i=0; i<selectedVariations.length; i++){
                let selectedVariation = selectedVariations[i];
                selectedVariation[examtaskId] = examtaskTaskvariationId;
                let key = selectedVariation.key;
                for(let j=0; j<availableVariations.length; j++){
                    let variation = availableVariations[j];
                    if(variation.key === key){
                        availableVariations[j] = selectedVariation;
                    }
                }
                for(let j=0; j<savedVariations.length; j++){
                    let variation = savedVariations[j];
                    if(variation.key === key){
                        if(savedVariations[j] !== selectedVariation){
                            savedVariations[j] = selectedVariation;
                            savedVariationsChanged = true;
                        }
                    }
                }
            }
            await this.setState({
                selectedVariations: selectedVariations,
                availableVariations: availableVariations,
            });
            await this.saveChoosenVariations(savedVariations);
        }
    }

    renderVariationEditor(){
        let rows = [];
        let orderedExamtasks = this.state.orderedExamtasks;
        let examtasksTaskvariations = this.state.examtasksTaskvariations;
        let selectedVariations = this.state.selectedVariations;

        let disabled = !!selectedVariations && selectedVariations.length>0 ? false : true;

        if(!!orderedExamtasks && !!examtasksTaskvariations){
            for(let i=0; i<orderedExamtasks.length; i++){
                let examtask = orderedExamtasks[i];
                let examtaskId = examtask.id;
                let examtaskTaskvariations = examtasksTaskvariations[examtaskId];
                let variationSelectItems = [];
                for(let j=0; j<examtaskTaskvariations.length; j++){
                    let examtaskTaskvariation = examtaskTaskvariations[j];
                    let examtaskTaskvariationId = examtaskTaskvariation.id;
                    let label = this.getExamtaskVariationIndexAsCharacter(examtaskId,examtaskTaskvariationId);
                    variationSelectItems.push({label: label, value: examtaskTaskvariationId});
                }
                let editorVariationValue = null;
                let multipleValuesFound = false;
                for(let x=0; x<selectedVariations.length; x++){
                    let selectedVariation = selectedVariations[x];
                    let selectedVariationValue = selectedVariation[examtaskId];

                    editorVariationValue = !editorVariationValue ? selectedVariationValue : editorVariationValue;
                    if(editorVariationValue !== selectedVariationValue){
                        editorVariationValue = selectedVariationValue;
                        multipleValuesFound = true;
                    }
                }
                if(multipleValuesFound){
                    editorVariationValue = null;
                }

                rows.push(<div style={{"marginBottom":"0.5em"}}>
                    <SelectButton
                        disabled={disabled}
                        value={editorVariationValue}
                        options={variationSelectItems}
                        itemTemplate={this.variationEditorTemplate.bind(this)}
                        onChange={(e) => {
                        this.handleEditSelectedVariations(examtaskId,e.value);
                    }}></SelectButton>
                </div>)
            }
        }

        let text = disabled ? "Select a Variation to edit" : "Select a task to set it for all selected variations. Highlighted tasks are shared among all selected variations."

        return (
            <div className="p-col-3">
                <Card title={"Variation Editor"}>
                    <div>{text}</div>
                    <div>{rows}</div>
                </Card>
            </div>
        );
    }

    renderVariationMetric(){
        let savedVariations = this.state.savedVariations;
        let examOptimizer = new ExamOptimizer(this.state.orderedExamtasks,this.state.examtasksTaskvariations,savedVariations);
        let metricValue = examOptimizer.calcMetricForAllSavedVariations();
        if(!isNaN(metricValue)){
            metricValue = metricValue.toFixed(2);
        }

        return (
            <div className="p-col-3">
                <Card title={"Variation Metric"}>
                    <div>TODO Variation Optimizer</div>
                    <div>{metricValue}</div>
                </Card>
            </div>
        );
    }

    parseSuggestionsToCorrectFormat(variationsOfExams,orderedExamtasks,examtasksTaskvariations){
        let formattedVariations = [];
        for(let i=0; i<variationsOfExams.length; i++){
            let formattedVaration = {};
            let variation = variationsOfExams[i];
            for(let j=0; j<variation.length; j++){
                let examtask = orderedExamtasks[j];
                let examtaskId = examtask.id;
                let taskvariationIndex = parseInt(variation[j]);
                formattedVaration[examtaskId] = examtasksTaskvariations[examtaskId][taskvariationIndex].id;
            }
            formattedVaration = this.addKeyToVariation(formattedVaration);
            formattedVariations.push(formattedVaration);
        }
        return formattedVariations;
    }

    handleGenerateVariationSuggestions(){
        let amountSuggestionsToGenerate = this.state.amountSuggestionsToGenerate || ExamExportMenu.VARIATION_SUGGESTIONS_DEFAULT;
        let orderedExamtasks = this.state.orderedExamtasks;
        let examtasksTaskvariations = this.state.examtasksTaskvariations;
        if(!!amountSuggestionsToGenerate && !!orderedExamtasks && !!examtasksTaskvariations){
            let parents = VariationGenerator.generateParents(amountSuggestionsToGenerate,orderedExamtasks,examtasksTaskvariations);
            let variationsOfExams = VariationGenerator.generateExamVariations(amountSuggestionsToGenerate,orderedExamtasks,examtasksTaskvariations,parents);
            let formattedVariations = this.parseSuggestionsToCorrectFormat(variationsOfExams,orderedExamtasks,examtasksTaskvariations);
            this.setState({
                availableVariations: formattedVariations
            });
        }
    }

    async clearPicklistSelectedTargetItems(){
        let picklist = this.variationPicklist.current;
        await picklist.setState({
            selectedItemsTarget: []
        });
    }

    async emptyPicklistSourceItems(){
        await this.setState({
            availableVariations: []
        });
        await this.setSelectedVaraitions([]);
        await this.clearPicklistSelectedSourceItems();
        await this.clearPicklistSelectedTargetItems();
    }

    async clearPicklistSelectedSourceItems(){
        let picklist = this.variationPicklist.current;
        await picklist.setState({
            selectedItemsSource: [],
        });
    }

    async setSelectedVaraitions(items){
        await this.setState({
            selectedVariations: items
        });
    }

    async onTargetSelect(e){
        await this.clearPicklistSelectedSourceItems();
        await this.setSelectedVaraitions(e.value);
    }

    async onSourceSelect(e){
        await this.clearPicklistSelectedTargetItems();
        await this.setSelectedVaraitions(e.value);
    }

    async selectAllTargetItems(){
        let picklist = this.variationPicklist.current;
        await this.setSelectedVaraitions(this.state.savedVariations);
        await picklist.setState({
            selectedItemsSource: [],
            selectedItemsTarget : this.state.savedVariations,
        });
    }

    async onChangePicklist(e){
        let picklist = this.variationPicklist.current;
        await picklist.setState({
            selectedItemsSource: picklist.state.selectedItemsTarget,
            selectedItemsTarget : picklist.state.selectedItemsSource,
        });
        await this.setState({
            availableVariations: e.source,
            savedVariations: e.target
        });
        await this.saveChoosenVariations(e.target);
    }

    renderSourceHeader(){
        return(
            <div className="p-grid">
                <div className="p-col p-fluid">
                {"Available "+this.state.availableVariations.length}
                </div>
                <div className="p-col p-fluid">
                    <Button icon={"pi pi-trash"} className="p-button-danger" onClick={this.emptyPicklistSourceItems.bind(this)}/>
                </div>
            </div>
        )
    }

    renderTargetHeader(){
        return(
            <div className="p-grid">
                <div className="p-col p-fluid">
                    {"Choosen "+this.state.savedVariations.length}
                </div>
                <div className="p-col p-fluid">
                    <Button label={"Select all"} className="p-button-success" onClick={this.selectAllTargetItems.bind(this)}/>
                </div>
            </div>
        )
    }

    renderVariations(){
        return([
            this.renderVariationEditor(),
            <div className="p-col-8">
                <Card title={"Variations"}>
                    <div className="p-grid">
                        <div className="p-col-4">
                            <Button style={{"margin":"0.5em"}} className="p-button-success" label={"New Variation"} icon={"pi pi-plus"} onClick={this.handleCreateNewVariation.bind(this)}/>
                        </div>
                        <div className="p-col-8">
                            <div className="p-inputgroup">
                                <InputText min={1} id="float-input" keyfilter={"int"} type="text" size="20" placeholder={ExamExportMenu.VARIATION_SUGGESTIONS_DEFAULT+" suggestions"} value={this.state.amountSuggestionsToGenerate} onChange={(e) => {this.setState({
                                    amountSuggestionsToGenerate: e.target.value
                                })}} />
                                <Button icon={"pi pi-plus"} label={"Add"} className="p-button-success" onClick={this.handleGenerateVariationSuggestions.bind(this)}/>
                            </div>
                            <div>Generates a bunch of variations into available row</div>
                        </div>
                    </div>
                    <PickList
                        style={{
                            "ui-picklist": {"height":"60vh"},
                            "ui-picklist-list": {"height":"60vh"},
                            ".ui-picklist": {"height":"60vh"},
                            ".ui-picklist-list": {"height":"60vh"},
                        }}
                        ref={this.variationPicklist}
                        source={this.state.availableVariations}
                        sourceHeader={this.renderSourceHeader()}
                        target={this.state.savedVariations}
                        metaKeySelection={false}
                        targetHeader={this.renderTargetHeader()}
                        itemTemplate={this.variationTemplate.bind(this)}
                        onChange={this.onChangePicklist.bind(this)}
                        onTargetSelect={this.onTargetSelect.bind(this)}
                        onSourceSelect={this.onSourceSelect.bind(this)}
                        responsive={true} />
                </Card>
            </div>,
            this.renderVariationMetric()
        ]);
    }

    renderStudIPWrapper(){
        return(
            <>
                {this.renderVoraussetzungen()}
                <div className="p-col">
                    <Card title={"StudIP Exam Wrapper"} style={{width: '500px'}}>
                        <div>Bindet die PDF Klausuren in Studip Aufgabenblätter (XML)</div>
                        <MyStudipExamWrapper />
                    </Card>
                </div>
            </>
        )
    }

    renderVoraussetzungen(){
        return(
            <div className="p-col">
                <Card title={"Voraussetzungen"} style={{width: '500px'}}>
                    <div>1. TEX Export runter laden (Export)</div>
                    <div>2. Entpacken und Generieren ("make apdf")</div>
                    <div>3. Als ZIP Archiv verpacken</div>
                    <div>4. In den weiteren Schritten zum hochladen verwenden</div>
                </Card>
            </div>
        )
    }

    renderPDFExtractorWrapper(){
        return(
            <>

                <div className="p-col">
                    <Card title={"Exam PDF"} style={{width: '500px'}}>
                        <div>Get the normal exams</div>
                        <MyExamPDFExtractorWrapper fileEndsWith={"/exam.pdf"} />
                    </Card>
                </div>
                <div className="p-col">
                    <Card title={"Solution PDF"} style={{width: '500px'}}>
                        <div>Get the solution exams</div>
                        <MyExamPDFExtractorWrapper fileEndsWith={"/solution.pdf"} />
                    </Card>
                </div>
                <div className="p-col">
                    <Card title={"Mult PDF"} style={{width: '500px'}}>
                        <div>Get the mult exams</div>
                        <MyExamPDFExtractorWrapper fileEndsWith={"/mult.pdf"} />
                    </Card>
                </div>
            </>
        )
    }

    render() {
        let activeItem = this.state.activeItem;
        let menuContent = null;
        if(!!activeItem && !!activeItem.content){
            let contentRenderFunction = activeItem.content;
            menuContent = contentRenderFunction();
        }

        return (
            <div>
                <Growl ref={(el) => this.growl = el} />

                {this.renderHeader()}

                <TabMenu model={this.state.items} activeItem={this.state.activeItem} onTabChange={(e) => this.setState({activeItem: e.value})}/>

                <div className="content-section implementation">

                    <div className="p-grid">
                        {menuContent}
                    </div>
                </div>
            </div>
        )
    }
}
