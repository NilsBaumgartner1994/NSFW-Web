import React, {Component} from "react";
import {FileUpload} from "primereact/fileupload";

const csv = require('csv');

export default class MyDatatableImporter extends Component {

  static FILETYPE_JSON = "json";
  static FILETYPE_CSV = "csv";

  constructor(props) {
    super(props);
  }

  handleParsedResources(resources){
    if(this.props.onResourceParse){
      this.props.onResourceParse(resources);
      this.fileupload.clear();
    }
  }

  myUploaderJSON(fileText){
    console.log(fileText);
    let resources = JSON.parse(fileText);
    console.log(resources);
    this.handleParsedResources(resources);
  }

  myUploaderCSV(fileText){
    //TODO ask user which delimiter he has ?
    let instance = this;
    csv.parse(fileText,{delimiter: this.props.delimiter},function(err,output){
      //console.log(output);
      if(err){
        console.log(err);
      } else {
        if(output){
          let attributeFields = output[0];
          let resources = [];
          for(let i=1; i<output.length; i++){
            let row = output[i];
            let resource = {};
            for(let j=0; j<attributeFields.length; j++){
              let field = attributeFields[j];
              let value = row[j];
              resource[field] = value;
            }
            resources.push(resource);
          }
          instance.handleParsedResources(resources);
        } else {
          console.log("Unkown CSV Import error");
        }
      }
    })
  }

  myUploader(event) {
    console.log("Uploaded: "+event.files.length);
    let amount = event.files.length;
    if(amount===1){
      let file = event.files[0];
      console.log(file);
      console.log(Object.keys(file));
      console.log(file.name);
      let fileName = file.name;
      let extension = fileName.split('.').pop();
      let uploader = null;
      if(extension===MyDatatableImporter.FILETYPE_CSV){
        uploader=this.myUploaderCSV.bind(this);
      }
      if(extension===MyDatatableImporter.FILETYPE_JSON){
        uploader=this.myUploaderJSON.bind(this);
      }

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
    if(this.props.fileExtension){
      return <FileUpload ref={(el) => this.fileupload = el} multiple={false} name="demo[]" url="./upload" customUpload uploadHandler={this.myUploader.bind(this)} accept={"."+this.props.fileExtension} />
    } else {
      return null;
    }
  }

  render(){
    return (
        <div>
      <div className="content-section introduction">
        <div className="feature-intro">
          <h1>Import Menu</h1>
          <p>Please select your {this.props.fileExtension} file you want to Import</p>
        </div>
      </div>

      <div className="content-section implementation">
        {this.renderImportPanel()}
      </div>
    </div>
    );
  }
}
