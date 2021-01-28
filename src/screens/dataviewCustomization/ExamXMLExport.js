import {ExamExportHelper} from "./ExamExportHelper";

const { DateTime } = require("luxon");

export class ExamXMLExport {

    /**
     * Generate Exam
     * @param groupFolder folder to put in generated files
     * @param groupId integer
     * @param examResource exam from server
     * @param orderedExamtasks list of tasks in the order which they will be shown
     * @param variationMapping
     * @returns {Promise<string>}
     */
    static async generateExam(groupFolder,groupId,examResource,orderedExamtasks,variationMapping, expectationsForExamtaskIdMapping){ // expectationsForExamtaskIdMapping not used for XML but in PDF
        let exercisesXML = await ExamXMLExport.getExercisesXML(groupId,orderedExamtasks,variationMapping);
        let xmlDocument = ExamXMLExport.getXMLHeader(examResource.name,"test-"+examResource.id,"exam",examResource.startDate, examResource.endDate, exercisesXML);
        let filename = "Gruppe "+groupId+".xml";
        groupFolder.file(filename, xmlDocument);
    }

    static async getExercisesXML(groupId, orderedExamtasks,variationMapping){
        let exercisesXML = "";
        for(let i=0; i<orderedExamtasks.length; i++){
            let examtask = orderedExamtasks[i];
            let taskvariation = variationMapping[examtask.id];
            let taskXML = await ExamXMLExport.getXMLTask(groupId, examtask,taskvariation);
            exercisesXML+=taskXML;
        }
        return exercisesXML;
    }

    static placeHolder_Exercise_ID = "$ID";
    static placeHolder_Exercise_Points = "$POINTS";
    static placeHolder_Exercise_Title = "$TITLE";
    static placeHolder_Exercise_Question = "$QUESTION";
    static placeHolder_Exercise_Solution = "$SOLUTION";

    static ExerciseTemplateXML =
        '<exercise id="exercise-'+ExamXMLExport.placeHolder_Exercise_ID+'" points="'+ExamXMLExport.placeHolder_Exercise_Points+'">\n' +
        '<title>'+ExamXMLExport.placeHolder_Exercise_Title+'</title>\n' +
        '<description>\n' +
        '&lt;!--HTML--&gt;' +
        ExamXMLExport.placeHolder_Exercise_Question +
        '\n' +
        '</description><items>\n' +
        '<item type="text-area">\n' +
        '<answers>\n' +
        '<answer score="1"\n' +
        '>&lt;!--HTML--&gt;'+ExamXMLExport.placeHolder_Exercise_Solution+'</answer>\n' +
        '</answers>\n' +
        '<submission-hints>\n' +
        '<attachments upload="true"/>\n' +
        '</submission-hints>\n' +
        '</item>\n' +
        '</items>\n' +
        '</exercise>\n';

    static async getXMLTask(groupId, examtask,taskvariation){
        let points = examtask.points;
        let xmlTemplate = ExamXMLExport.ExerciseTemplateXML;

        let question = taskvariation.question;
        question = await ExamXMLExport.convertHTMLToStudipSpecificHTML(question);

        let replaceMap = {
            [ExamXMLExport.placeHolder_Exercise_ID] : examtask.id,
            [ExamXMLExport.placeHolder_Exercise_Points] : points,
            [ExamXMLExport.placeHolder_Exercise_Title] : examtask.name,
            [ExamXMLExport.placeHolder_Exercise_Question] : question,
            [ExamXMLExport.placeHolder_Exercise_Solution] : examtask.name,
        }
        xmlTemplate = ExamExportHelper.replaceVariablesInString(xmlTemplate,replaceMap);
        return xmlTemplate;
    }

    static convertHTMLToStudipSpecificHTML(question){
        question = ExamXMLExport.convertEditorCodeStylesToHTMLCodeStyle(question);
        console.log("QUESTION BEFORE FINAL REPLACEMENT");
        console.log(question);
        let replaceMap = { //TODO Replace this S**T with something better
            "<pre>" : "&lt;pre&gt;",
            "</pre>" : "&lt;/pre&gt;",
            "<p>" : "&lt;p&gt;",
            "</p>" : "&lt;/p&gt;",
            "<br>" : "&lt;br&gt;",
            "</br>" : "&lt;/br&gt;",
            "<br/>" : "&lt;br/&gt;",
            "<b>" : "&lt;strong&gt;",
            "</b>" : "&lt;/strong&gt;",
            "<em>" : "&lt;/em&gt;",
            "</em>" : "&lt;/em&gt;",
            "<u>" : "&lt;/u&gt;",
            "</u>" : "&lt;/u&gt;",
            "<table>" : '&lt;table&gt;',
            "</table>" : "&lt;/table&gt;",
            "<tbody>" : "&lt;tbody&gt;",
            "</tbody>" : "&lt;/tbody&gt;",
            "<tr>" : "&lt;tr&gt;",
            "</tr>" : "&lt;/tr&gt;",
            "<td>" : "&lt;td&gt;",
            "</td>" : "&lt;/td&gt;",
            "\n" : "&lt;br /&gt;",
            "&nbsp;" : "&amp;nbsp;"
        }
        question = ExamExportHelper.replaceVariablesInString(question,replaceMap);
        console.log("QUESTION AFTER FINAL REPLACEMENT 2");
        console.log(question);
        return question;
    }

