import React, {Component} from "react";

export class NumberHelper extends Component {

    //https://stackoverflow.com/questions/45787459/convert-number-to-alphabet-string-javascript/45787487
   static numToSSColumn(num){
       let s = '', t;

       while (num > 0) {
           t = (num - 1) % 26;
           s = String.fromCharCode(65 + t) + s;
           num = (num - t)/26 | 0;
       }
       return s || undefined;
   }

   static getNumberInString(string){
       let numbersInString = string.match(/\d/g).join("");
       return parseInt(numbersInString);
   }

}
