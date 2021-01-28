import React, {Component} from "react";

export class MyFileReaderHelper extends Component {

    static async getFileContent(importedFile){
        let response = await fetch(importedFile);
        try{
            let content = await response.text();
            return content;
        } catch (err){
            console.log(err);
            alert(err);
            return "";
        }
    }

}
