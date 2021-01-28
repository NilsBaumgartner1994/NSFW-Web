import {ExamExportHelper} from "./ExamExportHelper";
import {StringHelper} from "../../helper/StringHelper";

import exam from "../../examExportTemplates/latex/exam.tex";
import KlausurAufgabentabelle from "../../examExportTemplates/latex/KlausurAufgabentabelle.tex";
import KlausurHeader from "../../examExportTemplates/latex/KlausurHeader.tex";
import KlausurHinweise from "../../examExportTemplates/latex/KlausurHinweise.tex";
import KlausurHinweiseOnline from "../../examExportTemplates/latex/KlausurHinweiseOnline.tex";
import KlausurPackages from "../../examExportTemplates/latex/KlausurPackages.tex";
import makefile from "../../examExportTemplates/latex/makefile";
import mult from "../../examExportTemplates/latex/mult.tex";
import solution from "../../examExportTemplates/latex/solution.tex";
import topLevelMakefile from "../../examExportTemplates/latex/topLevelMakefile";

import variables from "../../examExportTemplates/latex/variables.tex";

import csvtools from "../../examExportTemplates/latex/libs/csvtools.sty";


import {MyFileReaderHelper} from "../../helper/MyFileReaderHelper";
import {DateHelper} from "../../helper/DateHelper";
import {EditableField} from "../dataview/EditableField";

export class ExamPDFExport {

    static FOLDERNAME_ASSIGNMENTS = "assignments";
    static FOLDERNAME_PICTURES = "pics";
    static FOLDERNAME_LIBS = "libs";
    static CODE_QUOTE_PLACEHOLDER = "§QUOTE§";

    /**
     * Generate Exam
     * @param groupFolder folder to put in generated files
     * @param groupId integer
     * @param examResource exam from server
     * @param orderedExamtasks list of tasks in the order which they will be shown
     * @param variationMapping
     * @param expectationsForExamtaskIdMapping Mapping of Examtask to Expectations
     * @returns {Promise<string>}
     */
    static async generateExam(groupFolder, groupId,examResource,orderedExamtasks,variationMapping, expectationsForExamtaskIdMapping){
        await ExamPDFExport.generateAssignments(groupFolder, groupId,orderedExamtasks,variationMapping, expectationsForExamtaskIdMapping);
        await ExamPDFExport.generateTableOfContentOfExamtaskTexFiles(groupFolder, orderedExamtasks);
        await ExamPDFExport.generatePointTableTexFile(groupFolder, orderedExamtasks);
        await ExamPDFExport.generateLatexConstructFiles(groupFolder);
        await ExamPDFExport.generateLatexLibFiles(groupFolder);
        await ExamPDFExport.generateLatexVariableFile(groupFolder, examResource, orderedExamtasks);
    }

    static async generateTopLevelFiles(rootFolder, exam){
        rootFolder.file("makefile", await MyFileReaderHelper.getFileContent(topLevelMakefile));
        rootFolder.file("exam.json",JSON.stringify(exam));
    }

    static async generateLatexLibFiles(groupFolder){
        let libFolder = groupFolder.folder(ExamPDFExport.FOLDERNAME_LIBS);
        libFolder.file("csvtools.sty", await MyFileReaderHelper.getFileContent(csvtools));
    }

    static async generateLatexConstructFiles(groupFolder){
        groupFolder.file("exam.tex", await MyFileReaderHelper.getFileContent(exam));
        groupFolder.file("KlausurHeader.tex", await MyFileReaderHelper.getFileContent(KlausurHeader));

        //TODO Online vs Local exam
        //groupFolder.file("KlausurHinweise.tex", await MyFileReaderHelper.getFileContent(KlausurHinweise));
        groupFolder.file("KlausurHinweise.tex", await MyFileReaderHelper.getFileContent(KlausurHinweiseOnline));

        groupFolder.file("KlausurPackages.tex", await MyFileReaderHelper.getFileContent(KlausurPackages));
        groupFolder.file("makefile", await MyFileReaderHelper.getFileContent(makefile));
        groupFolder.file("mult.tex", await MyFileReaderHelper.getFileContent(mult));
        groupFolder.file("solution.tex", await MyFileReaderHelper.getFileContent(solution));
    }

