/**
 * Rotas de acesso para funcionalidades da aplicação
 * Cada rota poderá acessa por nivel de aplicação do cliente conforme descriçao:
 *
 * Nivel - Aplicação
 * 0 - Discador
 * 1 - VOIP
 * 2 - 55pbx
 * 3 - CallCenter
 */

var Path = require('app-root-path');

/**
 * Construtor da Classe
 * @constructor
 */
function RouteApp(app) {

}

/**
 * Carrega listagem de rotas da aplicacao
 * @param app
 * @returns {*}
 * @constructor
 */
RouteApp.prototype.Load = function (app) {
    var route = [];


    //inicial
    route['index'] = require(Path + '/routes/index');

    //errors
    route['error'] = require(Path + '/routes/error');

    //app
    route['app_application'] = require(Path + '/routes/app/ApplicationController');

    /*** PBX **/
    route['pbx_user'] = require(Path + '/routes/pbx/UserPbxController');

    //client
    route['pbx_client'] = require(Path + '/routes/pbx/client/ClientPbxController');
    route['pbx_clientuser'] = require(Path + '/routes/pbx/client/UserClientPbxController');
    route['pbx_clientbranchNumber'] = require(Path + '/routes/pbx/client/BranchNumberClientPbxController');


    /*****************
     * CARGA DE ROTAS
     */


    //paginas
    app.use('/', route['index']);

    //app
    app.use('/api', route['app_application']);


    /*** PBX  ***/
    app.use('/api/pbx', route['pbx_user']);




    //client
    app.use('/api/pbx', route['pbx_client']);
    app.use('/api/pbx', route['pbx_clientuser']);
    app.use('/api/pbx', route['pbx_clientbranchNumber']);


    //final
    app.use('/', route['error']);

    return app;
}

module.exports = RouteApp;
