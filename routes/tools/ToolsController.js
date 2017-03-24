/**
 * Rota -> Tools
 * @desc: rota para acesso a funcionalidades de ferramentas gerais da API.
 */

var path = require('app-root-path');
var express = require('express');
var router = express.Router();
var promise = require("bluebird");
var transactionBL = require(path + '/business/app/TransactionBL');
var transaction_bl = new transactionBL();
var applicationBL = require(path + '/business/app/ApplicationBL');
var functionToolsBL = require(path + '/business/tools/FunctionToolsBL');


/**
 * Obtem uma lista de paises.
 */
router.get('/country/list/phone', function (req, res) {

    //log
    var log = null;
    var application_bl = new applicationBL();

    //promise list
    return promise.try(promiseLog)
        .then(promiseCheckAplicationPemission)
        .then(promiseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //Grava log de transação
    function promiseLog() {
        return transaction_bl.SaveByRequest(req);
    };

    //Valida acesso a aplicação
    function promiseCheckAplicationPemission(result) {
        log = result;
        return application_bl.ValiBasicApplicationAccess(req.headers.app_identifier);
    }

    //cadastra um novo cliente
    function promiseProcess(result) {
        log.application_result = result;
        var function_tools_bl = new functionToolsBL();
        return function_tools_bl.GetCountryListWhithPhoneCode();
    }

    //retorno de resultado
    function promiseResult(result) {
        log = result;
        transaction_bl.UpdateById(log);
        return res.status(200).json(result);
    }


    //tratamento de erro
    function promiseError(ex) {
        log.exception = {error: ex.message.message, stack: ex.message.stack};
        transaction_bl.UpdateById(log);
        var message = {transaction_id: log.transacao_id, error: ex.message.message !== undefined ? ex.message.message : ex.message};
        return res.status(ex.code).json(message);
    }
})


module.exports = router;