    static async generateLatexVariableFile(groupFolder, examResource, orderedExamtasks){
        let variableFileString = await MyFileReaderHelper.getFileContent(variables);
        let totalPoints = 0;
        for(let i=0; i<orderedExamtasks.length; i++){
            totalPoints += orderedExamtasks[i].points;
        }

        let replaceMap = {
            "$EXAMDURATIONINMINUTES$": DateHelper.getDateDifferenceInMinutes(new Date(examResource.startDate), new Date(examResource.endDate)),
            "$POINTS$" : totalPoints,
            "$EXAMNAME$": examResource.name,
            "$EXAMYEAR$": examResource.year,
            "$EXAMDATE$": DateHelper.formatDateToGermanString(examResource.startDate),
            "$STARTTIME$": DateHelper.formatDateToHHMMString(examResource.startDate),
            "$ENDTIME$": DateHelper.formatDateToHHMMString(examResource.endDate),
        }
        variableFileString = ExamExportHelper.replaceVariablesInString(variableFileString,replaceMap);
        groupFolder.file("variables.tex", variableFileString);
    }

    static async generatePointTableTexFile(groupFolder, orderedExamtasks){
        let amountTasks = orderedExamtasks.length;
        let tasksPerRow = 6;

        let texTable = "";

        let amountItems = amountTasks + 1; // +1 for the sum
        let rows = parseInt(""+((amountItems/tasksPerRow)+1));

        let texLineEnd = "\\\\";
        let i=0;
        let texTaskRow = "";
        let texBottomRow = "";
        for(let row = 0; row < rows; row++){
            texTaskRow = "";
            texBottomRow = "";

            for(let column=0; column<tasksPerRow; column++){
                let examtask = orderedExamtasks[i];

                texTaskRow+= " ";
                texBottomRow += " ";

                if(!!examtask){ //print task
                    let position = examtask.position;
                    texTaskRow += position;
                    texBottomRow += StringHelper.getAmountChars((position+"").length, " ");
                } else { //no task to print
                    let amountEmptySpaces = ((i+1)+"").length;
                    let emptySpaces = StringHelper.getAmountChars(amountEmptySpaces, " ");
                    texTaskRow += emptySpaces;
                    texBottomRow += emptySpaces;
                }

                texTaskRow+= " ";
                texBottomRow += " ";

                if(column+1 !== tasksPerRow){ //not the last item in row
                    texTaskRow+= "&";
                    texBottomRow += "&";
                }
                i++;
            }

            if((row+1)===rows){ // print the sum
                texTaskRow += "$\\sum$ ";
            }

            texTaskRow += texLineEnd;
            texBottomRow += texLineEnd;

            texTable+= texTaskRow+"\n" +
                "\\hline\n" +
                texBottomRow+"\n" +
                texBottomRow+"\n" +
                "\\hline\n";
        }

        let fileString = await MyFileReaderHelper.getFileContent(KlausurAufgabentabelle);
        let replaceMap = {
            "$TASKSPERROW$": tasksPerRow,
            "$TABULAR$": texTable
        }
        fileString = ExamExportHelper.replaceVariablesInString(fileString,replaceMap);
        groupFolder.file("KlausurAufgabentabelle.tex", fileString);
    }

    static generateTableOfContentOfExamtaskTexFiles(groupFolder, orderedExamtasks){
        let tex = "";
        for(let i=0; i<orderedExamtasks.length; i++){
            let examtask = orderedExamtasks[i];
            let examtaskTexFilename = ExamPDFExport.getExamtaskTexFilename(examtask);
            tex += "\\input{"+ExamPDFExport.FOLDERNAME_ASSIGNMENTS+"/"+examtaskTexFilename+"}\n";
            tex += "\\newpage\n";
        }

        let texFilename = "assignments.tex";
        groupFolder.file(texFilename, tex);
    }

