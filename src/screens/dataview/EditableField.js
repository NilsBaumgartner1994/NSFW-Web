import React, {Component} from 'react';
import {Button} from 'primereact/button';
import {Calendar} from 'primereact/calendar';
import {InputText} from 'primereact/inputtext';
import {InputTextarea} from 'primereact/inputtextarea';
import {Dialog} from 'primereact/dialog';

import {Editor} from "primereact/editor";
import {SelectButton} from "primereact/selectbutton";
import MyImageUploader from "../../helper/MyImageUploader";

import {SchemeHelper} from "nsfw-connector";
import MyFileUploader from "../../helper/MyFileUploader";
import App from "../../App";
import DownloadHelper from "../../helper/DownloadHelper";
import MyFileHelper from "../../helper/MyFileHelper";
import ServerWeb from "../../ServerWeb";

export default class EditableField extends Component {

    constructor(props) {
        super(props);
        let attributeKey = props.attributeKey;
        let value = "";
        if(!!props.instance && !!props.instance.resource){
            value = props.instance.resource[attributeKey]
        }

        this.state = {
            value: value
        }
    }

    static removeBackgroundStyles(string){
        //find all style="backgroundColor" attributes and replace them
        //https://regex101.com/r/MGvAiA/1/
        if(typeof string === "string"){
            return string.replaceAll(/ style[^>]*/gm, "");
        } else {
            return string;
        }
    }

    async handleSaveEditedRawValue(attributeKey, value){
        if(this.props.editable){
            let resource = this.props.instance.resource;
            resource[attributeKey] = value;
            this.props.instance.resource = resource;
            await this.setState({
                value: value
            });
            if(!this.props.instance.state.isEdited){
                await this.props.instance.setState({
                    isEdited: true
                });
            }
        }
    }

    handleEditorTextChange(attributeKey, event){
        if(this.props.editable){
            let value = event.htmlValue;
            value = EditableField.removeBackgroundStyles(value);
            this.handleSaveEditedRawValue(attributeKey,value);
        }
    }



    renderEditorField(attributeKey){
        let maxLength = SchemeHelper.getTypeStringMaxLength(this.props.scheme,attributeKey);
        let resourceValue = this.state.value || "";

        const header = (
            <span className="ql-formats">
                <button className="ql-bold" aria-label="Bold"></button>
                <button className="ql-italic" aria-label="Italic"></button>
                <button className="ql-underline" aria-label="Underline"></button>
                <button className="ql-image" aria-label="Image"></button>
                <button className="ql-code-block" aria-label="Code"></button>
            </span>
        );

        let editorModules = {clipboard: {matchVisual: false}}; //otherwise it inserst sometimes an extra line
        //https://stackoverflow.com/questions/43748108/how-to-keep-quill-from-inserting-blank-paragraphs-pbr-p-before-heading
        //https://www.primefaces.org/primereact/showcase/#/editor

        let readOnly = !this.props.editable;
        let key = ""+attributeKey+readOnly; //otherwise the component wont reload ...

        return(
            <div>
                <Editor key={key} readOnly={readOnly} modules={editorModules} headerTemplate={header} style={{height:'250px'}} id="float-input" type="text" value={resourceValue} onTextChange={(e) =>{ this.handleEditorTextChange(attributeKey, e)}} />
                <div className="p-inputgroup">
                    {this.renderClearValueButton(attributeKey)}
                </div>
            </div>
        );
    }

    handleSaveEditedValue(attributeKey, event){
        this.handleSaveEditedRawValue(attributeKey,event.target.value);
    }

    saveResourceChangeWithResource(resource) {
        if(this.props.editable){
            this.props.instance.setState({
                resource: resource,
                isEdited: true
            });
        }
    }

    handleClearValue(attributeKey){
        this.handleSaveEditedRawValue(attributeKey,null);
    }

    renderClearValueButton(attributeKey){
        return <Button icon="pi pi-times" className="p-button-danger" onClick={this.handleClearValue.bind(this,attributeKey)} />;
    }

    renderEditableTextField(attributeKey){
        let maxLength = SchemeHelper.getTypeStringMaxLength(this.props.scheme,attributeKey);
        let resourceValue = this.state.value || "";
        let remeiningChars = maxLength-resourceValue.length;
        let cols = 30;
        let rows = resourceValue.length/cols;
        rows = rows > 10 ? 10 : rows;

        return(
            <div>
                <div className="p-inputgroup">
                    <InputTextarea disabled={!this.props.editable} rows={rows} cols={cols} id="float-input" maxLength={maxLength} type="text" size="30" value={resourceValue} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
                    {this.renderClearValueButton(attributeKey)}
                </div>
                <div style={{"fontSize": "12px", "font-style": "italic"}}>{remeiningChars} characters remeining</div>
            </div>
        );
    }

