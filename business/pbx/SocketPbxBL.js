/**
 * Classe -> SocketBL
 * @desc: processa chamada de socket para diversos eventos da aplicação pbx
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var logger = global.logger;
var appError = Error.extend('AppError', 500);
var clientError = Error.extend('ClientError', 400);
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var clientPbxBL = require(path + '/business/pbx/client/ClientPbxBL');
var local = null;
var clientPbxModel = require(path + '/model/pbx/client/ClientPbxModel');


/**ClientPbxBL
 * Co ntrutora da classe
 * @constructor
 */
function SocketPbxBL() {
    local = this;
}

/**
 * Envida atualização para socket de login de usuário
 * @param $client_id
 * @param $branch_number
 * @param $date
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.UserLoginEvent = function ($client_id, $branch_number, $date) {

    var client_pbx_bl = new clientPbxBL();
    var call_history_user_client_pbx_bl = new callHistoryUserClientPbxBL();
    var users_logged = [];
    var socket_user = null;

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseSend)
        .then(promiseGetHistory)
        .then(promiseSendHistory)
        .catch(promiseError);

    function promiseUpdate() {
        return client_pbx_bl.UpdateStatusBranchNumber($client_id, $branch_number, $date, "login");
    }

    function promiseSend(result) {
        var list_branch = _.filter(result, {"logged": true});
        var socket_list = _.filter(global.app_socket, {'client_id': $client_id});
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.user.login.event', list_branch);
            users_logged.push(socket_client.user_id);
        });
        return users_logged;
    }

    function promiseGetHistory(result) {
        socket_user = _.find(global.app_socket, {
            'client_id': $client_id,
            'branch_number': $branch_number
        });
        if (socket_user != undefined) {
            return call_history_user_client_pbx_bl.GetLastCallsByUserIdWithLimit(socket_user.user_id, 20);
        } else {
            return [];
        }
    }

    function promiseSendHistory(result) {
        if (socket_user != undefined) {
            socket_user.socket.emit('pbx.user.history.call.event', result);
        }
        return users_logged;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Envida atualização para socket de logou de usuário
 * @param $client_id
 * @param $branch_number
 * @param $date
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.UserLogoutEvent = function ($client_id, $branch_number, $date) {

    return promise.try(promiseUpdate)
        .then(promiseSend)
        .catch(promiseError);

    function promiseUpdate() {
        var client_pbx_bl = new clientPbxBL();
        return client_pbx_bl.UpdateStatusBranchNumber($client_id, $branch_number, $date, "logout");
    }

    function promiseSend(result) {

        var list_branch = _.filter(result, {"logged": true});
        var users_logged = [];
        var socket_list = _.filter(global.app_socket, {'client_id': $client_id});
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.user.login.event', list_branch);
            users_logged.push(socket_client.user_id);
        });
        return users_logged;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Envida atualização para socket de logou de usuário
 * @param $client_id
 * @param $branch_number
 * @param $date
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.UserLoginEventBranch = function ($client_id, $branch_number, $date) {

    var client_pbx_bl = new clientPbxBL()

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseSend)
        .catch(promiseError);

    function promiseUpdate() {
        return client_pbx_bl.UpdateStatusBranchNumber($client_id, $branch_number, $date, "login");
    }

    function promiseSend(result) {
        var users_logged = [];
        var socket_list = _.filter(global.app_socket, {'client_id': $client_id});
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.user.login.event.branch', result);
            users_logged.push(socket_client.user_id);
        });
        return users_logged;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Envida atualização para socket de logou de usuário
 * @param $client_id
 * @param $branch_number
 * @param $date
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.UserLogoutEventBranch = function ($client_id, $branch_number, $date) {

    var client_pbx_bl = new clientPbxBL()

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseSend)
        .catch(promiseError);

    function promiseUpdate() {
        return client_pbx_bl.UpdateStatusBranchNumber($client_id, $branch_number, $date, "logout");
    }

    function promiseSend(result) {
        var users_logged = [];
        var socket_list = _.filter(global.app_socket, {'client_id': $client_id});
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.user.login.event.branch', result);
            users_logged.push(socket_client.user_id);
        });
        return users_logged;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envida atualização para socket do relatório de realtime.
 * @param $client_id
 * @param $report
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.ReportRealtimeEvent = function ($client_id, $report) {

    //promise list
    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend() {
        var socket_list = _.filter(global.app_socket, {
            'client_id': $client_id,
            'app': global.applications.pbx
        });
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.report.realtime.event', $report);
        });
        return true;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Envia atualização para socket do realtime PAUSA.
 * @param $client_id
 * @param $report
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.PauseAgentRealtime = function ($client_id, $branch_number) {

    //promise list
    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend() {
        var socket_list = _.filter(global.app_socket, {
            'client_id': $client_id,
            'app': global.applications.pbx,
            'branch_number': $branch_number
        });

        if(socket_list == undefined || socket_list == null)
            throw new appError(global.messages.pbx.client.branch_number.client_not_found);

        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.report.realtime.pause');
        });
        return true;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Envida atualização para socket do relatório de realtime.
 * @param $client_id
 * @param $report
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.ReportRealtimeEventLog = function ($client_id, $event) {

    //promise list
    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend() {
        var socket_list = _.filter(global.app_socket, {
            'client_id': $client_id,
            'app': global.applications.pbx
        });
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.report.log.event', $event);
        });
        return true;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Envia saldo atualizado
 * @param $client_id
 * @param $balance
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.CurrentBalanceUpdate = function ($client_id, $balance) {

    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend(result) {
        var socket_list = _.filter(global.app_socket, {
            'client_id': $client_id
        });
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.phone.current.balance', $balance);
        });
        return true;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia saldo atualizado
 * @param $client_id
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.SendCurrentBalanceForClient = function ($client_id) {

    //promise list
    return promise.try(promiseGetClient)
        .then(promiseSend)
        .catch(promiseError);


    function promiseGetClient(result) {
        return clientPbxModel.findOne({_id: $client_id}).exec();
    }

    function promiseSend(result) {
        if (result !== null) {
            var socket_list = _.filter(global.app_socket, {
                'client_id': $client_id
            });
            _.forEach(socket_list, function (socket_client) {
                socket_client.socket.emit('pbx.phone.current.balance', result.pbx.current_balance);
            });
            return true;
        }
        else {
            return false;
        }
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia dados da ligação para um ramal via socket
 * @param $client_id
 * @param $call
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.UserNewCallEvent = function ($client_id, $call) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseSend)
        .catch(promiseError);

    function promiseUpdate() {
        var call_history_user_client_pbx_bl = new callHistoryUserClientPbxBL();
        return call_history_user_client_pbx_bl.RegisterNewCall($call);
    }

    function promiseSend(result) {
        var socket_user = _.find(global.app_socket, {
            'client_id': result.client_id,
            'branch_number': result.branch_line_number.toString()
        });

        if (socket_user !== undefined) {
            // logger.info("Nova ligação (" + $call.call_id + ") de ramal: " + result.branch_line_number.toString() + "/ " + socket_user.client_name + " / " + socket_user.user_name);
            result = result.toObject();
            result.webcall = $call.parameter9;
            result.dados = $call.parameter9;
            socket_user.socket.emit('pbx.user.new.call.event', result);
        } else {
            // logger.info("Nova ligação (" + $call.call_id + ") do ramal: " + result.branch_line_number.toString() + " -> Não foi identificado socket do cliente");
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
 * Envia dados da ligação para um ramal via socket
 * @param $client_id
 * @param $call
 * @param $receptive
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.UserUpdateCallEvent = function ($client_id, $call, $receptive) {

    //promise list
    var call_history_user_client_pbx_bl = new callHistoryUserClientPbxBL();
    var branch_number = null;

    return promise.try(promiseUpdate)
        .then(promiseCost)
        .then(promiseSend)
        .then(promiseGetHistory)
        .then(promiseSendHistory)
        .catch(promiseError);

    function promiseUpdate() {
        return call_history_user_client_pbx_bl.UpdateCallByCallId($call);
    }

    function promiseCost(result) {
        if ($receptive) {
            return result;
        } else {
            return call_history_user_client_pbx_bl.UpdateCostCallByCallId($call);
        }
    }

    function promiseSend(result) {
        if (result != null) {
            branch_number = result.branch_line_number.toString();
            var socket_user = _.find(global.app_socket, {
                'client_id': result.client_id,
                'branch_number': result.branch_line_number.toString()
            });
            if (socket_user != undefined) {
                // logger.info("Final de ligação (" + $call.call_id + ") do ramal: " + branch_number + "/ " + socket_user.client_name + " / " + socket_user.user_name);
                socket_user.socket.emit('pbx.user.update.call.event', result);
            }
            else {
                // logger.info("Final de ligação (" + $call.call_id + ") do ramal: " + branch_number + " -> Não foi identificado socket do cliente");
            }
        }
        return result;
    }

    function promiseGetHistory(result) {
        if (result != null) {
            return call_history_user_client_pbx_bl.GetLastCallsByUserIdWithLimit(result.user_id, 20);
        } else {
            return result
        }
    }

    function promiseSendHistory(result) {
        if (result != null) {
            var socket_user = _.find(global.app_socket, {
                'client_id': $client_id,
                'branch_number': branch_number
            });
            if (socket_user != undefined) {
                socket_user.socket.emit('pbx.user.history.call.event', result);
            }
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
 * Repassa $client_id, $call_id para o envio de (endpoint) para cliente
 * @param $client_id
 * @param $call_id
 * @constructor
 */
