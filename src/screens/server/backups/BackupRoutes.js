import Route from "react-router-dom/Route";
import {withRouter} from "react-router";
import React from "react";
import BackupIndex from "./BackupIndex";

export default class BackupRoutes {

    static configureRoutes(route){
        let output = [];
        output.push(<Route exact path={route+""} component={withRouter(BackupIndex)} />);
        return output;
    }

}
