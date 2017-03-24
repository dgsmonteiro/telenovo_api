/**
 * Rota -> Client
 * @desc: rota para acesso a funcionalidades de gerenciamento de clientes do 55PBX
 * */

var path = require('app-root-path');
var express = require('express');
var router = express.Router();
var promise = require("bluebird");
var applicationBL = require(path + '/business/app/ApplicationBL');
var transactionBL = require(path + '/business/app/TransactionBL');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var clientPbxBL = require(path + '/business/pbx/client/ClientPbxBL');
var clientRegisterPbxBL = require(path + '/business/pbx/client/ClientRegisterPbxBL');


/**
 * Efetua registro de um novo client
 */
router.post('/client/register', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var application_bl = new applicationBL([global.applications.pbx, global.applications.pbx_report]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseClientRegister)
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
    function promiseClientRegister(result) {
        log.application_result = result;
        var client_register_pbx_bl = new clientRegisterPbxBL();
        return client_register_pbx_bl.Register(req.body, log, log.application_result);
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
 * Obtem dados lista de operadoras.
 */
router.get('/client/payment/card/:id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();

    //promise list
    return promise.try(promiseLog)
        .then(promiseGetDefaultCard)
        .then(promiseReturn)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //regra de negócio da controller
    function promiseGetDefaultCard(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetDefaultCard(req.params.id);
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
 * Efetua rgravação de um audio
 */
router.post('/client/upload/audio', function (req, res) {

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
        .then(promiseGetListLicenseByClient)
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
    function promiseGetListLicenseByClient(result) {
        log.client_result = result;
        var client_bl = new clientPbxBL();
        return client_bl.SaveNewAudioFile(req.body.client_id, req.files.file);
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
 * Obtem dados lista de operadoras.
 */
router.get('/client/call/cost/list/:client_id', function (req, res) {


    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    }

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetListCallCostClient(req.params.client_id);
    };

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
 * Atualiza dados da conta do cliente.
 */
router.put('/client/update/account/data', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.UpdateAccountData(req.headers.client_logged, req.body);
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
 * Obtem dados cadastrais da conta
 */
router.get('/client/account/data/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetAccountData(req.params.client_id);
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
 * Obtem dados cadastrais de pagamento da conta
 */
router.get('/client/account/payment/data/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetAccountPaymentData(req.params.client_id);
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
 * Obter lista de licenças
 */
router.get('/client/account/licences/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetAccountLicences(req.params.client_id);
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
 * obtem o plano do client
 */
router.get('/client/plan/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseCheckToken)
        .then(promiseCheckUserPermission)
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
    function promiseCheckUserPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log.client_result = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetPbxPlanClient(req.params.client_id);
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







/**
 * Obter lista de licenças webcall e validação de filas disponiveis
 */
router.get('/client/account/webcall/licenses/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetAccountWebcallLicenses(req.params.client_id);
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
 * Efetua gravação de um audio para musica de espera
 */
router.post('/client/upload/audio/waiting/music', function (req, res) {

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
        .then(promiseGetListLicenseByClient)
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
    function promiseGetListLicenseByClient(result) {
        log.client_result = result;
        var client_bl = new clientPbxBL();
        return client_bl.SaveNewAudioWaitingMusicFile(req.body.client_id, req.files.file, req.body.file_data);
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
 * Obter lista de audios de musica de espera salvos
 */
router.get('/client/audio/waiting/music/:client_id', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.GetAccountWaitingMusics(req.params.client_id);
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
 * remove audio da lista de musica de espera
 */
router.delete('/client/audio/waiting/music/delete/:client_id/:file_name', function (req, res) {

    //log
    var log = null;
    var transaction_bl = new transactionBL();
    var user_bl = new userPbxBL();
    var application_bl = new applicationBL([global.applications.pbx]);


    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPermission)
        .then(promiseCheckToken)
        .then(promiseCheckClientPermission)
        .then(promisseProcess)
        .then(promiseReturn)
        .catch(promiseError);


    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPermission(result) {
        log = result;
        return application_bl.ValidApplicationAccess(req.headers.app_identifier);
    }

    //Valida acesso a aplicação
    function promiseCheckToken(result) {
        log.application_result = result;
        return user_bl.ValidateTokenAccess(req.headers.token);
    }

    //Valida acesso aplicação para o cliente informado e permissão de acesso
    function promiseCheckClientPermission(result) {
        return user_bl.ValidUserAccesClientPermission(req.headers.client_logged, req.headers.user_logged, global.permission.pbx.user);
    }

    //regra de negócio da controller
    function promisseProcess(result) {
        log = result;
        var client_bl = new clientPbxBL();
        return client_bl.RemoveWaitingMusic(req.params.client_id, req.params.file_name);
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






// formulario webphone para suporte

/**
 * Cria novo ticket na zendesk BCR para cliente pelo webphone
 */
router.post('/client/webphone/support/ticket', function (req, res) {

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
        .then(promiseGetListLicenseByClient)
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
    function promiseGetListLicenseByClient(result) {
        log.client_result = result;
        var client_bl = new clientPbxBL();
        return client_bl.ValidClientToOpenZendeskTicketToSupport(req.body.client_id, req.body.user, req.body.form_data);
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



