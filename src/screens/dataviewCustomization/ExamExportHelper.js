import {Taskvariations} from "./Taskvariations";
import {FunctionHelper} from "../../helper/FunctionHelper";

export class ExamExportHelper {

    static EDITOR_CodeStyleStart = '<pre class="ql-syntax" spellcheck="false">';
    static EDITOR_CodeStyleEnd = '</pre>';
    static EDITOR_BoldStyleStart = '<strong>';
    static EDITOR_BoldStyleEnd = '</strong>';
    static EDITOR_ItalicStyleStart = '<em>';
    static EDITOR_ItalicStyleEnd = '</em>';
    static EDITOR_UnderlineStyleStart = '<u>';
    static EDITOR_UnderlineStyleEnd = '</u>';
    static EDITOR_UnsortedListStyleStart = '<ul>';
    static EDITOR_UnsortedListStyleEnd = '</ul>';
    static EDITOR_UnsortedListItemStyleStart = '<li>';
    static EDITOR_UnsortedListItemStyleEnd = '</li>';
    static EDITOR_ImageStyleStart = '<img src="';
    static EDITOR_ImageStyleEnd = '">';

    static unwrapSpanStyleBlock(string=""){
        return string.replace(/<\/?span[^>]*>/g,"");
    }

    static replaceUnsortedListStyleBlock(string = "", functionToFormatListHolder, functionToFormatListItem){
        let listHolderStart = ExamExportHelper.EDITOR_UnsortedListStyleStart;
        let listHolderEnd = ExamExportHelper.EDITOR_UnsortedListStyleEnd;

        string = ExamExportHelper.replaceSurroundedStyle(string, functionToFormatListHolder, listHolderStart, listHolderEnd);

        let listItemHolderStart = ExamExportHelper.EDITOR_UnsortedListItemStyleStart;
        let listItemHolderEnd = ExamExportHelper.EDITOR_UnsortedListItemStyleEnd;
        string = ExamExportHelper.replaceSurroundedStyle(string, functionToFormatListItem, listItemHolderStart, listItemHolderEnd);
        return string;
    }

    static replaceCodeStyleBlock(string="", functionToFormatCode){
        let editorCodeStyleStart = ExamExportHelper.EDITOR_CodeStyleStart;
        let editorCodeStyleEnd = ExamExportHelper.EDITOR_CodeStyleEnd;

        return ExamExportHelper.replaceSurroundedStyle(string, functionToFormatCode, editorCodeStyleStart, editorCodeStyleEnd);
    }

    static replaceBoldStyleBlock(string="", functionToFormatCode){
        let editorCodeStyleStart = ExamExportHelper.EDITOR_BoldStyleStart;
        let editorCodeStyleEnd = ExamExportHelper.EDITOR_BoldStyleEnd;

        return ExamExportHelper.replaceSurroundedStyle(string, functionToFormatCode, editorCodeStyleStart, editorCodeStyleEnd);
    }

    static replaceItalicStyleBlock(string="", functionToFormatCode){
        let editorCodeStyleStart = ExamExportHelper.EDITOR_ItalicStyleStart;
        let editorCodeStyleEnd = ExamExportHelper.EDITOR_ItalicStyleEnd;

        return ExamExportHelper.replaceSurroundedStyle(string, functionToFormatCode, editorCodeStyleStart, editorCodeStyleEnd);
    }


    static replaceUnderlineStyleBlock(string="", functionToFormatCode){
        let editorCodeStyleStart = ExamExportHelper.EDITOR_UnderlineStyleStart;
        let editorCodeStyleEnd = ExamExportHelper.EDITOR_UnderlineStyleEnd;

        return ExamExportHelper.replaceSurroundedStyle(string, functionToFormatCode, editorCodeStyleStart, editorCodeStyleEnd);
    }

    static replaceSurroundedStyle(string="", functionToFormatCode, editorCodeStyleStart, editorCodeStyleEnd){
        if(string === null){
            string = "";
        }

        if(!!functionToFormatCode){
            let workString = ""+string;
            workString = ExamExportHelper._helperReplaceBlock(workString,functionToFormatCode,editorCodeStyleStart,editorCodeStyleEnd);
            while(workString!==string){
                string = ""+workString;
                workString = ExamExportHelper._helperReplaceBlock(workString,functionToFormatCode,editorCodeStyleStart,editorCodeStyleEnd);
            }
        }

        return string;
    }

    static _helperReplaceBlock(string, functionToFormatCode,editorCodeStyleStart,editorCodeStyleEnd){
        let editorCodeStyleStartIndex = null;
        let editorCodeStlyeEndIndex = null;

        let contentStartIndex = null;
        let contentEndIndex = null;

        let startMatch = string.match(editorCodeStyleStart);
        if(!!startMatch && !isNaN(startMatch.index)){
            contentStartIndex = startMatch.index + editorCodeStyleStart.length; //match will get the index before the match, so the content begins after
            editorCodeStyleStartIndex = startMatch.index;
        }

        let endMatch = string.match(editorCodeStyleEnd);
        if(!!endMatch && !isNaN(endMatch.index)){
            contentEndIndex = endMatch.index; //since the content ends here
            editorCodeStlyeEndIndex = endMatch.index + editorCodeStyleEnd.length; //the outer boundarys need to be adjusted
        }

        if(editorCodeStyleStartIndex !== null && editorCodeStlyeEndIndex !== null && contentStartIndex !== null && contentEndIndex !== null){
            if(editorCodeStyleStartIndex < editorCodeStlyeEndIndex){ //if there is something to replace
                let stringToReplace = string.slice(editorCodeStyleStartIndex,editorCodeStlyeEndIndex);
                let codeAsString = string.slice(contentStartIndex,contentEndIndex);
                let newCodeStyleString = functionToFormatCode(codeAsString);
                string = string.replace(stringToReplace,newCodeStyleString);
            }
        } else {
        }

        return string;
    }

