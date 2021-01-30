import React, {Component} from "react";
import {getCriticalPaths, init} from "netzplan";
import {NetzplanRenderer} from "../customHelper/NetzplanRenderer";


export default class FunctionHelper extends Component {

    constructor() {
        super();
        this.netzplan = {
            init,
            getCriticalPaths
        };
        this.renderMermaidToImage = NetzplanRenderer.renderNetzplan.bind(this);
    }

    static parseArg(arg){
        if(!isNaN(arg)){
            return parseFloat(arg);
        }
        if(FunctionHelper.isJson(arg)){
            if(typeof arg === "string" && arg.startsWith("\"") && arg.endsWith("\"")){
                arg = arg.slice(1,-1);
                return JSON.parse(arg);
            } else {
                return arg;
            }
        }
        if(typeof arg === "string"){
            arg = arg.trim();
            //since inside the string there can be "Hallo" or so
            if(arg.startsWith("\"") && arg.endsWith("\"")){
                arg = arg.slice(1,-1); //we remove additional " "
            }
            return arg;
        }
        return arg; // i have no clue what that is
    }

    static isJson(item) { // https://stackoverflow.com/questions/9804777/how-to-test-if-a-string-is-json-or-not
        item = typeof item !== "string" ? JSON.stringify(item) : item;
        try {
            item = JSON.parse(item);
        } catch (e) {
            return false;
        }
        if (typeof item === "object" && item !== null) {
            return true;
        }
        return false;
    }

    static parseArgs(args){
        let parsedArgs = [];
        for(let i=0; i<args.length; i++){
            parsedArgs.push(FunctionHelper.parseArg(args[i]));
        }
        return parsedArgs;
    }

    static async runFunction(fnString, args){
        let parsedArgs = FunctionHelper.parseArgs(args);
        try{
            let func = new Function("return async " + "function "+fnString)();
            let instance = new FunctionHelper();
            let result = await func.apply(instance,parsedArgs);
            return result;
        } catch (e){
            console.log("Error at: ");
            console.log("runFunction: "+fnString);
            console.log(parsedArgs);
            console.log(e);
            console.log("");
        }
    }

}
