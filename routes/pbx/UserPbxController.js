/**
 * Rota -> User
 * @desc: rota para acesso a funcionalidades do módulos de usuário PBX
 */

var path = require('app-root-path');
var express = require('express');
var router = express.Router();
var promise = require("bluebird");
var transactionBL = require(path + '/business/app/TransactionBL');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var applicationBL = require(path + '/business/app/ApplicationBL');


/**
 * Obtem dados básico de uma aplicação cadastrada através do domínio informado.
 */
router.post('/user/authenticate', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.admin,global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseAuthenticate)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return user_bl.ValidUserAccessApplication(req.headers.app_identifier);
    }

    //regra de negócio da controller
    function promiseAuthenticate(result) {
        log.application_result = result;
        return user_bl.AuthenticateByEmail(req.body.email, req.body.password, log);
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
 * Executa registro de novo usuário no sistema PBX.
 */
router.post('/user/register', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx,global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseAuthenticate)
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
    function promiseAuthenticate(result) {
        log.client_result = result;
        return user_bl.RegiterNewUser(req.body, log);
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
 * Executa alteraçao de senha do usuário informado.
 */
router.put('/user/password/change', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx,global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseChange)
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

    //regra de negócio da controller
    function promiseChange(result) {
        log.client_result = result;
        return user_bl.ChangePassword(req.body.user_id, req.body.password, req.body.new_password, log);
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
 * Executa recuperação de senha do usuário
 */
router.put('/user/password/recovery', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx,global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseChange)
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

    //regra de negócio da controller
    function promiseChange(result) {
        log.application_result = result;
        return user_bl.RecoveryPasswordForEmail(req.body.email, log);
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
 * Alterar dados de perfil do usuário.
 */
router.put('/user/profile/update', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx,global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckClientPemission)
        .then(promiseAuthenticate)
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
    function promiseAuthenticate(result) {
        log.client_result = result;
        return user_bl.UpdateProfileById(req.body.user);
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
 * Altera imagem do perfil do usuário
 */
router.post('/user/profile/image', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx,global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseAuthenticate)
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

    //regra de negócio da controller
    function promiseAuthenticate(result) {
        log.application_result = result;
        return user_bl.SaveNewImageProfileFile(req.body.client_id, req.files.file);
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