    static replaceImageStyleBlock(string="", functionToFormatCode){
        if(string === null){
            string = "";
        }
        if(!!functionToFormatCode){
            let matched = string.match(/<img [^>]*src="[^"]*"[^>]*>/gm); //find all <img src="">
            if(!!matched && matched.length>0){
                for(let i=0; i<matched.length; i++){
                    let match = matched[i];
                    let replacedString = functionToFormatCode(match);
                    string = string.replaceAll(match, replacedString);
                }
            }
        }
        return string;
    }

    static getFunctionParams(fn){
        let newTxt = fn.split('(');
        for(let i = 1; i < newTxt.length; i++) {
            let params = (newTxt[i].split(')')[0]);
            return params;
        }
        return "";
    }

    static async replaceVariables(string,groupId){
        let replaceMap = {
            [Taskvariations.VARIABLE_GROUP_NUMBER+""] : groupId
        }
        string = ExamExportHelper.replaceVariablesInString(string,replaceMap);
        return string;
    }

    static replaceVariablesInString(string, replaceMap={}){
        if(string === null){
            string = "";
        }
        let keys = Object.keys(replaceMap);
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            let value = replaceMap[key];
            string = string.replaceAll(key,value);
        }

        return string;
    }

    static async evalFunctions(question="",functions=[], directReturn=false){
        let copyString = question+"";

        let functionName = "";
        let parameterContent = "";
        let wholeParameterContent = "";
        let parameters = [];

        let stage = 0;

        let capturedFunction = "";
        let depth = 0;
        for(let i=0; i<copyString.length; i++){
            let c = copyString[i];
            if(stage===0){ //search for beginn of a custom function
                capturedFunction = "";
                depth=0;
                if(c==="$") { //search beginning
                    stage = 1;
                    functionName="";
                }
            } else if(stage===1){ // custom function start found, now lets get the name
                let charactersOnly = c.search(/[^a-zA-Z]+/) === -1;
                if(charactersOnly){
                    functionName+=c;
                } else if(c==="("){ //okay the parameters will start now, move on to stage 2
                    depth++;
                    stage = 2;
                    parameterContent="";
                    wholeParameterContent = "";
                    parameters = [];
                } else {
                    stage=0;
                }
            } else if(stage===2){ //check when parameters will end
                if(c==="("){ //every new bracket shows a new level/function
                    depth++;
                }
                if(c===")"){ //if bracket ends we check if our level is back to normal
                    depth--;
                    if(depth===0){
                        parameters.push(parameterContent); //we save last parameter into our parameter list
                        stage=3; //okay finished finding the content
                    }
                }
                if(depth>0){ //while inside the parameter level
                    if(c==="," && depth === 1){ //we are on top level of our parameters
                        parameters.push(parameterContent); //we save it into our parameter list
                        parameterContent = ""; //reset our parameter content
                    } else {
                        parameterContent+=c; //add them to our parameter content
                    }
                    wholeParameterContent+=c;
                }
            }
            if(stage>0){
                capturedFunction += c;
            }
            if(stage===3){
                stage=0;
                for(let j=0; j<parameters.length; j++){
                    let parameter = parameters[j];
                    parameter = await ExamExportHelper.evalFunctions(parameter, functions,true);
                    parameters[j] = parameter;
                }
                for(let j=0; j<functions.length; j++){
                    let funct = functions[j];
                    let name = funct.name;
                    if(name===functionName){
                        let fn = funct.fn;
                        let result = await FunctionHelper.runFunction(fn,parameters);
                        if(directReturn){
                            return result;
                        } else {
                            question=question.replace("$"+functionName+"("+parameterContent+")",result);
                            question=question.replace(capturedFunction,result);
                        }
                    }
                }
            }
        }
        return question;
    }

    static isMappingSuccessfull(mapping,orderedExamtasks){
        for(let i=0; i<orderedExamtasks.length; i++) {
            let examtask = orderedExamtasks[i];
            let examtaskID = examtask.id;
            if(!mapping[examtaskID]){
                return false;
            }
        }
        return true;
    }

    static getExamtaskMappingToVariation(orderedExamtasks=[],savedVariation={},examtasksTaskvariations={}){
        let mapping = {};
        for(let i=0; i<orderedExamtasks.length; i++){
            let examtask = orderedExamtasks[i];
            let examtaskID = examtask.id;
            let examtaskVariationId = savedVariation[examtaskID];
            let variationsForExamtask = examtasksTaskvariations[examtaskID];
            for(let j=0; j<variationsForExamtask.length; j++){
                let variation = variationsForExamtask[j];
                if(variation.id+""===examtaskVariationId+""){
                    mapping[examtaskID] = variation;
                }
            }
        }
        return mapping;
    }

}
