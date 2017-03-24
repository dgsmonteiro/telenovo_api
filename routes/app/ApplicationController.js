/**
 * Rota -> Application
 * @desc: rota para acesso a funcionalidades do módulos de  aplicação.
 */

var path = require('app-root-path');
var express = require('express');
var router = express.Router();
var promise = require("bluebird");
var logger = global.logger;
var transactionBL = require(path + '/business/app/TransactionBL');
var applicationBL = require(path + '/business/app/ApplicationBL');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var transaction_bl = new transactionBL();

/**
 * Obtem dados básico de uma aplicação cadastrada através do domínio informado.
 */
router.get('/application/information/:domain', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseGetApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseGetApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.GetBasicInformationForDomain(req.params.domain);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message};
        return res.status(ex.code).json(message);
    }
})

/**
* Obtem dados lista de aplicação.
*/
router.get('/application/list', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseGetApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseGetApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.GetApplicationList();
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message};
        return res.status(ex.code).json(message);
    }
})

/**
 * Obtem dados lista de aplicação.
 */
router.put('/application/chengeActive', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseChengeActiveApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseChengeActiveApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.PutChengeActiveApplicationList(req.body);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message};
        return res.status(ex.code).json(message);
    }
})

/**
 * Obtem dados lista de aplicação.
 */
router.put('/application/edit', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseEditApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseEditApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.PutEditApplication(req.body);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message};
        return res.status(ex.code).json(message);
    }
})

/**
 * Obtem dados lista de aplicação.
 */
router.post('/application/new', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseNewApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseNewApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.PutNewApplication(req.body);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message};
        return res.status(ex.code).json(message);
    }
})

/**
 * Envia erro para suporte BCR
 */
router.post('/application/error/support', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseChengeActiveApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseChengeActiveApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.CreateBCRTicket(req.body);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message};
        return res.status(ex.code).json(message);
    }
})

/**
 * Obtem dados de uma aplicação através do identifier.
 */
router.get('/application/get/identifier', function (req, res) {

    //log
    var log = null;

    //promise list
    return promise.try(promiseLog)
        .then(promiseGetApplication)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseGetApplication(result) {
        log = result;
        var application_bl = new applicationBL();
        return application_bl.GetApplicationForIdentifier(req.headers.app_identifier);
    };

    //retorno de resultado
    function promiseReturn(result) {
        log.response = result
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    };


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message};
        return res.status(ex.code).json(message);
    }
})

/**
 * Obtem lista de ramais cadastrados
 */
router.get('/application/report/list', function (req, res) {

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
        .then(promiseGetListReportForIdentifier)
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
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.admin);
    }

    //regra de negócio da controller
    function promiseGetListReportForIdentifier(result) {
        log.client_result = result;
        var application_bl = new applicationBL();
        return application_bl.GetListReportForIdentifier(req.headers.app_identifier);
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



