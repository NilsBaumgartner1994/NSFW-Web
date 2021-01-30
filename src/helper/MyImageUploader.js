import React, {Component} from "react";
import {FileUpload} from "../components/fileupload/FileUpload";

export default class MyImageUploader extends Component {

  constructor(props) {
    super(props);
    //resource
    //tableName
  }

  handleUpload(file){
    if(this.props.handleUpload) {
      this.props.handleUpload(file);
      this.fileupload.clear();
    }
  }

  myUploader(event) {
    console.log("Uploaded: "+event.files.length);
    let amount = event.files.length;
    if(amount===1) {
      let file = event.files[0];
      console.log(file);
      this.handleUpload(file);
    }
  }

  renderImportPanel(){
    return <FileUpload auto={true} ref={(el) => this.fileupload = el} multiple={false} name="demo[]" url="./upload" customUpload uploadHandler={this.myUploader.bind(this)} accept="image/*" />
  }

  render(){
    return (
        this.renderImportPanel()
    );
  }
}
