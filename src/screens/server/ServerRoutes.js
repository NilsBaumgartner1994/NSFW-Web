import BackupRoutes from "./backups/BackupRoutes";

export default class ServerRoutes {

    static configureRoutes(route){
        let output = [];
        output = output.concat(BackupRoutes.configureRoutes(route+"/backups"))
        return output;
    }

}
