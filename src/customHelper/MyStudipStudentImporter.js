import React, {Component} from "react";
import {FileUpload} from "../components/fileupload/FileUpload";
import {NumberHelper} from "../helper/NumberHelper";

const XLSX = require('xlsx');

export class MyStudipStudentImporter extends Component {

  static FILETYPE_XLS = "xls";

  static PLACEHOLDER_START = "startHISsheet";
  static PLACEHOLDER_END = "endHISsheet";

  static SHEET_MAPPING = {
    //"id" : "A", well we want individual students for each exam
    "matrNr": "A",
    "lastname": "B",
    "firstname" : "C",
  }

  constructor(props) {
    super(props);
  }

  handleParsedResources(resources){
    if(this.props.onResourceParse){
      this.props.onResourceParse(resources);
    }
  }

  getStudentJSONFromRow(rowIndex, sheet){
    let studentJSON = {};
    let mapping = MyStudipStudentImporter.SHEET_MAPPING;
    let keys = Object.keys(mapping);
    for(let i=0; i<keys.length; i++){
      let key = keys[i];
      let column = mapping[key];
      let cellContent = sheet[column+rowIndex];
      if(!!cellContent){
        let cellValue = cellContent.v;
        studentJSON[key] = cellValue;
      }
    }
    return studentJSON;
  }

  getStudentsFromSheet(sheet){
    let studentsInSheet = [];
    let ref = sheet["!ref"]; // example "A1:061"
    let refSplits = ref.split(":");
    let lastCellAsString = refSplits[1];
    let lastRow = NumberHelper.getNumberInString(lastCellAsString);

    for(let row = 1; row<=lastRow; row++){
      let studentJSON = this.getStudentJSONFromRow(row,sheet);
      if(!!studentJSON.matrNr && !isNaN(studentJSON.matrNr) && !!studentJSON.firstname && !!studentJSON.lastname){
        studentsInSheet.push(studentJSON);
      }
    }
    return studentsInSheet;
  }

  handleImportStudents(studipXLS){
    console.log(studipXLS);
    let studentsAsList = [];
    let SheetNames = studipXLS.SheetNames;
    let Sheets = studipXLS.Sheets;
    if(!!SheetNames && !!Sheets){
      for(let i=0; i<SheetNames.length; i++){
        let sheetName = SheetNames[i];
        let sheet = Sheets[sheetName];
        let studentsFromSheet = this.getStudentsFromSheet(sheet);
        studentsAsList = studentsAsList.concat(studentsFromSheet);
      }
    }
    this.handleParsedResources(studentsAsList);
    this.fileupload.clear();
  }

  myUploader(event) {
    console.log("Uploaded: "+event.files.length);
    let amount = event.files.length;
    let instance = this;
    if(amount===1){
      let files = event.files, f = files[0];
      let reader = new FileReader();
      reader.onload = function(e) {
        let data = new Uint8Array(e.target.result);
        let studipXLS = XLSX.read(data, {type: 'array'});
        instance.handleImportStudents(studipXLS);
      };
      reader.readAsArrayBuffer(f);
    }
  }

  renderImportPanel(){
      return <FileUpload ref={(el) => this.fileupload = el}  multiple={false} name="demo[]" url="./upload" customUpload uploadHandler={this.myUploader.bind(this)} accept={"."+MyStudipStudentImporter.FILETYPE_XLS} />
  }

  render(){
    return (
        this.renderImportPanel()
    );
  }
}
