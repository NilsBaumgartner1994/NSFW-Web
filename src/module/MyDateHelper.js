export default class MyDateHelper {

    static checkAndFormatDate(day, month, year){
        let composedDate = new Date(year+"-"+(month)+"-"+day); // but not when we convert it like this

        let valid_date = composedDate.getDate() == day &&
            composedDate.getMonth() == (month-1) && //but then at checking again
            composedDate.getFullYear() == year;
        if(valid_date){
            return composedDate;
        } else {
            return null;
        }
    }
}
