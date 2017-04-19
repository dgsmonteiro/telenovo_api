/**
 * Classe -> PBX Client TrunksClientPbxBL
 * @desc: classe para configuração de Grupos de ramais
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var request = require('request-promise');
var fs = require('fs');
// var exec = require('child-process-promise').exec;
var string_tools = require(path + '/business/tools/StringTools');
var clientError = Error.extend('ClientError', 400);
var appError = Error.extend('AppError', 500);
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var deniedError = Error.extend('HttpUnauthorized', 406);
var clone = require('clone');



//models and class
var clientPbxModel = require(path + '/model/pbx/client/ClientPbxModel');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');


/**
 * Contrutora da classe de Grupos de Ramais
 * @constructor
 */
function TrunksClientPbxBL() {

}

/**
 * Obtem lista de grupos de ramais de um cliente por id informado.
 * @param $client_id
 * @return {BranchGroupClientPbxModel}
 */
TrunksClientPbxBL.prototype.getListClientTrunksByClientId = function ($client_id) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.findById($client_id).exec();
    }

    //retorno de resultado
    function promiseResult(result) {
        if (result !== null) {
            result = result.pbx.branch_group;
        }
        return result;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Atualizando dados do ramal
 * @param $client_id
 * @param $data
 * @param $transaction
 * @param $application
 * @returns {Promise|Promise.<TResult>}
 * @constructor
 */
TrunksClientPbxBL.prototype.UpdateClientTrunks = function ($client_id, $data, $user_logged) {
    var name = null;
    var branchGroup = null;
    var client = null;
    return promise.try(promiseGetClient)
        .then(promiseProcessFile)
        .then(promiseCreateBranch)
        .then(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    function promiseGetClient() {
        return clientPbxModel.findById($client_id).exec();
    }


    function promiseProcessFile(result) {
        client = result;
        branchGroup = _.find(result.pbx.queueNumber, {'branchGroup': $data.branchGroup});

        var user = _.find(result.pbx.user, {'user_id': $user_logged});
        if (user.permission != '10') {
            throw new unauthorizedError(global.messages.pbx.client.user_not_pemission);
        }

        name = result.name.split(" ").join("_");
        var file = fs.readFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
            "_"+ name.toLocaleLowerCase()+ ".conf").toString();
        var init = file.indexOf('[' + $data.branchGroup + ']');
        if(init != -1){
            var end = file.indexOf('accountcode='+ $data.branchGroup);
            var aux = file.slice(0, init);
            aux = aux.slice(0, end);
            aux = aux.slice(0, -1);
            fs.writeFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
                "_"+ name.toLocaleLowerCase()+ ".conf", "\n" + aux, {encoding: "utf8"});
        }

        if($data.voicemail != branch.branch){
            if($data.voicemail){
                var voicemail = $data.branch + "=>" + $data.branch + "," + $data.name + "," + $data.email + ",,attach=yes|saycid=yes|envelope=yes|delete=yes;" + $data.branch;
                fs.writeFileSync(global.file_paths.server.virtual + "/" + "voicemail.conf", "\n" + voicemail, {flag: 'a', encoding: "utf8"});
            }else{
                var file_mail = fs.readFileSync(global.file_paths.server.virtual + "/" + "voicemail.conf").toString();
                var init_mail = file_mail.indexOf($data.branch);
                if(init_mail != -1){
                    var end_mail = file_mail.indexOf(';'+$data.branch);
                    var aux_mail = file_mail.slice(0, init_mail);
                    aux_mail = aux_mail.slice(0, end_mail);
                    fs.writeFileSync(global.file_paths.server.virtual + "/" + "voicemail.conf", "\n" + aux_mail, {encoding: "utf8"});
                }
            }
        }
        return;
    }

    function promiseCreateBranch(result) {
        var obj = "["+ $data.branch + "]" + "\n" +
            "callerid=" + $data.name + "<"+ $data.branch +">" + "\n" +
            "defaultuser=" + $data.branch + "\n" +
            "description=" + $data.name + "\n" +
            "deny= 0.0.0.0/0.0.0.0" + "\n" +
            "permit= 0.0.0.0/0.0.promisseProcess0.0" + "\n" +
            "secret=" + $data.password + "\n" +
            "dtmfmode= rfc2833" + "\n" +
            "canreinvite= no" + "\n" +
            "nat= force_rport,comedia" + "\n" +
            "context=" + $data.context + "\n" +
            "host= dynamic" + "\n" +
            "type= friend" + "\n" +
            "port=" + $data.port + "\n" +
            "qualify= 10000" + "\n" +
            "callgroup=" + $data.group_caller + "\n" +
            "pickupgroup=" + $data.group_capture + "\n" +
            "callcounter= yes" + "\n" +
            "faxdetect= no" + "\n" +
            "accountcode=" + $data.branch;
        if(client.pbx.branch_number.length > 1){
            obj = "\n\n" + obj;
        }

        return fs.writeFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
            "_"+ name.toLocaleLowerCase()+ ".conf", obj, {flag: 'a', encoding: "utf8"});
    }

    function promisseProcess(result) {
        return clientPbxModel.findOneAndUpdate(
            {'_id': $client_id, 'pbx.branch_number._id': $data._id},
            {
                $set: {
                    'pbx.branch_number.$': $data,
                }
            },
            {safe: true, upsert: false, new: true}
        ).exec();
    }

    function promiseResult(result_model) {
        if(result_model.pbx.branch_number != undefined){
            return result_model.pbx.branch_number;
        }
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Remove um ramal de cliente
 * @param $client_id
 * @param $branch_number
 * @param $user_id
 * @param $user_logged
 * @param $application
 * @returns {Promise|Promise.<TResult>}
 * @constructor
 */
TrunksClientPbxBL.prototype.RemoveTrunk = function ($client_id, $branch_number, $user_logged) {

    var name = null;
    var client = null;
    return promise.try(promiseGetClient)
        .then(promiseProcessFile)
        .then(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    function promiseGetClient() {
        return clientPbxModel.findById($client_id).exec();
    }


    function promiseProcessFile(result) {
        client = result.toObject();
        name = result.name.split(" ").join("_");


        var file_mail = fs.readFileSync(global.file_paths.server.virtual + "/" + "voicemail.conf").toString();
        var init_mail = file_mail.indexOf($branch_number);
        var end_mail = file_mail.indexOf(';' + $branch_number);
        var aux_mail = file_mail.slice(0, init_mail);
        aux_mail = aux_mail.slice(0, end_mail);
        fs.writeFileSync(global.file_paths.server.virtual + "/" + "voicemail.conf", "\n" + aux_mail, {encoding: "utf8"});


        var file = fs.readFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
            "_"+ name.toLocaleLowerCase()+ ".conf").toString();
        var init = file.indexOf('[' + $branch_number + ']');
        if(init != -1){
            var end = file.indexOf('accountcode='+ $branch_number);
            var aux = file.slice(0, init);
            var aux = aux.slice(0, end);
            var aux = aux.slice(0, -1);
            return fs.writeFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
                "_"+ name.toLocaleLowerCase()+ ".conf", "\n" + aux, {encoding: "utf8"});
        }
        return;
    }

    function promisseProcess(result) {
        var user = _.find(client.pbx.user, {'user_id': $user_logged});
        if (user.permission != '10') {
            throw new unauthorizedError(global.messages.pbx.client.user_not_pemission);
        }
        return clientPbxModel.findByIdAndUpdate(
            {'_id': $client_id},
            {
                $pull: {
                    'pbx.branch_number': {branch: $branch_number},
                }
            },
            {safe: true, upsert: false, new: true}).exec();
    }

    function promiseResult(result_model) {
        if(result_model.pbx.branch_number != undefined){
            return result_model.pbx.branch_number;
        }
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Registra novo ramal em conta de cliente informado.
 * @param $client_id
 * @param $data
 * @param $application
 * @return {ClientPbxModel}
 */
TrunksClientPbxBL.prototype.CreateNew = function ($client_id, $data) {
    var name = null;
    return promise.try(promiseGetClient)
        .then(promiseCreateBranch)
        .then(promiseSaveBranch)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetClient() {
        return clientPbxModel.findById($client_id).exec();
    }

    function promiseCreateBranch(result) {
        name = result.name.split(" ").join("_");
        var obj = "["+ $data.branch + "]" + "\n" +
            "callerid=" + $data.name + "<"+ $data.branch +">" + "\n" +
            "defaultuser=" + $data.branch + "\n" +
            "description=" + $data.name + "\n" +
            "deny= 0.0.0.0/0.0.0.0" + "\n" +
            "permit= 0.0.0.0/0.0.0.0" + "\n" +
            "secret=" + $data.password + "\n" +
            "dtmfmode= rfc2833" + "\n" +
            "canreinvite= no" + "\n" +
            "nat= force_rport,comedia" + "\n" +
            "context=" + $data.context + "\n" +
            "host= dynamic" + "\n" +
            "type= friend" + "\n" +
            "port=" + $data.port + "\n" +
            "qualify= 10000" + "\n" +
            "callgroup=" + $data.group_caller + "\n" +
            "pickupgroup=" + $data.group_capture + "\n" +
            "callcounter= yes" + "\n" +
            "faxdetect= no" + "\n" +
            "accountcode=" + $data.branch;
        if(result.pbx.length >= 1){
            obj = "\n\n" + obj;
        }
        if($data.voicemail){
            var voicemail = $data.branch + "=>" + $data.branch + "," + $data.name + "," + $data.email + ",,attach=yes|saycid=yes|envelope=yes|delete=yes;" + $data.branch;
            fs.writeFileSync(global.file_paths.server.virtual + "/" + "voicemail.conf", "\n" + voicemail, {flag: 'a', encoding: "utf8"});
        }
        return fs.writeFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
            "_"+ name.toLocaleLowerCase()+ ".conf", obj, {flag: 'a', encoding: "utf8"});
    }

    function promiseSaveBranch(result_write) {
        var obj ={
            group_capture : $data.group_capture,
            group_caller : $data.group_caller,
            branch : $data.branch,
            name : $data.name,
            password : $data.password,
            port : $data.port,
            context : $data.context,
            voicemail : $data.voicemail,
            email : $data.email,
        }
        return clientPbxModel.findByIdAndUpdate(
            {'_id': $client_id},
            {$push: {'pbx.branch_number': obj}},
            {safe: true, upsert: true, new: true}).exec()
    }

    function promiseReturn(result_save) {
        return result_save;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


module.exports = BranchNumberClientPbxBL;
