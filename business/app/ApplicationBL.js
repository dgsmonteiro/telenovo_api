/**
 * Classe -> Application
 * @desc: classe para manipulação de dados de aplicações.
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var appError = Error.extend('AppError', 500);
var logger = global.logger;
var request = require('request-promise');
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);


//models and class
var applicationModel = require(path + '/model/app/ApplicationModel');
var _application_name_registred = [];

/**
 * Contrutora da classe de aplicações
 * @constructor
 */
function ApplicationBL() {

}

/**
 * Construtor com recebimento de lista de nome de apps
 * @param list_app_name
 * @constructor
 */
function ApplicationBL(list_app_name) {
    _application_name_registred = list_app_name;
}


/**
 * Obtem informações básicas de uma applicação com base no dominio informado.
 * @param $domain
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.GetBasicInformationForDomain = function ($domain) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return applicationModel.findOne({'hosts': $domain}).exec();
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        result = result.toObject();
        var settings = result.settings;
        _.unset(result, ['email_settings']);
        _.unset(result, ['hosts']);
        _.unset(result, ['create_at']);
        _.unset(result, ['update_at']);
        _.unset(result, ['settings']);
        result.version_history = _.orderBy(result.version_history, ['date'], ['desc'])[0];
        result.settings = {
            iugu_id: settings.iugu !== undefined ? settings.iugu.id_account : null,
            terms: settings.terms,
            payment: settings.payment,
            phone: settings.phone,
            sip: settings.sip,
            wizard: settings.wizard,
            ddd_list: settings.pbx.ddd,
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem dados de uma aplicação por identificador informado.
 * @param $identifier
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.GetApplicationForIdentifier = function ($identifier) {

    //promise list
    return promise.try(promisseProcess)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return applicationModel.findOne({'identifier': $identifier}).exec();
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem a lista de report
 * @param $identifier
 * @return {applicationPbxModel}
 */