    static convertEditorCodeStylesToHTMLCodeStyle(question){
        let convertedQuestion = ExamXMLExport.convertEditorCodeStyleToHTMLCodeStyle(question);
        while(convertedQuestion!==question){
            question = convertedQuestion;
            convertedQuestion = ExamXMLExport.convertEditorCodeStyleToHTMLCodeStyle(question);
        }

        return question;
    }

    static convertEditorCodeStyleToHTMLCodeStyle(question){
        let formatedQuestion = ExamExportHelper.replaceCodeStyleBlock(question,ExamXMLExport.convertCodeStringToHTMLTable.bind(this));
        return formatedQuestion;
    }

    static convertCodeStringToHTMLTable(codeAsString){
        let singleIndent = "&nbsp; &nbsp; &nbsp; &nbsp; ";
        let replaceMap = {
            "<" : "&amp;lt;",
            ">" : "&amp;gt;",
            "\t" : singleIndent,
            "    " : singleIndent
        }
        // since StudIP will convert &lt; to an < at the import we want the code which may contains html
        // but our code may contain < brackets which we want to be shown normal, so we need to convert the & as special
        // character an the lt; just as addition:
        // Example:    "&amp;lt;"     -->    "&lt;"    -->  "<"
        let htmlSaveCodeAsString = ExamExportHelper.replaceVariablesInString(codeAsString,replaceMap);

        let codeLines = htmlSaveCodeAsString.split(/\r\n|\r|\n/);
        let amountLines = codeLines.length;

        // Ridiculous if table dont have class content, empty spaces are removed but then the style is changed
        // Using <table class...> wont be replaced in the replaceVariablesInString method somehow ? Just use it converted
        let htmlCode = '&lt;table class="content"&gt;<tbody><tr>';

        // Ridiculous <code> which is for code has an other style but in VIPs <pre> becomes the code style
        let htmlRowLines = "<td>";
        let htmlRowCode = "<td>";
        for(let i=0; i<amountLines; i++){
            let lineNumber = i+1;
            let codeLine = codeLines[i];
            htmlRowLines+= lineNumber;
            htmlRowCode += codeLine;
            if(lineNumber!==amountLines){
                htmlRowLines+="<br/>";
                htmlRowCode+="<br/>";
            }
        }
        htmlRowLines+="</td>";
        htmlRowCode+="</td>";

        htmlCode+=htmlRowLines;
        htmlCode+=htmlRowCode;

        htmlCode+='</tr></tbody></table>';

        console.log(htmlCode);
        return htmlCode;
    }

    static placeHolder_Test_ID = "$VARIABLE_TEST_ID";
    static placeHolder_Type = "$VARIABLE_TYPE";
    static placeHolder_Starttime = "$VARIABLE_START_TIME";
    static placeHolder_Endtime = "$VARIABLE_END_TIME";
    static placeHolder_Duration = "$VARIABLE_DURATION";
    static placeHolder_Title = "$VARIABLE_TITLE";
    static placeholder_Exercises = "$EXERCISES";
    static XMLHeader=
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<test xmlns="urn:vips:test:v1.0" id="'+ExamXMLExport.placeHolder_Test_ID+
        '" type="'+ExamXMLExport.placeHolder_Type+
        '" start="'+ExamXMLExport.placeHolder_Starttime+
        '" end="'+ExamXMLExport.placeHolder_Endtime+
        '" duration="'+ExamXMLExport.placeHolder_Duration+'">\n' +
        '<title> '+ExamXMLExport.placeHolder_Title+'    </title>\n' +
        '<description> </description>\n' +
        '<exercises>' +
        ExamXMLExport.placeholder_Exercises +
        '</exercises>\n' +
        '</test>'

    static getXMLHeader(title, testId, type, startDate,endDate, exercisesXML){
        let luxonStartDate = DateTime.fromISO(startDate);
        let luxonEndDate = DateTime.fromISO(endDate);
        let duration =  luxonEndDate.diff(luxonStartDate, 'minutes').minutes;

        let replaceMap = {
            [ExamXMLExport.placeHolder_Test_ID] : testId,
            [ExamXMLExport.placeHolder_Type] : type,
            [ExamXMLExport.placeHolder_Starttime] : luxonStartDate.toString(),
            [ExamXMLExport.placeHolder_Endtime] : luxonEndDate.toString(),
            [ExamXMLExport.placeHolder_Duration] : duration,
            [ExamXMLExport.placeHolder_Title] : title,
            [ExamXMLExport.placeholder_Exercises] : exercisesXML,
        }
        let xmlTemplate = ExamXMLExport.XMLHeader;
        xmlTemplate = ExamExportHelper.replaceVariablesInString(xmlTemplate,replaceMap);

        return xmlTemplate;
    }

}
