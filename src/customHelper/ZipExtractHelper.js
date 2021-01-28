import React from "react";
const path = require("path");

export class ZipExtractHelper {

    static async handleFilesInZip(zip, fileEndsWith, callback, fileType="blob"){
        let sep = path.sep;
        if(!fileType){
            fileType = "blob";
        }

        let zipFileKeys = Object.keys(zip.files);
        for(let i=0; i<zipFileKeys.length; i++){
            let filename = zipFileKeys[i];
            if(filename.endsWith(fileEndsWith)){
                let splits = filename.split(sep);
                let name = splits[splits.length-1];
                let parentDir = splits[splits.length-2];
                let file = zip.files[filename];
                let readPromise = file.async(fileType);
                try{
                    let fileData = await readPromise;
                    await callback(filename, name, parentDir, fileData);
                } catch (err){
                    console.log(err);
                }
            }
        }
    }

}
