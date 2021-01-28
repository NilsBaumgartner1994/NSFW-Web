import React, {Component} from 'react';
import {Card} from "../../components/card/Card";
import {DataTable} from "../../components/datatable/DataTable";
import {Column} from "../../components/column/Column";
import {ExamExportMenu} from "./ExamExportMenu";
import {ExamExportHelper} from "./ExamExportHelper";
import {SelectButton} from "../../components/selectbutton/SelectButton";
import {InputText} from "../../components/inputtext/InputText";
import {Taskvariations} from "./Taskvariations";

export class Expectations extends Component {

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

    async handleEvalAllResourceFields(){
        let resourceCopy = this.props.parentState.resourceCopy
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

    render() {
        let parentState = this.props.parentState;
        let parentProps = this.props.parentProps;

        let tableName = parentState.tableName;

        let cardList = [];

        cardList.push(this.renderPreviewControl())
        cardList.push(Taskvariations.renderAvailableVariables());
        cardList.push(Taskvariations.renderAvailableFunctions(this.state.allFunctions));

        return cardList
    }
}
