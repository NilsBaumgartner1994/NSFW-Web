import React, {Component} from "react";

export default classJSONHelper extends Component {

    static getValuesAsList(json){
        let keys = Object.keys(json);
        let values = [];
        for(let i=0; i<keys.length; i++){
            values.push(json[keys[i]]);
        }
        return values;
    }

}
