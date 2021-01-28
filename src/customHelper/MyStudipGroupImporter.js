import React, {Component} from "react";
import {FileUpload} from "../components/fileupload/FileUpload";
import App from "../App";

const XLSX = require('xlsx');
const csv = require('csv');

export class MyStudipGroupImporter extends Component {

  static FILETYPE_CSV = "csv";
  static DELIMITER = ";";

  static IGNORE_GROUP = "keiner Funktion oder Gruppe zugeordnet";

  static PLACEHOLDER_START = "startHISsheet";
  static PLACEHOLDER_END = "endHISsheet";

  static IDENTIFIER_GROUP = "group";
  static IDENTIFIER_FIRSTNAME = "firstname";
  static IDENTIFIER_LASTNAME = "lastname";

  static MAPPING = {
    [MyStudipGroupImporter.IDENTIFIER_GROUP] : "Gruppe",
    [MyStudipGroupImporter.IDENTIFIER_FIRSTNAME]: "Vorname",
    [MyStudipGroupImporter.IDENTIFIER_LASTNAME]: "Nachname",
  }

  constructor(props) {
    super(props);
  }

  handleParsedResources(resources){
    if(this.props.onResourceParse){
      this.props.onResourceParse(resources);
      this.fileupload.clear();
    }
  }

  findIndexOfIdentifier(attributeFields,identifier){
    let searchForValue = MyStudipGroupImporter.MAPPING[identifier];
    for(let i=0; i<attributeFields.length; i++){
      let value = attributeFields[i];
      if(value===searchForValue){
        return i;
      }
    }
    return -1;
  }

  findStudent(firstname,lastname){
    let associatedStudents = this.props.associatedStudents;
    let matchingStudentsFound = 0;
    let matchedStudent = null;

    for(let i=0; i<associatedStudents.length; i++){
      let student = associatedStudents[i];
      let studentFirstname = student[MyStudipGroupImporter.IDENTIFIER_FIRSTNAME];
      let studentLastname = student[MyStudipGroupImporter.IDENTIFIER_LASTNAME];
      if(studentFirstname===firstname && studentLastname===lastname){
        matchingStudentsFound++;
        matchedStudent = student;
      }
    }

    if(matchingStudentsFound===1){
      return matchedStudent;
    }
    if(matchingStudentsFound===0){
      let details = "firstname: "+firstname+" lastname: "+lastname+" was not found in student list";
      App.addToastMessage("Error",details,"error");
      return null;
    } else {
      let details = "firstname: "+firstname+" lastname: "+lastname+" was found multiple times in student list";
      App.addToastMessage("Error",details,"error");
      return null;
    }
  }

  myUploaderCSV(fileText){
    let instance = this;
    csv.parse(fileText,{delimiter: MyStudipGroupImporter.DELIMITER},function(err,output){
      //console.log(output);
      if(err){
        console.log(err);
      } else {
        if(output){
          let attributeFields = output[0];
          let indexOfGroupname = instance.findIndexOfIdentifier(attributeFields,MyStudipGroupImporter.IDENTIFIER_GROUP);
          let indexOfFirstname = instance.findIndexOfIdentifier(attributeFields,MyStudipGroupImporter.IDENTIFIER_FIRSTNAME);
          let indexOfLastname = instance.findIndexOfIdentifier(attributeFields,MyStudipGroupImporter.IDENTIFIER_LASTNAME);

          if(indexOfFirstname>=0 && indexOfLastname>=0 && indexOfGroupname>=0){
            let groupsWithStudents = {};
            let studentInGroups = {};
            let errorsFound = false;

            for(let i=1; i<output.length; i++){
              let row = output[i];
              let groupName = row[indexOfGroupname];
              if(groupName!==MyStudipGroupImporter.IGNORE_GROUP){
                let studentsInGroup = groupsWithStudents[groupName] || [];
                let firstname = row[indexOfFirstname];
                let lastname = row[indexOfLastname];
                let student = instance.findStudent(firstname,lastname);
                if(!!student){
                  studentsInGroup.push(student);
                  groupsWithStudents[groupName] = studentsInGroup;

                  //check if dublicate students found
                  let key = firstname+"."+lastname;
                  studentInGroups[key] = studentInGroups[key]+1 || 1;
                  if(studentInGroups[key]>1){
                    console.log("ERRRRROOOORR");
                    let details = "Row: "+i+" ("+firstname+" "+lastname+") found multiple times";
                    App.addToastMessage("Error",details,"error");
                    errorsFound = true;
                  }
                } else {
                  errorsFound = true;
                }
              }
            }
            if(!errorsFound){
              instance.handleParsedResources(groupsWithStudents);
            }
          } else {
            let details = "indexOfGroupname: "+indexOfGroupname+" | indexOfFirstname: "+indexOfFirstname+" | indexOfLastname: "+indexOfLastname
            App.addToastMessage("Error Parsing",details,"error");
          }
        } else {
          App.addToastMessage("Error",err.toString(),"error");
        }
      }
    })
  }

  myUploader(event) {
    let amount = event.files.length;
    if(amount===1){
      let file = event.files[0];
      let fileName = file.name;
      let extension = fileName.split('.').pop();
      let uploader = this.myUploaderCSV.bind(this);
      let reader = new FileReader();
      reader.onload = function(event) {
        if(!!uploader){
          let result = event.target.result;
          uploader(result);
        }
      }
      reader.readAsText(file)
    }
  }

  renderImportPanel(){
      return <FileUpload ref={(el) => this.fileupload = el} multiple={false} name="demo[]" url="./upload" customUpload uploadHandler={this.myUploader.bind(this)} accept={"."+MyStudipGroupImporter.FILETYPE_CSV} />
  }

  render(){
    return (
        this.renderImportPanel()
    );
  }
}
