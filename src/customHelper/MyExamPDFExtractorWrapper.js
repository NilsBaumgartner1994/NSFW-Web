import React, {Component} from "react";
import {FileUpload} from "../components/fileupload/FileUpload";
import JSZip from "jszip";
import {ZipDownloader} from "../helper/ZipDownloader";
import {ZipExtractHelper} from "./ZipExtractHelper";

export class MyExamPDFExtractorWrapper extends Component {

    static FILETYPE_ZIP = "zip";

    constructor(props) {
        super(props);
    }

    handleParsedResources(resources){
        if(this.props.onResourceParse){
            this.props.onResourceParse(resources);
        }
    }

    handleFoundExam(downloadFolder, filename, name, parentDir, fileData){
        downloadFolder.file(parentDir+"-"+name, fileData);
    }

    async handleZip(zip){
        let downloadZip = new JSZip();
        let downloadName = "ExtractedPDF";
        let downloadFolder = downloadZip.folder(downloadName);
        let fileEndsWith = this.props.fileEndsWith;
        await ZipExtractHelper.handleFilesInZip(zip, fileEndsWith, this.handleFoundExam.bind(this,downloadFolder));

        downloadZip.generateAsync({type:"blob"}).then(function(blob) {
            // see FileSaver.js
            ZipDownloader.downloadBlob(downloadName+".zip",blob);
        });
    }

    async myUploader(event) {
        console.log("Uploaded: "+event.files.length);
        let files = event.files
        let amount = files.length;
        let instance = this;
        if(amount===1){
            let zipFile = files[0];

            JSZip.loadAsync(zipFile)                                   // 1) read the Blob
                .then(function(zip) {
                    instance.handleZip(zip);
                }, function (e) {
                    console.log(e);
                });
        }
    }

    renderImportPanel(){
        return <FileUpload ref={(el) => this.fileupload = el}  multiple={false} name="demo[]" url="./upload" customUpload uploadHandler={this.myUploader.bind(this)} accept={"."+MyExamPDFExtractorWrapper.FILETYPE_ZIP} />
    }

    render(){
        return (
            this.renderImportPanel()
        );
    }
}