ApplicationBL.prototype.GetListReportForIdentifier = function ($identifier) {

    return promise.try(promisseProcess)
        .then(promiseGetQueue)
        .then(promiseResult)
        .catch(promiseError);

    function promisseProcess() {
        return applicationModel.findOne({'identifier': $identifier}).exec()
    }

    function promiseGetQueue(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }

        result = result.toObject();

        return result.settings.reports;
    }

    function promiseResult(result) {
        return result;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Autentica autorização de aplicação para acesso a recursos do sistema sem validação de aplicação por classe especifica.
 * @param $app_identifier
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.ValiBasicApplicationAccess = function ($app_identifier) {

    //promise list
    return promise.try(promiseGetApplication)
        .then(promiseValidate)
        .catch(promiseError);

    function promiseGetApplication() {
        if ($app_identifier == null || $app_identifier == undefined || $app_identifier.length == 0) {
            throw new unauthorizedError(global.messages.application.undefined);
        }
        return applicationModel.findOne({'identifier': $app_identifier}).exec();
    };


    function promiseValidate(result) {
        if (result === null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        if (!result.active) {
            throw new unauthorizedError(global.messages.application.not_active);
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
 * Autentica autorização de aplicação para acesso a recursos do sistema
 * @param $app_identifier
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.ValidApplicationAccess = function ($app_identifier) {
    //promise list
    return promise.try(promiseGetApplication)
        .then(promiseValidate)
        .catch(promiseError);

    function promiseGetApplication() {
        if ($app_identifier == null || $app_identifier == undefined || $app_identifier.length == 0) {
            throw new unauthorizedError(global.messages.application.undefined);
        }
        if (_application_name_registred == undefined || _application_name_registred.indexOf($app_identifier) == -1) {
            throw new unauthorizedError(global.messages.default.app_not_permission);
        }
        return applicationModel.findOne({'identifier': $app_identifier}).exec();
    };


    function promiseValidate(result) {
        if (result === null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        if (!result.active) {
            throw new unauthorizedError(global.messages.application.not_active);
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
 *
 * Obtem dados lista de aplicação.
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.GetApplicationList = function () {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return applicationModel.find().exec();
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 *
 * artiva e desativa aplicação.
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.PutChengeActiveApplicationList = function ($app) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return applicationModel.findOneAndUpdate(
            {'_id': $app._id},
            {$set: {'active': $app.active}},
            {safe: true, upsert: true}
        ).exec()
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 *
 * Editar Aplicação.
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.PutEditApplication = function ($app) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return applicationModel.findOneAndUpdate(
            {'_id': $app._id},
            {$set: $app},
            {safe: true, upsert: true}
        ).exec()
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 *
 * Editar Aplicação.
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.PutNewApplication = function ($app) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        var app = new applicationModel($app);
        return app.save();
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 *
 * artiva e desativa aplicação.
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.CreateBCRTicket = function ($ticket) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        var req_email = $ticket.user_email == null ? "system@55pbx.com" : $ticket.user_email;
        var json = {
            "subject": "Erro (" + $ticket.code + ") 55PBX",
            "comment": {
                "body": "client_id: " + $ticket.client_id +
                "\n client_name: " + $ticket.client_name +
                "\n código de erro: " + $ticket.code +
                "\n transaction_id: " + $ticket.transaction_id +
                "\n mensagem: " + $ticket.message +
                "\n dominio: " + $ticket.domain,
                "public": false
            },
            "requester": {"email": req_email}
        };
        var ticket = {ticket: json};
        return request({
            'uri': 'https://bcrsrv.zendesk.com/api/v2/tickets.json',
            'method': 'POST',
            'json': ticket,
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'Basic ' + new Buffer('system@55pbx.com' + ':' + '1041@Plex').toString('base64')
            }
        });
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Adiciona nova versão da Aplicação.
 * @params $data, $application
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.PostNewVersionApplication = function ($data, $app) {

    //promise list
    return promise.try(promisseGetApp)
        .then(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);


    function promisseGetApp() {
        return ApplicationBL.prototype.GetApplicationForIdentifier($app);
    }

    //processamento
    function promisseProcess(result) {

        var version_history = $data;

        return applicationModel.findOneAndUpdate(
            {'_id': result._id},
            {$push: {'version_history': version_history}},
            {safe: true, upsert: true, new: true}
        ).exec();
    };


    //retorno de resultado
    function promiseResult(result) {
        if (result == null) {
            throw new notFoundError(global.messages.application.not_found);
        }
        return result;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem nome/id/identifcador das aplicações.
 * @param
 * @return {ApplicationModel}
 */
ApplicationBL.prototype.GetApplicationsListParams = function () {

    //promise list
    return promise.try(promisseGetApplications)
        .try(promisseProcess)
        .catch(promiseError);

    //getAplications
    function promisseGetApplications() {
        return applicationModel.find();
    };

    //processamento
    function promisseProcess(result) {
        var applications = [];

        _.forEach(result, function (app) {
            applications.name = app.name;
            applications.id = app.id;
            applications.identifier = app.identifier;
        });

        return applications;
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Executa atualização de uma versão
 * @param $data
 * @return {applicationPbxModel}
 */
ApplicationBL.prototype.UpdateVersion = function ($data) {

    return promise.try(promiseUpdateVersion)
        .catch(promiseError);

    function promiseUpdateVersion(result) {

        return applicationModel.findOneAndUpdate(
            {'_id': $data.app_id, 'version_history._id': $data._id},
            {
                $set: {'version_history.$': $data}
            },
            {safe: true, upsert: true, new: true}
        ).exec();
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/***
 * Envia para o suporte de desenvolvimento o erro
 * @param $file
 * @param $exception
 * @returns {Promise|Promise.<T>}
 * @constructor
 */
ApplicationBL.prototype.SendMessageToDevelopmentSupport = function ($application, $file, $exception) {

    return promise.try(promiseprocess)
        .catch(promiseError);

    function promiseprocess() {
        var subject = "Erro na aplicação: " + $application.name;
        var text = "<p>Data: <strong>" + new Date().toISOString() + "</strong></p>" +
            "</br><p>Arquivo: <strong>" + $file + "</strong></p>" +
            "</br><p>Erro: <strong>" + $exception.message + "</strong></p>" +
            "</br><p>Stack: <strong>" + $exception.stack + "</strong></p>";

        _.forEach($application.settings.email_alerts.dev, function (email_address) {
            var email = {
                user: $application.email_settings.user,
                password: $application.email_settings.password,
                smtp: $application.email_settings.smtp,
                ssl: $application.email_settings.ssl,
                port: $application.email_settings.port,
                template_path: $application.email_settings.template_path,
                recipient: email_address,
                subject: subject,
                text: text
            }
            sendmail.Send(email);
        });
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


module.exports = ApplicationBL;