    renderEditableBooleanField(attributeKey){
        let resourceValue =this.state.value;
        const selectItems = [
            {label: 'Yes', value: true},
            {label: 'No', value: false},
            {label: 'Null', value: null},
        ];

        return(
            <div className="p-inputgroup">
                <SelectButton disabled={!this.props.editable} value={resourceValue} options={selectItems} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
            </div>
        );
    }

    renderEditableIntegerField(attributeKey){
        let resourceValue =this.state.value || "";

        return(
            <div className="p-inputgroup">
                <InputText disabled={!this.props.editable} id="float-input" keyfilter={"int"} type="text" size="30" value={resourceValue} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
                {this.renderClearValueButton(attributeKey)}
            </div>
        );
    }

    renderEditableDateField(attributeKey){
        let resourceValue =this.state.value;
        let value = !!resourceValue ? new Date(resourceValue) : null;

        return(
            <div className="p-inputgroup">
                <Calendar disabled={!this.props.editable} value={value} showTime={true} showSeconds={true} monthNavigator={true} touchUI={true} yearNavigator={true} yearRange="1990:2030" showButtonBar={true} onChange={(e) => {this.handleSaveEditedValue(attributeKey,e)}} />
                <Button icon="pi pi-times" className="p-button-danger" onClick={this.handleClearValue.bind(this,attributeKey)} />
            </div>
        );
    }

    renderEditableJSONField(attributeKey){
        let resourceValue = JSON.stringify(this.state.value);
        if(!this.props.instance.state.jsonEditorsValues[attributeKey]){
            this.props.instance.state.jsonEditorsValues[attributeKey] = resourceValue;
        }

        const onAbort = (e) => {
            let editorState = this.props.instance.state.jsonEditorsVisible;
            editorState[attributeKey] = false;
            let editorValues = this.props.instance.state.jsonEditorsValues;
            editorValues[attributeKey] = resourceValue;
            this.setState({
                jsonEditorsVisible: editorState,
                jsonEditorsValues: editorValues
            });
        };

        const onShow = (e) => {
            let editorState = this.props.instance.state.jsonEditorsVisible;
            editorState[attributeKey] = true;
            this.setState({
                jsonEditorsVisible: editorState
            });
        };

        const onValidate = (e) => {
            try{
                let json = JSON.parse(this.props.instance.state.jsonEditorsValues[attributeKey]);
                let resource =this.state.value;
                resource[attributeKey] = json;

                let editorValues = this.props.instance.state.jsonEditorsValues;
                editorValues[attributeKey] = JSON.stringify(json);

                let editorState = this.props.instance.state.jsonEditorsVisible;
                editorState[attributeKey] = false;

                this.setState({
                    jsonEditorsVisible: editorState,
                    jsonEditorsValues: editorValues
                });
                this.saveResourceChangeWithResource(resource);
            } catch(err){
                console.log("JSON Validation Error");
                console.log(err);
            }
        }

        let isValid = true;
        try{
            JSON.parse(this.props.instance.state.jsonEditorsValues[attributeKey]);
        } catch(err){
            isValid = false;
        }

        let finishButton = <Button label="Finish" icon="pi pi-check" onClick={onValidate} />
        if(!isValid){
            finishButton = <Button label="Invalid JSON" className="p-button-danger" />;
        }

        const footer = (
            <div>
                {finishButton}
                <Button label="Abort" icon="pi pi-times" className="p-button-danger" onClick={onAbort} />
            </div>
        );

        return(
            <div>
                <div className="p-inputgroup">
                    <InputTextarea disabled={!this.props.editable} id="float-input" autoResize={true} rows={5} cols={29} onClick={onShow} value={resourceValue} />
                    <Button icon="pi pi-times" className="p-button-danger" onClick={this.handleClearValue.bind(this,attributeKey)} />
                </div>
                <Dialog header={"JSON Editor: "+attributeKey} footer={footer} visible={this.props.instance.state.jsonEditorsVisible[attributeKey]} modal={true} onHide={onAbort}>
                    <InputTextarea disabled={!this.props.editable} id="float-input" autoResize={true} rows={20} cols={80} value={this.props.instance.state.jsonEditorsValues[attributeKey]} onChange={(e) => {this.props.instance.state.jsonEditorsValues[attributeKey] = e.target.value}}/>
                </Dialog>
            </div>
        );
    }

