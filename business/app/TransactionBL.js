/**
 * Classe -> Transaction
 * @desc: classe para manipulação de dados de transações de aplicação.
 */

//imports
var path = require('app-root-path');
var promise = require("bluebird");
var guid = require('node-uuid');
var logger = global.logger;
var appError = Error.extend('AppError', 500);


//models and class
var transactionModel = require(path + '/model/app/TransactionModel');

/**
 * Contrutora da classe de transações
 * @constructor
 */
function TransactionBL() {

}

/**
 * Grava nova transação no banco de dados com base de request de entrada.
 * @param $request
 * @return {TransactionModel}
 */
TransactionBL.prototype.SaveByRequest = function ($request) {

    //promise list
    return promise.try(promiseSaveTransaction)
        .catch(promiseError);

    //salvar dados
    function promiseSaveTransaction() {
        var transaction = {
            type: 'api_request',
            transacao_id: guid.v1(),
            source: $request.ip,
            parameters: JSON.stringify($request.params),
            headers: JSON.stringify($request.headers),
            body: JSON.stringify($request.body),
            service: $request.originalUrl,
            application: $request.headers.app_identifier,
            user: $request.headers.user_logged,
            client: $request.headers.client__logged,
            exception: null,
            response: null,
        };
        var transaction_model = new transactionModel(transaction);
        return transaction_model.save();
    };


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza dados de uma transação já registrada.
 * @param $transaction
 * @return {TransactionModel}
 */
TransactionBL.prototype.UpdateById = function ($transaction) {

    //promise list
    return promise.try(promiseUpdateTransaction)
        .catch(promiseError);

    //retorno de resultado
    function promiseUpdateTransaction() {
        return transactionModel.findByIdAndUpdate($transaction._id, $transaction);
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


module.exports = TransactionBL;
