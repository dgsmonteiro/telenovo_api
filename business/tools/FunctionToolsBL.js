/**
 * Classe -> User
 * @desc: classe para manipulação de dados de usuário do sistema PBX.
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var guid = require('node-uuid');
var jwt = require("jsonwebtoken");
var logger = global.logger;
var appError = Error.extend('AppError', 500);
var clientError = Error.extend('ClientError', 400);
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var tokenError = Error.extend('HttpUnauthorized', 417);
var country_tools = require(path + '/library/CountryTools');


/**
 * Contrutora da classe
 * @constructor
 */
function FunctionTools() {

}

/**
 * Obtem lista completa de paises e capitais.
 * @returns [Object]
 */
FunctionTools.prototype.GetCountryList = function () {

    //promise list
    return promise.try(promiseGet)
        .catch(promiseError);

    function promiseGet() {
        return country_tools.GetListAll();

    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}



/**
 * Obtem lista completa de paises com DDI.
 * @returns [Object]
 */
FunctionTools.prototype.GetCountryListWhithPhoneCode = function () {

    //promise list
    return promise.try(promiseGet)
        .catch(promiseError);

    function promiseGet() {
        return country_tools.GetListAllWithPhoneCode();

    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


module.exports = FunctionTools;
