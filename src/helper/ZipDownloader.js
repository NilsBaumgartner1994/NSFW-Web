import React, {Component} from "react";

export class ZipDownloader extends Component {

    /**
     {
         Exams: [
            {
                Exam1.xml: CONTENT
            },
            {
                Exam2.xml: CONTENT
            },
         ]
     }
     */

    static downloadAsZip(){

    }

    static downloadBlob(fileName, blob){
        let elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = fileName;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }

}
