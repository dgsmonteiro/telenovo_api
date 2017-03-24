/**
 * Classe -> PBX Client BranchNumberClientPbxBL
 * @desc: classe para configuração de ramais
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
 * Contrutora da classe de Bloqueio de chamadas
 * @constructor
 */
function BranchNumberClientPbxBL() {

}

/**
 * Obtem lista de ramais de um cliente por id informado.
 * @param $client_id
 * @return {BranchNumberclientPbxModel}
 */
BranchNumberClientPbxBL.prototype.GetListBranchNumberByClientId = function ($client_id) {

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
            result = result.pbx.branch_number;
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
 * gera a senha e ramal
 * @param $client_id
 * @return {BranchNumberclientPbxModel}
 */
BranchNumberClientPbxBL.prototype.GetSequenceBranchGeneratePassword = function ($client_id) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseProcess)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.findById($client_id).exec();
    }

    //retorno de resultado
    function promiseProcess(client) {
        var branch = null;
        var mask = null;
        var branch_list = _.orderBy(client.pbx.branch_number, ['branch'], ['asc']);
        if (branch_list.length > 1) {
            var index = 0;
            _.forEach(branch_list, function (item) {
                if (branch_list.length > index) {
                    var digit_valid = parseInt(branch_list[index + 1].branch.toString()) - parseInt(item.branch.toString())
                    if (digit_valid > 1) {
                        branch = client.central_id.toString() + (index + 2);
                        mask = 5000 + (index + 1);
                        return;
                    } else {
                        branch = parseInt(branch_list[branch_list.length - 1].branch.toString()) + 1
                        mask = parseInt(branch_list[branch_list.length - 1].mask) + 1;
                        return;
                    }
                    index++;
                }
            });
        } else if (branch_list.length == 0) {
            branch = client.central_id.toString() + "01";
        }
        else {
            branch = parseInt(branch_list[branch_list.length - 1].branch) + 1;
        }
        var new_branch = {
            branch: branch,
            password: string_tools.GeneratePassword(8),

        }
        return new_branch;
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
BranchNumberClientPbxBL.prototype.UpdateBranchNumber = function ($client_id, $data, $user_logged) {
    var name = null;
    var branch = null;
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
        branch = _.find(result.pbx.branch_number, {'branch': $data.branch});

        var user = _.find(result.pbx.user, {'user_id': $user_logged});
        if (user.permission != '10') {
            throw new unauthorizedError(global.messages.pbx.client.user_not_pemission);
        }

        name = result.name.split(" ").join("_");
        var file = fs.readFileSync(global.file_paths.server.virtual + "/" + "sip_" + $client_id +
            "_"+ name.toLocaleLowerCase()+ ".conf").toString();
        var init = file.indexOf('[' + $data.branch + ']');
        if(init != -1){
            var end = file.indexOf('accountcode='+ $data.branch);
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
BranchNumberClientPbxBL.prototype.RemoveBranchNumber = function ($client_id, $branch_number, $user_logged) {

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
BranchNumberClientPbxBL.prototype.CreateNew = function ($client_id, $data) {
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