    static getExamtaskTexFilename(examtask){
        let position = examtask.position;
        let texFilename = "A"+position+".tex";
        return texFilename;
    }

    static async generateAssignments(groupFolder, groupId,orderedExamtasks,variationMapping,expectationsForExamtaskIdMapping){
        let assignmentFolder = groupFolder.folder(ExamPDFExport.FOLDERNAME_ASSIGNMENTS);
        let pictureFolder = groupFolder.folder(ExamPDFExport.FOLDERNAME_PICTURES);

        for(let i=0; i<orderedExamtasks.length; i++){
            let examtask = orderedExamtasks[i];
            let position = examtask.position;
            let taskvariation = variationMapping[examtask.id];
            let expectations = expectationsForExamtaskIdMapping[examtask.id];
            await ExamPDFExport.generateAssignment(assignmentFolder, pictureFolder, position, groupId, examtask,taskvariation, expectations);
        }
    }

    static async generateAssignment(assignmentFolder, pictureFolder, position, groupId, examtask,taskvariation, expectations){
        let placeHolderTitle = "$TITLE";
        let placeHolderPoints = "$POINTS";
        let placeHolderIntro = "$INTRO";
        let placeHolderHint = "$HINT";
        let placeHolderQuestion = "$QUESTION";
        let placeHolderSolution = "$SOLUTION";
        let placeHolderEpectations = "EXPECTATIONS";

        let tex =
            "\\assignment{"+placeHolderTitle+"}{"+placeHolderPoints+"}\n" +
            "\n" +
            placeHolderIntro+"\n" +
            placeHolderHint+"\n" +
            placeHolderQuestion+"\n" +
            "\n" +
            "\\begin{sol}\n" +
            "LÖSUNG: \n" +
            placeHolderSolution+"\n" +
            "\\end{sol}\n" +
            "\n" +
            placeHolderEpectations+"\n";

        let imgArray = []; // call by reference counter ;-)

        let expectationsTex = ExamPDFExport.generateAssignmentExpectations(expectations,pictureFolder,position, imgArray);
        let formatedIntro = ExamPDFExport.formatEditorToLatex(examtask.intro, pictureFolder,position, imgArray);
        let formatedHint = ExamPDFExport.formatEditorToLatex(examtask.hint, pictureFolder,position, imgArray);
        let formatedQuestion = ExamPDFExport.formatEditorToLatex(taskvariation.question, pictureFolder,position, imgArray);
        let formatedSolution = ExamPDFExport.formatEditorToLatex(taskvariation.solution, pictureFolder,position, imgArray);

        let replaceMap = {
            [placeHolderTitle] : examtask.name,
            [placeHolderPoints] : examtask.points,
            [placeHolderIntro] : formatedIntro,
            [placeHolderHint] : formatedHint,
            [placeHolderQuestion] : formatedQuestion,
            [placeHolderSolution] : formatedSolution,
            [placeHolderEpectations] : expectationsTex,
        }
        tex = ExamExportHelper.replaceVariablesInString(tex,replaceMap);
        let texFilename = ExamPDFExport.getExamtaskTexFilename(examtask);
        assignmentFolder.file(texFilename, tex);
    }

