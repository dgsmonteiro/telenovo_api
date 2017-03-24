/**
 * Classe -> PBX Client
 * @desc: classe para gerenciamento de acesso dos usuários.
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var request = require('request-promise');
var logger = global.logger;
var clientError = Error.extend('ClientError', 400);
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var deniedError = Error.extend('HttpUnauthorized', 406);


//models and class
var clientPbxModel = require(path + '/model/pbx/client/ClientPbxModel');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var socketPbxBL = require(path + '/business/pbx/SocketPbxBL');


/**
 * Contrutora da classe de Gerenciamento de usuários
 * @constructor
 */
function UserClientPbxBL() {

}

/**
 * Envia dados para cadastro de novo usuario
 * @param $client_id
 * @param $data
 * @param $transaction
 * @return {ApplicationModel}
 */
UserClientPbxBL.prototype.AddNewUser = function ($client_id, $new_user, $transaction) {


    var user_pbx_bl = new userPbxBL();


    return promise.try(promiseValid)
        .then(promiseCreateUser)
        .then(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    function promiseValid() {

        if ($new_user.email == null || $new_user.email == undefined || $new_user.email.length == 0) {
            throw new clientError(global.messages.user.email_undefined);
        }
        if ($new_user.name == null || $new_user.name == undefined || $new_user.name.length == 0) {
            throw new clientError(global.messages.user.name_undefined);
        }
        return user_pbx_bl.GetByEmail($new_user.email);
    }


    function promiseCreateUser(result) {

        if (result != null) {
            return result;
        }
        else {
            var user = {
                email: $new_user.email,
                name: $new_user.name,
            }
            return user_pbx_bl.RegiterNewUser(user, $transaction);
        }
    }


    function promisseProcess(result) {
        $new_user.user_id = result._id.toString();
        if ($new_user.permission == undefined || $new_user.permission == null) {
            $new_user.permission = global.permission.pbx.user;
        }
        return clientPbxModel.findOneAndUpdate({'_id': $client_id},
            {
                $push: {
                    'pbx.user': $new_user
                }
            },
            {safe: true, upsert: true, new: true}).exec();
    }

    //retorno de resultado
    function promiseResult(result) {
        if ($new_user.wizard != undefined) {
            return $new_user;
        }
        if (result !== null) {
            result = result.pbx.user;
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza dados do usuario selecionado
 * @param $client_id
 * @param $user
 * @return {BlockedclientPbxModel}
 */
UserClientPbxBL.prototype.UpdateUserById = function ($client_id, $user, $application) {

    var users = null;

    //promise list
    return promise.try(promisseUpdateUserPbx)
        .then(promisseUpdateUserClient)
        .then(promisseUpdateUserBranchClient)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseUpdateUserPbx() {
        if ($user.email == null || $user.email == undefined || $user.email.length == 0) {
            throw new clientError(global.messages.user.email_undefined);
        }
        if ($user.name == null || $user.name == undefined || $user.name.length == 0) {
            throw new clientError(global.messages.user.name_undefined);
        }
        var user_pbx_bl = new userPbxBL();
        return user_pbx_bl.UpdateEmailAndNameById($user.user_id, $user.email, $user.name);
    }

    function promisseUpdateUserClient(result) {
        $user.updatedAt = new Date();
        return clientPbxModel.findOneAndUpdate(
            {'_id': $client_id, 'pbx.user.user_id': $user.user_id},
            {
                $set: {
                    'pbx.user.$': $user,
                }
            },
            {safe: true, upsert: false, new: true}
        ).exec();
    }


    function promisseUpdateUserBranchClient(result) {
        users = result.pbx.user;
        return clientPbxModel.findOneAndUpdate(
            {'_id': $client_id, 'pbx.branch_number.user_id': $user.user_id},
            {
                $set: {
                    'pbx.branch_number.$.name': $user.name,
                    'pbx.branch_number.$.email': $user.email
                }
            },
            {safe: true, upsert: false, new: true}
        ).exec();
    }


    //retorno de resultado
    function promiseResult(result) {
        if (result !== null) {
            var branch_number = _.find(result.pbx.branch_number, {user_id: $user.user_id})
            if (branch_number != undefined) {
                var central_ramal = {
                    id_cliente: result.central_id,
                    ramal: branch_number.number,
                    senha: branch_number.password,
                    mascara: branch_number.mask,
                    nome: $user.name,
                    tipo_fone: branch_number.mode_type_name,
                }


                var api_central_address = _.find($application.settings.api_central, {'name': result.api_central});
                request({
                    url: api_central_address.address + global.pbx_central.put_branch_number_update,
                    method: 'PUT',
                    json: central_ramal,
                    responseType: 'json',
                    timeout: 60000,
                    rejectUnauthorized: false,
                    requestCert: true,
                    headers: {
                        Accept: 'application/json, text/plain, */*',
                        app_identifier: global.pbx_central.app_identifier,
                        app_key: global.pbx_central.app_key,
                    }
                });
            }
            result = result.pbx.user;
        }
        else {
            result = users;
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
 * Reveme um usuário da conta de cliente
 * @param $client_id
 * @param $user
 * @return {userclientPbxModel}
 */
UserClientPbxBL.prototype.RemoveClientUserById = function ($client_id, $user_id, $application) {

    var client = null;

    //promise list
    return promise.try(promisseProcess)
        .then(promiseGetClient)
        .then(promisseRemoveBranch)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.update(
            {'_id': $client_id, 'pbx.user.user_id': $user_id},
            {
                $pull: {
                    'pbx.user': {user_id: $user_id},
                }
            },
            {safe: true, upsert: false, new: true}).exec();
    }

    function promiseGetClient(result) {
        return clientPbxModel.findById($client_id).exec();
    }


    function promisseRemoveBranch(result) {
        client = result;
        var branch_number = _.find(client.pbx.branch_number, {user_id: $user_id});
        if (branch_number != undefined) {
            clientPbxModel.update(
                {'_id': $client_id, 'pbx.branch_number.number': branch_number.number},
                {
                    $pull: {
                        'pbx.branch_number': {number: branch_number.number},
                    }
                },
                {safe: true, upsert: false, new: true}).exec();

            var api_central_address = _.find($application.settings.api_central, {'name': client.api_central});
            request({
                url: api_central_address.address + global.pbx_central.put_branch_number_delete + "/" + client.central_id + "/" + branch_number.number,
                method: 'DELETE',
                responseType: 'json',
                timeout: 60000,
                rejectUnauthorized: false,
                requestCert: true,
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    app_identifier: global.pbx_central.app_identifier,
                    app_key: global.pbx_central.app_key,
                }
            });
        }

        return client;
    }


    function promiseResult(result) {
        return result.pbx.user;
    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem lista de usuários cadastrados por cliente
 * @param $client_id
 * @return {userclientPbxModel}
 */
UserClientPbxBL.prototype.GetListUsersByClient = function ($client_id) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.findOne({'_id': $client_id}).exec();
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result !== null) {
            result = result.pbx.user;
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem dados de ramal de um usuário registrado em um cliente.
 * @param $client_id
 * @param $user_id
 * @returns {*}
 * @constructor
 */
UserClientPbxBL.prototype.GetInfoUserBranchNumber = function ($client_id, $user_id) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.findOne({'_id': $client_id}).exec();
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.client.not_found);
        }
        var client = result;
        var user = _.find(client.pbx.user, {'user_id': $user_id});
        if (user == undefined) {
            throw new notFoundError(global.messages.user.client_not_found);
        } else {
            var branch_number = _.find(client.pbx.branch_number, {'user_id': $user_id});
            if (branch_number == undefined) {
                throw new notFoundError(global.messages.user.branch_not_found);
            } else if (!branch_number.active) {
                throw new deniedError(global.messages.user.branch_suspended);
            } else {
                if (branch_number.mode_ip) {
                    throw new deniedError(global.messages.user.branch_mode_ip);
                } else {
                    var response = {
                        branch_number: branch_number,
                        balance: client.pbx.current_balance
                    }
                    return response;
                }
            }
        }
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Excecuta na central do PBX o login do ramal informado.
 * @param $branch_number
 * @param $ip
 * @returns {*}
 * @constructor
 */
UserClientPbxBL.prototype.ExecuteLoginBranchNumberInCentral = function ($branch_number, $ip, $client, $application) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {

        var api_central_address = _.find($application.settings.api_central, {'name': $client.api_central});

        return request({
            url: api_central_address.address + global.pbx_central.get_branch_number_login + "/" + $branch_number + "/" + $ip,
            method: 'GET',
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            },
        });
    };

    //retorno de resultado
    function promiseResult(result) {
        if (!result) {
            throw new appError(global.messages.pbx.client.branch_login_error);
        } else {
            return true
        }
    };

    //tratamento de erro
    function promiseError(ex) {
        global.global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Excecuta na central do PBX o logout do ramal informado.
 * @param $client_id
 * @param $branch_number
 * @returns {*}
 * @constructor
 */
UserClientPbxBL.prototype.ExecuteLogoutBranchNumberInCentral = function ($client_id, $branch_number, $application) {

    var client = null;
    return promise.try(promisseGetClient)
        .then(promisseProcess)
        .then(promisseLogout)
        .then(promiseResult)
        // .then(promiseResultMonitor)
        .catch(promiseError);


    function promisseGetClient() {
        return clientPbxModel.findById($client_id);
    }

    function promisseProcess(result) {
        client = result;
        var branch_client = _.find(result.pbx.branch_number, {number: $branch_number});
        if (branch_client.status == 'pausa') {

            var api_central_address = _.find($application.settings.api_central, {'name': result.api_central});
            return request({
                url: api_central_address.address + global.pbx_central.get_branch_number_unpause + "/" + $branch_number,
                method: 'GET',
                responseType: 'json',
                timeout: 60000,
                rejectUnauthorized: false,
                requestCert: true,
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    app_identifier: global.pbx_central.app_identifier,
                    app_key: global.pbx_central.app_key,
                }
            });
        } else {
            return null
        }
    }


    function promisseLogout(result) {
        var api_central_address = _.find($application.settings.api_central, {'name': client.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.get_branch_number_logout + "/" + $branch_number,
            method: 'GET',
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            },
        });
    };


    function promiseResult(result) {
        if (!result) {
            throw new appError(global.messages.pbx.client.branch_login_error);
        } else {
            return true
        }
    };

    /*function promiseResultMonitor(result) {
     if($pause_code == 16) {
     if(result == undefined || result == null)
     throw new appError(global.messages.pbx.client.branch_number.client_not_found);

     result = result.toObject();
     var socket_pbx_bl = new socketPbxBL();
     socket_pbx_bl.PauseAgentRealtime(result._id.toString(), $branch_number);

     return true;
     } else {
     return result;
     }
     }
     */
    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Excecuta na central do PBX pausa do ramal informado.
 * @param $branch_number
 * @param $pause_code
 * @returns {*}
 * @constructor
 */
UserClientPbxBL.prototype.ExecutePauseBranchNumberInCentral = function ($branch_number, $pause_code, $client, $application) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .then(promiseGetClient)
        .then(promiseResultMonitor)
        .catch(promiseError);

    //processamento
    function promisseProcess() {

        var api_central_address = _.find($application.settings.api_central, {'name': $client.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.get_branch_number_pause + "/" + $branch_number + "/" + $pause_code,
            method: 'GET',
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            },
        });
    };

    //retorno de resultado
    function promiseResult(result) {
        if (!result) {
            throw new appError(global.messages.pbx.client.branch_login_error);
        } else {
            return true;
        }
    };

    function promiseGetClient(result) {
        if ($pause_code == 16) {
            var key = {'pbx.branch_number.number': $branch_number};
            return clientPbxModel.findOne(key).exec();
        } else {
            return result;
        }
    }

    function promiseResultMonitor(result) {
        if ($pause_code == 16) {
            if (result == undefined || result == null)
                throw new appError(global.messages.pbx.client.branch_number.client_not_found);

            result = result.toObject();
            var socket_pbx_bl = new socketPbxBL();
            socket_pbx_bl.PauseAgentRealtime(result._id.toString(), $branch_number);

            return true;
        } else {
            return result;
        }
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Remove na central do PBX pausa do ramal informado.
 * @param $branch_number
 * @returns {*}
 * @constructor
 */
UserClientPbxBL.prototype.RemovePauseBranchNumberInCentral = function ($branch_number, $client, $application) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {

        var api_central_address = _.find($application.settings.api_central, {'name': $client.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.get_branch_number_unpause + "/" + $branch_number,
            method: 'GET',
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            },
        });
    };

    //retorno de resultado
    function promiseResult(result) {
        if (!result) {
            throw new appError(global.messages.pbx.client.branch_login_error);
        } else {
            return true
        }
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza status de um usuário conforme informado
 * @param $client_id
 * @param $user_id
 * @param $state
 * @return {BlockedclientPbxModel}
 */
UserClientPbxBL.prototype.ChangeStatusUserById = function ($client_id, $user_id, $state) {

    //promise list
    return promise.try(promisseUpdateUserClient)
        .then(promiseResult)
        .catch(promiseError);

    function promisseUpdateUserClient(result) {
        return clientPbxModel.findOneAndUpdate(
            {'_id': $client_id, 'pbx.user.user_id': $user_id},
            {
                $set: {
                    'pbx.user.$.active': $state,
                }
            },
            {safe: true, upsert: false, new: true}).exec();
    }


    //retorno de resultado
    function promiseResult(result) {
        if (result !== null) {
            result = result.pbx.user;
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
 * Obtem lista de acesso de um usuário.
 * @param $client_id
 * @return {userclientPbxModel}
 */
UserClientPbxBL.prototype.GetListHistoryLoginUserClientById = function ($client_id, $user_id) {

    //promise list
    return promise.try(promisseProcess)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        var user_history_login_bl = new userHistoryLoginPbxBL();
        return user_history_login_bl.GetListLoginByClientIdAndUserId($client_id, $user_id);
    };


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem lista de usuários por cliente que não estão registrados em ramais
 * @param $client_id
 * @return {userclientPbxModel}
 */
UserClientPbxBL.prototype.GetListUsersByClientNotRegisteredBranchNumber = function ($client_id) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.findOne({'_id': $client_id}).exec();
    };

    //retorno de resultado
    function promiseResult(result) {
        var users = [];
        if (result !== null) {
            result = result.toObject();
            _.forEach(result.pbx.user, function (item) {
                var exist = _.some(result.pbx.branch_number, {'user_id': item.user_id});
                if (!exist) {
                    users.push(item)
                }
            })
        }
        return users;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


module.exports = UserClientPbxBL;

