/**
 * Rota -> Client
 * @desc: Rota para acesso a funcionalidades de gerenciamento dos usuários do cliente.
 */

var path = require('app-root-path');
var express = require('express');
var router = express.Router();
var promise = require("bluebird");
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var transactionBL = require(path + '/business/app/TransactionBL');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var applicationBL = require(path + '/business/app/ApplicationBL');
var userClientPbxBL = require(path + '/business/pbx/client/UserClientPbxBL');

/**
 * Efetua o bloqueio de chamadas para o número selecionado.
 */
router.post('/client/user/add', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseProcess)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        log.application_result = result;
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseProcess(result) {
        log.client_result = result;
        var user_bl = new userClientPbxBL();
        return user_bl.AddNewUser(req.body.client_id, req.body.user, log);
    };
    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }

})

/**
 * Atualiza dados do usuário selecionado
 */
router.put('/client/user/update', function (req, res) {
    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseProcess)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        log.application_result = result;
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseProcess(result) {
        var user_bl = new userClientPbxBL();
        return user_bl.UpdateUserById(req.body.client_id, req.body.user, log.application_result);
    }

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined && ex.code < 600 ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})

/**
 * efetua remoção do usuário selecionado da conta
 */
router.delete('/client/user/delete/:client_id/:user_id', function (req, res) {
    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseProcess)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        log.application_result = result;
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseProcess(result) {
        var user_bl = new userClientPbxBL();
        return user_bl.RemoveClientUserById(req.params.client_id, req.params.user_id, log.application_result);
    };
    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined && ex.code < 600 ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Obtém lista de usuários cadastrados por cliente
 */
router.get('/client/user/list/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promiseGetListUsersByClient)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseGetListUsersByClient(result) {
        log.client_result = result;
        var user_client_bl = new userClientPbxBL();
        return user_client_bl.GetListUsersByClient(req.params.client_id);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Obtem dados de ramal do usuário
 */
router.get('/client/user/branch/number/:client_id/:user_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var user_client_bl = new userClientPbxBL();
        return user_client_bl.GetInfoUserBranchNumber(req.params.client_id, req.params.user_id);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Executa login na central para o ramal
 */
router.get('/client/user/login/central/:branch_number', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    }

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        var user_client_bl = new userClientPbxBL();
        if (global.server.mode == 'production') {
            return user_client_bl.ExecuteLoginBranchNumberInCentral(req.params.branch_number, req.ip, result, log.application_result);
        } else {
            return user_client_bl.ExecuteLoginBranchNumberInCentral(req.params.branch_number, global.server.dev_ip, result, log.application_result);
        }
    }

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    }


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Executa pausa de agente
 */
router.get('/client/user/pause/central/:branch_number/:pause_code', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    }

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        var user_client_bl = new userClientPbxBL();
        return user_client_bl.ExecutePauseBranchNumberInCentral(req.params.branch_number, req.params.pause_code, result, log.application_result);
    }

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    }


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})

/**
 * Executa logout de agente
 */
router.get('/client/user/logout/central/:branch_number/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    }

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        var user_client_bl = new userClientPbxBL();
        return user_client_bl.ExecuteLogoutBranchNumberInCentral(req.params.branch_number, req.params.client_id, log.application_result);
    }

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    }


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Remove pausa de agente
 */
router.get('/client/user/unpause/central/:branch_number/', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    }

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        var user_client_bl = new userClientPbxBL();
        return user_client_bl.RemovePauseBranchNumberInCentral(req.params.branch_number, result, log.application_result);
    }

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    }

    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Executa login na central para o ramal
 */
router.put('/client/user/change/state', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseProcess)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        log.application_result = result;
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseProcess(result) {
        log.client_result = result;
        var user_bl = new userClientPbxBL();
        return user_bl.ChangeStatusUserById(req.body.client_id, req.body.user_id, req.body.state);
    };
    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined && ex.code < 600 ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Obtem dados de acesso de um usuário
 */
router.get('/client/user/history/login/list/:client_id/:user_id', function (req, res) {
    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseProcess)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        log.application_result = result;
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseProcess(result) {
        log.client_result = result;
        var user_bl = new userClientPbxBL();
        return user_bl.GetListHistoryLoginUserClientById(req.params.client_id, req.params.user_id);
    };
    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined && ex.code < 600 ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})


/**
 * Obtém lista de usuários sem ramais atrelados
 */
router.get('/client/user/list/unregistered/branch/number/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promiseGetListUsersByClient)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPemission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseGetListUsersByClient(result) {
        log.client_result = result;
        var user_client_bl = new userClientPbxBL();
        return user_client_bl.GetListUsersByClientNotRegisteredBranchNumber(req.params.client_id);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result;
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message, stack: ex.stack};
        transaction_bl.UpdateById(log);
        return res.status(ex.code != undefined ? ex.code : 500).json({
            transaction_id: log.transacao_id,
            error: ex.message
        });
    }
})
module.exports = router;



