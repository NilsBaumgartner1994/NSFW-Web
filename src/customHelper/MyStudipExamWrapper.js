import React, {Component} from "react";
import {FileUpload} from "../components/fileupload/FileUpload";
import JSZip from "jszip";
import {ZipDownloader} from "../helper/ZipDownloader";
import {ZipExtractHelper} from "./ZipExtractHelper";
import { base64ToBlob, blobToBase64 } from 'base64-blob'
import examTemplate from "../examExportTemplates/studipExam/examTemplate.xml";
import {MyFileReaderHelper} from "../helper/MyFileReaderHelper";
import {DateHelper} from "../helper/DateHelper";
import {ExamExportHelper} from "../screens/dataviewCustomization/ExamExportHelper";
import DateTime from "luxon/src/datetime";

export class MyStudipExamWrapper extends Component {

    static FILETYPE_ZIP = "zip";

    constructor(props) {
        super(props);
    }

    async handleFoundExam(exam, downloadFolder, filename, name, parentDir, fileData){
        let examTemplateText = await MyFileReaderHelper.getFileContent(examTemplate)
        console.log("filename: "+filename);
        console.log("fileData size: "+fileData.size)
        let promise = blobToBase64(fileData);
        let base64 = await promise;
        console.log("base64 length: "+base64.length);

        //adapt base64 so that studip can handle it:
        let base64Remove = "data:application/octet-stream;base64,";
        base64 = base64.replace(base64Remove, "");

        let luxonStartDate = DateTime.fromISO(exam.startDate);
        let luxonEndDate = DateTime.fromISO(exam.endDate);
        let duration = DateHelper.getDateDifferenceInMinutes(new Date(exam.startDate), new Date(exam.endDate));

        //Stud.IP VIP can be handled differently
        //For easier usage the teacher will manually activate VIPs, so that he measures the time
        //Because of this, we just set the writing time manually
        let useManualyVipsSetting = true;
        if(useManualyVipsSetting) {
            let begin = 6;
            let end = 22;
            luxonStartDate = luxonStartDate.set({hour: 6, minute: 0, second: 0, millisecond: 0});
            luxonEndDate = luxonEndDate.set({hour: 22, minute: 0, second: 0, millisecond: 0});
            duration = (end-begin)*60;
        }

        let replaceMap = {
            "$EXAM_ID$": parentDir,
            "$BLOCK$": parentDir,
            "$EXAM_TITLE$": exam.name,
            "$EXAMNAME$": exam.name,
            "$EXAMYEAR$": exam.year,
            "$STARTTIME$": luxonStartDate.toISO(),
            "$ENDTIME$": luxonEndDate.toISO(),
            "$EXAMDURATIONINMINUTES$": duration,
            "$BASE64$": base64,
        }
        let replacesExamTemplateText = ExamExportHelper.replaceVariablesInString(examTemplateText,replaceMap);

        downloadFolder.file(parentDir+"-exam"+".xml", replacesExamTemplateText);
    }

    async handleConfigFileFound(zip, filename, name, parentDir, fileData){
        console.log("handleConfigFileFound");
        console.log(filename);
        console.log(fileData);
        let exam = JSON.parse(fileData);

        let downloadZip = new JSZip();
        let downloadName = "StudIPExam";
        let downloadFolder = downloadZip.folder(downloadName);
        let fileEndsWith = "/exam.pdf"; //on Mac OS it finds also a file .../exam.pdf, therefore the /
        await ZipExtractHelper.handleFilesInZip(zip, fileEndsWith, this.handleFoundExam.bind(this,exam, downloadFolder));

        downloadZip.generateAsync({type:"blob"}).then(function(blob) {
            // see FileSaver.js
            ZipDownloader.downloadBlob(downloadName+".zip",blob);
        });
    }

    async handleZip(zip){
        let fileEndsWith = "/exam.json"; //on Mac OS it finds also a file .../_exam.json, therefore the /
        await ZipExtractHelper.handleFilesInZip(zip, fileEndsWith, this.handleConfigFileFound.bind(this, zip), "string");
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
        return <FileUpload ref={(el) => this.fileupload = el}  multiple={false} name="demo[]" url="./upload" customUpload uploadHandler={this.myUploader.bind(this)} accept={"."+MyStudipExamWrapper.FILETYPE_ZIP} />
    }

    render(){
        return (
            this.renderImportPanel()
        );
    }
}