    renderImageBlobField(attributeKey){
        let blob = this.state.value;
        let base64 = this.toBase64(blob.data);

        return(
            <div>
                <div className="p-inputgroup">
                    <img src={"data:image/png;base64, "+base64+"="} />
                    <MyImageUploader handleUpload={this.props.instance.handleUpload.bind(this.props.instance,attributeKey)} tableName={this.props.instance.props.tableName} />
                </div>
            </div>
        );
    }

    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();

            reader.onload = () => {
                console.log(reader)
                resolve(reader.result);
            };

            reader.onerror = reject;

            reader.readAsBinaryString(file);
        })
    }

    async fileToBLOB(file){
        let result = await this.readFileAsync(file);
        return result;
    }

    async handleFileUpload(attributeKey, isTableNameFiles, file){
        //TODO Decode if file.size is smaller than the server upload limit
        //TODO implement GET Server file upload limit

        try{
            let blob = await this.fileToBLOB(file);

            await this.handleSaveEditedRawValue(attributeKey,blob);

            if(isTableNameFiles){
                await this.handleSaveEditedRawValue("bytes",file.size);
                let nameWithExtension = file.name;
                let nameSplits = nameWithExtension.split('.');
                let extension = "";
                let name = nameWithExtension;
                if(nameSplits.length>1){
                    extension = nameSplits.pop();
                    name = name.slice(0,name.length-extension.length-1);
                }

                await this.handleSaveEditedRawValue("name",name);
                await this.handleSaveEditedRawValue("type",extension);
            }

            this.props.instance.setState({
                increasingNumber: this.props.instance.state.increasingNumber+1
            });
        } catch (err){
            ServerWeb.addToastMessage("Fehler","beim Hochladen der Datei", "error");
        }
    }

    handleFileDownload(attributeKey, isTableNameFiles){
        let arrayAsString = this.state.value;
        let blob = MyFileHelper.arrayBufferToBlob(arrayAsString);

        let filename = "";
        if(isTableNameFiles){
            filename = this.props.instance.name+"."+this.props.instance.type;
        }

        DownloadHelper.downloadBlobAsFile(blob, filename);
    }

    renderFileUpload(attributeKey, isTableNameFiles){
        let blob = this.state.value;

        let disabled = !blob;

        let accept = "/*";
        //TODO maybe check if isTableNameFiles --> accept = this.props.instance.extension

        return(
            <div>
                <div className="p-inputgroup">
                    <MyFileUploader accept={accept} handleUpload={this.handleFileUpload.bind(this,attributeKey, isTableNameFiles)} tableName={this.props.instance.props.tableName} />
                    <Button disabled={disabled} onClick={this.handleFileDownload.bind(this, attributeKey, isTableNameFiles)} label={"Download"} icon={"pi pi-download"} iconPos={"right"} />
                    <Button icon="pi pi-times" className="p-button-danger" onClick={this.handleClearValue.bind(this,attributeKey)} />
                </div>
            </div>
        );
    }

    renderEditableField(){
        let attributeKey = this.props.attributeKey;
        let attributeType = SchemeHelper.getType(this.props.scheme,attributeKey);

        if(this.props.instance.state.tableName==="Images"){
            if(attributeType==="BLOB"){
                return this.renderImageBlobField(attributeKey);
            }
        }
        if(this.props.instance.state.tableName==="Files"){
            if(attributeType==="BLOB"){
                return this.renderFileUpload(attributeKey, true);
            } else {
                if(attributeKey==="bytes"){
                    return  (
                        <div className="p-inputgroup">
                            {this.state.value || ""}
                        </div>
                    )
                }
            }
        }

        switch(attributeType){
            case "TEXT": return this.renderEditorField(attributeKey);
            case "STRING": return this.renderEditableTextField(attributeKey);
            case "BOOLEAN": return this.renderEditableBooleanField(attributeKey);
            case "INTEGER": return this.renderEditableIntegerField(attributeKey);
            case "BIGINT": return this.renderEditableIntegerField(attributeKey);
            case "DATE": return this.renderEditableDateField(attributeKey);
            case "JSON": return this.renderEditableJSONField(attributeKey);
            case "BLOB": return this.renderFileUpload(attributeKey, false);
        }

        return <div style={{"background-color": "green"}}>{this.state.value}</div>;
    }

    render() {
        return this.renderEditableField();
    }
}
