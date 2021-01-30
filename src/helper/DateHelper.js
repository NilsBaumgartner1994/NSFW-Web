import React, {Component} from "react";
import {DateTime} from "luxon";

export default class DateHelper extends Component {

    static getDateDifferenceInMinutes(start,end){
        if(start != null && end != null){
            let diffMilliseconds = end-start;
            let diffSeconds = diffMilliseconds/1000;
            let diffMinutes = diffSeconds/60;
            diffMinutes = Math.round(diffMinutes); //sometimes this results... 119.9933, we round up or down
            return diffMinutes;
        } else {
            return null;
        }
    }

    static formatDateToGermanString(dateString){
        let javaDate = new Date(dateString);
        let date = DateTime.fromJSDate(javaDate,{ zone: "Europe/Berlin" });
        let format = {month: 'long', day: 'numeric', year: 'numeric'};
        return date.setLocale('de').toLocaleString(format);
    }

    static formatDateToHHMMString(dateString){
        let javaDate = new Date(dateString);
        let date = DateTime.fromJSDate(javaDate,{ zone: "Europe/Berlin" });
        console.log(date);
        console.log(date.toISO());
        //HH is 24 clock; mm is Minutes; MM is Month !
        let formatedDate = date.toFormat('HH:mm');
        console.log(formatedDate);
        return formatedDate;
    }

    static getWeekdaynameByNumber(weekdayNumber){
        //weekdaynumber sunday = 0
        weekdayNumber = weekdayNumber%7+1; //sunday will now be 1
        let februar = 1;
        //1970-feb-1 was a sunday
        let date = new Date(1970, februar, weekdayNumber);
        return DateHelper.getWeekdaynameByDate(date);
    }

    static getWeekdaynameByDate(date){
        return date.toLocaleDateString("default", { weekday: 'long' });
    }

    static getMonthnameByNumber(monthNumber) {
            let date = new Date(1970, monthNumber, 1);
            return DateHelper.getMonthnameByDate(date);
    }

    static getMonthnameByDate(date) {
        let monthName = date.toLocaleString("default", { month: "long" });
        return monthName;
    }

}