    static formatEditorToLatex(string, pictureFolder,position, imgArray){
        let formatedString = string;
        formatedString = EditableField.removeBackgroundStyles(formatedString);
        formatedString = ExamExportHelper.replaceCodeStyleBlock(formatedString,ExamPDFExport.formatCodeStringToLatex.bind(this));
        formatedString = ExamExportHelper.replaceBoldStyleBlock(formatedString,ExamPDFExport.formatBoldToLatex.bind(this));
        formatedString = ExamExportHelper.replaceItalicStyleBlock(formatedString,ExamPDFExport.formatItalicToLatex.bind(this));
        formatedString = ExamExportHelper.replaceUnsortedListStyleBlock(formatedString,ExamPDFExport.formatListHolderToLatex.bind(this),ExamPDFExport.formatListItemHolderToLatex.bind(this));
        formatedString = ExamExportHelper.replaceUnderlineStyleBlock(formatedString,ExamPDFExport.formatUnderlineToLatex.bind(this));
        formatedString = ExamExportHelper.unwrapSpanStyleBlock(formatedString);

        formatedString = ExamExportHelper.replaceImageStyleBlock(formatedString, ExamPDFExport.formatImageStringToLatex.bind(this, pictureFolder,position, imgArray));
        let lineBreak = " ~\\newline\n";

        let replaceMap = {
            "<p>" : "",
            "</p>" : lineBreak,
            "<br>" : lineBreak,
            "</br>" : "", //since every <br> is already a new line
            "&nbsp;" : " ", //https://en.wikibooks.org/wiki/LaTeX/FAQ#Non-breaking_spaces
            '"' : '\\textquotedblleft\\hspace{0pt}', //otherwise the quote command could stick to a word
            [ExamPDFExport.CODE_QUOTE_PLACEHOLDER] : '"', //since we want to keep quotes in code as it is
            "&gt;" : ">",
            "&lt;" : "<",
            "&amp;" : "\\&",
            "^" : "\\^" //https://tex.stackexchange.com/questions/52804/missing-inserted-inserted-text
        }

        formatedString = ExamExportHelper.replaceVariablesInString(formatedString,replaceMap);
        formatedString = ExamPDFExport.replaceSpecialCharacters(formatedString);
        if(formatedString.endsWith(lineBreak)){ //remove last linebreak
            formatedString = formatedString.substring(0,formatedString.length-lineBreak.length);
        }

        return formatedString;
    }

    static replaceSpecialCharacters(string){
        let replaceMap = {
            "ä" : '\\"a',
            "Ä" : '\\"A',
            "ö" : '\\"o',
            "Ö" : '\\"O',
            "ü" : '\\"u',
            "Ü" : '\\"U',
            "ß" : '\\ss{}',
        }
        string = ExamExportHelper.replaceVariablesInString(string,replaceMap);
        return string;
    }

    static correctDataURL(dataUrl){
        if(dataUrl+"".endsWith('"')){ //Some encoded images have a " at the end
            //this will result in the error: Failed to execute 'atob' on 'Window'
            dataUrl = dataUrl.slice(0, -1); //thats why we remove it
        }
        return dataUrl;
    }