SocketPbxBL.prototype.SendCallDataForEndPointClient = function ($client_id, $call_id) {
    var call_history_pbx_bl = new callHistoryUserClientPbxBL();
    call_history_pbx_bl.SendCallDataForEndPointClientTwo($client_id, $call_id);
}


/**
 * Envia dados de ligação webcall
 * @param $client_id
 * @param $call_data
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.GetCallInfoWebcall = function ($client_id, $call_data) {

    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend(result) {
        var socket_list = _.filter(global.app_socket_webcall, {
            'client_id': $client_id,
            'phone': $call_data.number
        });
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.phone.webcall.call_id', $call_data);
        });
        return true;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia dados de ligação webcall
 * @param $client_id
 * @param $call_data
 * @returns {Boolean}
 * @constructor
 */
SocketPbxBL.prototype.SendCallInfoToWebcall = function ($client_id, $call_data) {

    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend() {
        var socket_list = _.filter(global.app_socket, {
            'client_id': $client_id,
            'branch_number': $call_data.parameter0
        });
        _.forEach(socket_list, function (socket_client) {
            socket_client.socket.emit('pbx.phone.attended.call', $call_data);
        });
        return true;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}







/**
 * Envia mensagem de bloqueio para cliente
 * @param $client_id
 * @param $call
 * @returns {Promise}
 * @constructor
 */
SocketPbxBL.prototype.SendBalanceMessageForClient = function ($event) {

    //promise list
    return promise.try(promiseSend)
        .catch(promiseError);

    function promiseSend() {
        var socket_user = _.find(global.app_socket, {
            'client_id': $event.client_id,
            'branch_number': $event.number
        });

        if (socket_user !== undefined) {
            logger.info("Mensagem: " + $event.parameter0 + " do ramal: " + $event.number + "/ " + socket_user.client_name + " / " + socket_user.user_name);
            socket_user.socket.emit('pbx.client.account.message', $event);
        } else {
            logger.info("Mensagem: " + $event.call_id + " do ramal: " + $event.number + " -> Não foi identificado socket do cliente");
        }

        return $event;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}





module.exports = SocketPbxBL;
