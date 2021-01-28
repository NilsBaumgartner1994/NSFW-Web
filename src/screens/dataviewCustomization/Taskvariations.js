import React, {Component} from 'react';
import {Card} from "../../components/card/Card";
import {DataTable} from "../../components/datatable/DataTable";
import {Column} from "../../components/column/Column";
import {ExamExportMenu} from "./ExamExportMenu";
import {ExamExportHelper} from "./ExamExportHelper";
import {SelectButton} from "../../components/selectbutton/SelectButton";
import {InputText} from "../../components/inputtext/InputText";
import {instanceOf} from "prop-types";
import {DatabaseGraph} from "../../customHelper/DatabaseGraph";
import {NetzplanRenderer} from "../../customHelper/NetzplanRenderer";

export class Taskvariations extends Component {

    static STYLE_FN_VAR = {"color":"orange"};

    static TABLENAME_EXPECTATIONS = "Expectations";
    static VARIABLE_MATR_NUMBER = "$MATR_NUMBER";
    static VARIABLE_GROUP_NUMBER = "$GROUP_NUMBER";

    constructor(props) {
        super(props);
        this.state = {
            showPreview: false,
            groupNumber: 1,
            allFunctions: []
        }
    }

    async componentDidMount() {
        let allFunctions = await ExamExportMenu.getAllFunctions();
        this.setState({
            allFunctions: allFunctions
        })
    }

    loadConfigs(){

    }

    static renderAvailableVariables(){
        return <div className="p-col">
            <Card title={"Erlaubte Variablen"} style={{width: '500px'}}>
                <div style={Taskvariations.STYLE_FN_VAR}>{Taskvariations.VARIABLE_GROUP_NUMBER}</div>
            </Card>
        </div>
    }

    static columnTemplateFunctionName(rowData, column) {
        return <div style={Taskvariations.STYLE_FN_VAR}>${rowData.name}</div>;
    }

    static columnTemplateFunctionParams(rowData, column) {
        let fn = rowData.fn;
        if(!!fn){
            let params = ExamExportHelper.getFunctionParams(fn);
            return <div style={Taskvariations.STYLE_FN_VAR}>({params})</div>;
        } else {
            return <div style={{"color":"red"}}>FEHLER</div>;
        }
    }

    static async evalAllResourcesFieldsWithGroupNumber(resourceCopy, groupNumber, allFunctions){
        let resource = JSON.parse(JSON.stringify(resourceCopy));
        console.log("evalAllResourcesFieldsWithGroupNumber");
        let keys = Object.keys(resource);
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            let value = resource[key];
            console.log(typeof value);
            if(typeof value==="string"){
                resource[key] = await ExamExportMenu.evalVariable(value,groupNumber,allFunctions);
            }
        }
        return resource;
    }

    async handleEvalAllResourceFields(){
        let resourceCopy = this.props.parentState.resourceCopy;
        let groupNumber = this.state.groupNumber;
        let allFunctions = this.state.allFunctions;
        let evaluatedResource = await Taskvariations.evalAllResourcesFieldsWithGroupNumber(resourceCopy, groupNumber, allFunctions);
        this.props.instance.resource = evaluatedResource;
        await this.props.instance.setState({
            editingAllowed: false,
            increasingNumber: this.props.instance.state.increasingNumber+1
        });
    }

    async previewChange(event){
        let value = event.target.value;
        await this.setState({
            showPreview: value,
        });

        if(value){
            await this.handleEvalAllResourceFields();
        } else {
            let resourceCopy = this.props.parentState.resourceCopy;
            this.props.instance.resource = resourceCopy;
            await this.props.instance.setState({
                editingAllowed: true,
                increasingNumber: this.props.instance.state.increasingNumber+1
            });
        }
    }

    async previewGroupNumberChange(event){
        let value = event.target.value;
        await this.setState({
            groupNumber: value
        });
        await this.handleEvalAllResourceFields();
    }

    renderPreviewControl(){
        const selectItems = [
            {label: 'Nein', value: false},
            {label: 'Ja', value: true},
        ];

        let content = this.props.parentState.isEdited ? <div>Änderungen erst speichern</div> : <div>
            <div className="p-inputgroup">
                <div>Vorschau zeigen</div>
                <SelectButton value={this.state.showPreview} options={selectItems} onChange={this.previewChange.bind(this)} />
            </div>
        </div>

        let settings = !this.state.showPreview ? null : <div className="p-inputgroup">
            <div>GROUP_NUMBER</div>
            <InputText id="float-input" keyfilter={"int"} type="text" size="30" value={this.state.groupNumber} onChange={this.previewGroupNumberChange.bind(this)} />
        </div>

        return <div className="p-col">
            <Card title={"Vorschau Einstellungen"} style={{width: '500px'}}>
                {content}
                {settings}
            </Card>
        </div>
    }

    static renderAvailableFunctions(allFunctions){
        return <div className="p-col">
            <Card title={"Erlaubte Functionen"} style={{width: '500px'}}>
                <DataTable value={allFunctions} >
                    <Column columnKey="name" field="name" header="Name" body={Taskvariations.columnTemplateFunctionName.bind(this)}/>
                    <Column columnKey="fn" field="fn" header="Parameter" body={Taskvariations.columnTemplateFunctionParams.bind(this)}/>
                </DataTable>
            </Card>
        </div>
    }

    renderExpectations(){
        let associationResources = this.props.parentState.associationResources;
        if(!!associationResources){
            let expectations = associationResources[Taskvariations.TABLENAME_EXPECTATIONS];
            expectations.sort(function(a, b) {
                return b.points - a.points;
            });

            return <div className="p-col">
                <Card title={Taskvariations.TABLENAME_EXPECTATIONS+" Übersicht"} style={{width: '500px'}}>
                    <DataTable value={expectations} reorderableColumns={true}>
                        <Column columnKey="points" field="points" header="Punkte" style={{width: '6em'}}/>
                        <Column columnKey="description" field="description" header="Beschreibung"/>
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

        cardList.push(this.renderPreviewControl())
        cardList.push(Taskvariations.renderAvailableVariables());
        cardList.push(Taskvariations.renderAvailableFunctions(this.state.allFunctions));
        cardList.push(this.renderExpectations());

        return cardList
    }
}