    static dataURLtoFile(dataurl, filename) {
        dataurl = ExamPDFExport.correctDataURL(dataurl);

        let arr = dataurl.split(',');
        let mime = arr[0].match(/:(.*?);/)[1];
        let last = arr[1];
        last = ExamPDFExport.correctDataURL(last); //why ever a " is still there
        let bstr = atob(last);
        let n = bstr.length
        let u8arr = new Uint8Array(n);

        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, {type:mime});
    }

    static formatImageStringToLatex(pictureFolder, position, imgArray, imgTagString){
        let src = imgTagString.slice(ExamExportHelper.EDITOR_ImageStyleStart.length,-1*ExamExportHelper.EDITOR_ImageStyleEnd.length);
        imgArray.push("1");
        let fileName = "A"+position+"-"+imgArray.length+".png";
        let image = ExamPDFExport.dataURLtoFile(src,fileName);
        pictureFolder.file(fileName,image);

        let tex =
            "\\begin{center}\n" +
            "\\includegraphics[width=\\textwidth]{"+ExamPDFExport.FOLDERNAME_PICTURES+"/"+fileName+"}\n" +
            "\\end{center}\n";

        return tex;
    }

    static formatListHolderToLatex(string){
        return "\\begin{itemize}\n    " + string + "\\end{itemize}";
    }

    static formatListItemHolderToLatex(string){
        return "    \\item " +string+"\n";
    }

    static formatBoldToLatex(string){
        return "\\textbf{"+string+"}";
    }

    static formatItalicToLatex(string){
        return "\\textit{"+string+"}";
    }

    static formatUnderlineToLatex(string){
        return "\\underline{"+string+"}";
    }

    static formatCodeStringToLatex(codeString){
        let singleIndent = "    ";
        let replaceMap = {
            "\t" : singleIndent,
            '"' : ExamPDFExport.CODE_QUOTE_PLACEHOLDER,
            "    " : singleIndent,
            "\\&" : "&", //since in verbatism & arent handled extra
            "&amp;": "&",
        }
        codeString = ExamExportHelper.replaceVariablesInString(codeString,replaceMap);
        let tex =
            "\\begin{tcolorbox}\n" +
            "  \\begin{verbatim}\n" +
            codeString + "\n" +
            "  \\end{verbatim}\n" +
            "\\end{tcolorbox}";
        return tex;
    }

    static generateAssignmentExpectations(expectations,pictureFolder,position, imgArray){
        let placeHolderExpectationsTex = "$EXPECTATIONS";

        let tex =
            "\\begin{eval}\n" +
            "\\begin{compactitem}\n" +
            placeHolderExpectationsTex +
            "\\end{compactitem}\n" +
            "\\end{eval}\n";

        let generatedExpectationsTex = "";
        for(let i=0; i<expectations.length; i++){
            let expectation = expectations[i];
            let expectationTex = ExamPDFExport.generateAssignmentExpectation(expectation,pictureFolder,position, imgArray)+"\n";
            generatedExpectationsTex += expectationTex;
        }

        let replaceMap = {
            [placeHolderExpectationsTex] : generatedExpectationsTex,
        }
        tex = ExamExportHelper.replaceVariablesInString(tex,replaceMap);
        return tex;
    }

    static generateAssignmentExpectation(expectation,pictureFolder,position, imgArray){
        let replaceMap = {
            "[" : "\\lbrack",
            "]" : "\\rbrack",
            "\n": " \\\\ "
        }

        let description = ExamExportHelper.replaceVariablesInString(expectation.description,replaceMap);
        let formatedDescription = ExamPDFExport.formatEditorToLatex(description, pictureFolder,position, imgArray);

        let solution = ExamExportHelper.replaceVariablesInString(expectation.solution,replaceMap);
        let formatedSolution = ExamPDFExport.formatEditorToLatex(solution, pictureFolder,position, imgArray);

        let note = ExamExportHelper.replaceVariablesInString(expectation.note,replaceMap);
        let formatedNote = ExamPDFExport.formatEditorToLatex(note, pictureFolder,position, imgArray);


        let placeHolderPoints = "$POINTS";
        let placeHolderDescription = "$DESCRIPTION";
        let placeHolderSolution = "$SOLUTION";
        let placeHolderNote = "$NOTE";
        let tex = "\\item ("+placeHolderPoints+" P) "+placeHolderDescription+"\n";

        let noteTex = "";
        if(!!formatedNote && formatedNote.length > 0){
            noteTex =
                "    \\begin{itemize}\n" +
                "      \\item " +placeHolderNote+"\n" +
                "   \\end{itemize}";
        }

        let additionalInformationTex = "";
        if(!!formatedSolution && formatedSolution.length > 0){
            let solutionTex = "  \\begin{itemize}\n" +
                "    \\item " +placeHolderSolution+"\n";

            if(!!noteTex && noteTex.length > 0){
                solutionTex+=noteTex+"\n";
            }

            solutionTex +=
                "  \\end{itemize}";
            additionalInformationTex = solutionTex;
        } else if(!!noteTex && noteTex.length > 0) {
            additionalInformationTex = noteTex;
        }

        tex = "\\item ("+placeHolderPoints+" P) "+placeHolderDescription+"\n" + additionalInformationTex;

        replaceMap = {
            [placeHolderPoints] : expectation.points,
            [placeHolderDescription] : formatedDescription,
            [placeHolderSolution] : formatedSolution,
            [placeHolderNote] : formatedNote,
        }
        tex = ExamExportHelper.replaceVariablesInString(tex,replaceMap);
        return tex;
    }

}
