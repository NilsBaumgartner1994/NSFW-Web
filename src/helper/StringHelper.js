import React, {Component} from "react";

export class StringHelper extends Component {

   //https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
    static occurrences(string, subString, allowOverlapping=true) {
        string += "";
        subString += "";
        if (subString.length <= 0) return (string.length + 1);

        let n = 0,
            pos = 0,
            step = allowOverlapping ? 1 : subString.length;

        while (true) {
            pos = string.indexOf(subString, pos);
            if (pos >= 0) {
                ++n;
                pos += step;
            } else break;
        }
        return n;
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static getAmountChars(amount, char){
        console.log("getAmountChars("+amount+", '"+char+"')");
        return Array(amount).join(char);
    }

    static pad(num, size, paddingChar) {
        let s = num + "";
        while (s.length < size) s = paddingChar + s;
        return s;
    }

}
