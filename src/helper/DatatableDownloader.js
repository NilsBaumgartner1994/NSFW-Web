import React, {Component} from "react";

export default class DatatableDownloader extends Component {

    static downloadTableAsJSON(exportResourceAsList,fileName){
        let parsedJSON = exportResourceAsList;
        let encodedData = encodeURIComponent(JSON.stringify(parsedJSON));

        let dataStr = "data:text/json;charset=utf-8," + encodedData;
        let link = document.createElement("a");
        link.setAttribute("download", fileName + ".json");
        link.setAttribute("href", dataStr);
        link.click();
    }

    static downloadTableAsCSV(exportResourceAsList,fileName){
        let items = exportResourceAsList;
        const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(items[0])
        let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        csv.unshift(header.join(','))
        csv = csv.join('\r\n')

        console.log(csv)

        let encodedData = encodeURIComponent(csv);
        let dataStr = "data:text/json;charset=utf-8," + encodedData;
        let link = document.createElement("a");
        link.setAttribute("download", fileName + ".csv");
        link.setAttribute("href", dataStr);
        link.click();
    }

}
