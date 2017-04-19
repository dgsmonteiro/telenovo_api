/**
 * Rota -> Client
 * @desc: rota para acesso a funcionalidades de configuração de ramais.
 */

var path = require('app-root-path');
var express = require('express');
var router = express.Router();
var promise = require("bluebird");
var logger = global.logger;
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var transactionBL = require(path + '/business/app/TransactionBL');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var applicationBL = require(path + '/business/app/ApplicationBL');
var branch_numberBL = require(path + '/business/pbx/client/TrunksClientPbxBL');


/**
 * Obtem lista de grupos cadastrados
 */
router.get('/client/trunks/trunk/list/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.admin, global.applications.pbx_report]);

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
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promiseGetListTrunksByClient(result) {
        log.client_result = result;
        var trunk_bl = new trunkBL();
        return trunk_bl.getListClientTrunksByClientId(req.params.client_id);
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
 * adicionar um novo grupo.
 */
router.post('/client/trunks/trunk/add', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.admin, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promiseGetListGroupsByClient)
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
    function promiseGetListGroupsByClient(result) {
        log.client_result = result;
        var trunk_bl = new trunkBL();
        return trunk_bl.CreateNew(req.body.client_id, req.body.trunks);
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
 * atualiza ramal.
 */
router.put('/client/trunks/trunk/update', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.admin, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPemission)
        .then(promiseGetListGroupsByClient)
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
    function promiseGetListGroupsByClient(result) {
        log.client_result = result;
        var trunk_bl = new trunkBL();
        return trunk_bl.UpdateClientTrunks(req.body.client_id, req.body.trunks, req.headers.user_logged);
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
 * remove ramal.
 */
router.delete('/client/trunks/trunk/delete/:client_id/:trunks', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.admin, global.applications.pbx_report]);

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
    function promiseGetListGroupsByClient(result) {
        log.client_result = result;
        var trunk_bl = new trunkBL();
        return trunk_bl.RemoveTrunk(req.params.client_id, req.params.trunks, req.headers.user_logged);
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


module.exports = router;



