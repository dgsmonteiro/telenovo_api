/**
 * Classe -> PBX Client
 * @desc: classe para gerenciamento de clientes do sistema.
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var logger = global.logger;
var request = require('request-promise');
var appError = Error.extend('AppError', 500);
var clientError = Error.extend('ClientError', 400);
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var Guid = require('node-uuid');
var fs = require('fs');
var fsp = require('fs-promise');
var formatCurrency = require('format-currency');
var clone = require('clone');
var local = null;
var applicationBL = require(path + '/business/app/ApplicationBL');
var clientPbxModel = require(path + '/model/pbx/client/ClientPbxModel');
var branchNumberClientPbxBL = require(path + '/business/pbx/client/BranchNumberClientPbxBL');

/**
 * Contrutora da classe de Gerenciamento de Clintes
 * @constructor
 */
function ClientPbxBL() {
    local = this;
}

/**
 * Obtem dados de um cliente PBX por ID informado.
 * @param $id
 * @return {clientPbxModel}
 */
ClientPbxBL.prototype.GetClientById = function ($id) {

    //promise list
    return promise.try(promiseGetClient)
        .catch(promiseError);

    //processamento
    function promiseGetClient() {
        return clientPbxModel.findById($id).exec();
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem dados de um cliente PBX por central_id informado.
 * @param $id
 * @return {clientPbxModel}
 */
ClientPbxBL.prototype.GetClientByCentralId = function ($id) {

    //promise list
    return promise.try(promiseGetClient)
        .catch(promiseError);

    //processamento
    function promiseGetClient() {
        return clientPbxModel.findOne({'central_id': $id}).exec();
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem dados de um cliente PBX por e-mail informado.
 * @param $email
 * @return {clientPbxModel}
 */
ClientPbxBL.prototype.GetClientByEmail = function ($email) {

    //promise list
    return promise.try(promiseGetClient)
        .catch(promiseError);

    //processamento
    function promiseGetClient() {
        var key = {email: $email};
        return clientPbxModel.findOne(key).exec();
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem dados de um cliente por documento do cliente
 * @param $document
 * @return {clientPbxModel}
 */
ClientPbxBL.prototype.GetClientByDocument = function ($document) {


    return promise.try(promiseGetClient)
        .catch(promiseError);

    function promiseGetClient() {
        var key = {document: $document};
        return clientPbxModel.findOne(key).exec();
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem uma lista de todos os clientes ativos para um usuário Id informado.
 * @param $user_id
 * @return {clientPbxModel}
 */
ClientPbxBL.prototype.GetListActiveClientByUserId = function ($user_id) {

    //promise list
    return promise.try(promiseGetClient)
        .catch(promiseError);

    //processamento
    function promiseGetClient() {
        var update_key = {
            "active": true,
            "pbx.user.user_id": $user_id,
            "pbx.user.active": true
        };
        return clientPbxModel.find(update_key).exec();
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem o cartão de credito atualmente ativo e definido como default
 * @return {clientPbxModel}
 */
ClientPbxBL.prototype.GetDefaultCard = function ($client_id) {

    //promise list
    return promise.try(promiseGetOrder)
        .then(promiseResponseOrder)
        .catch(promiseError);

    function promiseGetOrder() {
        return clientPbxModel.findById($client_id).exec()
    };

    function promiseResponseOrder(response) {
        var aux = response.toObject();
        return aux.payment_data
    };

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza status de login de um ramal conforme o tipo (login ou logout).
 * @param $client_id
 * @param $branch_number
 * @param $date
 * @param $type
 * @returns {Promise}
 * @constructor
 */
ClientPbxBL.prototype.UpdateStatusBranchNumber = function ($client_id, $branch_number, $date, $type) {

    //promise list
    return promise.try(promiseGetOrder)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetOrder() {
        var update = null;
        var key = {
            '_id': $client_id,
            'pbx.branch_number.number': $branch_number
        };
        if ($type == 'login') {
            update = {
                '$set': {
                    'pbx.branch_number.$.logged': true,
                    'pbx.branch_number.$.logged_last_login': $date
                }
            };
        } else {
            update = {
                '$set': {
                    'pbx.branch_number.$.logged': false,
                    'pbx.branch_number.$.logged_last_logout': $date
                }
            };
        }

        var options = {
            new: true
        };

        return clientPbxModel.findOneAndUpdate(key, update, options).exec()
    }

    function promiseReturn(result) {
        var response = [];
        _.forEach(result.pbx.branch_number, function (item) {
            response.push({
                number: item.number,
                mask: item.mask,
                user_name: item.user_name,
                agent: item.agent,
                logged: item.logged,
                logged_last_logout: item.logged_last_logout,
                logged_last_login: item.logged_last_login,
            });
        });
        return response;
    }

//tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza status de login de um ramal conforme o tipo (login ou logout).
 * @param $client_id
 * @param $branch_number
 * @param $date
 * @param $type
 * @returns {Promise}
 * @constructor
 */
ClientPbxBL.prototype.UpdateStatusBranchNumber = function ($client_id, $branch_number, $date, $type) {

    //promise list
    return promise.try(promiseGetOrder)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetOrder() {
        var update = null;
        var key = {
            '_id': $client_id,
            'pbx.branch_number.number': $branch_number
        };
        if ($type == 'login') {
            update = {
                '$set': {
                    'pbx.branch_number.$.logged': true,
                    'pbx.branch_number.$.logged_last_login': $date,
                    'pbx.branch_number.$.status': 'logado'
                }
            };
        } else {
            update = {
                '$set': {
                    'pbx.branch_number.$.logged': false,
                    'pbx.branch_number.$.logged_last_logout': $date,
                    'pbx.branch_number.$.status': 'desconectado'
                }
            };
        }

        var options = {
            new: true
        };

        return clientPbxModel.findOneAndUpdate(key, update, options).exec()
    }

    function promiseReturn(result) {
        var response = [];
        _.forEach(result.pbx.branch_number, function (item) {
            response.push({
                name: item.name,
                department: item.department,
                number: item.number,
                mask: item.mask,
                user_name: item.user_name,
                agent: item.agent,
                logged: item.logged,
                logged_last_logout: item.logged_last_logout,
                logged_last_login: item.logged_last_login,
            });
        })
        return response;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Gravar arquivo de audio
 * @param $client_id
 * @param $file
 * @returns {Promise}
 * @constructor
 */
ClientPbxBL.prototype.SaveNewAudioFile = function ($client_id, $file) {
    //promise list
    var new_file_name = null;
    var new_file = null;
    return promise.try(promiseUploadFile)
        .then(promiseUploadFileLinux)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUploadFile() {
        if (!fs.existsSync(global.file_paths.server.path_file)) {
            fs.mkdirSync(global.file_paths.server.path_file);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_ura)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_ura);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_ura + "/" + $client_id)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_ura + "/" + $client_id);
        }


        var date = new Date();
        new_file_name = Guid.v4() + "_" + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + ".mp3";
        new_file = global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_ura + "/" + $client_id + "/" + new_file_name;
        return fsp.copy($file.path, new_file);
    }

    function promiseUploadFileLinux(new_file_result) {
        return fs.chmod(new_file, 0755);

    }

    function promiseReturn(new_file_result_linux) {
        //fs.chown(new_file, 'www-data');
        return result = {
            client_id: $client_id,
            file_name: new_file_name,
            file_url: global.file_paths.server.url_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_ura + "/" + $client_id + "/" + new_file_name
        }

    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }

}


/**
 * Obtem lista de valores de tarifas
 * @param $client_id
 * @return {ClientPbxModel}
 */
ClientPbxBL.prototype.GetListCallCostClient = function ($client_id) {

    //promise list
    return promise.try(promisseProcess)
        .then(promiseResult)
        .catch(promiseError);

    //processamento
    function promisseProcess() {
        return clientPbxModel.findOne({'_id': $client_id}).exec();
    };

    //retorno de resultado
    function promiseResult(result) {
        if (result !== null) {
            var prices = {
                call_cost: result.pbx.call_cost,
                plan: result.pbx.plan.services
            };
            result = prices;
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
 * Atualiza dados de plano para cliente que não possues preços especiais
 * @param $plan
 * @returns {Promise.<T>|Promise}
 * @constructor
 */
ClientPbxBL.prototype.UpdatePlanByIdNotSpecialPrice = function ($plan) {

    //promise list
    return promise.try(promiseUpdatePlan)
        .catch(promiseError);

    function promiseUpdatePlan() {
        var key = {
            'pbx.plan.special_price': false,
            'pbx.plan.plan_id': $plan._id,
        };

        var update = {
            '$set': {
                'pbx.plan.services': $plan.services,
                'pbx.plan.services_history': $plan.services_history,
            }
        };

        var options = {
            new: true,
            safe: true,
            upsert: false
        };

        return clientPbxModel.update(key, update, options).exec()
    }


    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza dados da conta do cliente.
 * @param $client_id
 * @param $data
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.UpdateAccountData = function ($client_id, $data) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdate() {

        if ($data.name == undefined || $data.name == null || $data.name.length == 0) {
            throw new clientError(global.messages.pbx.client.name_undefined);
        }
        if ($data.email == undefined || $data.email == null || $data.email.length == 0) {
            throw new unauthorizedError(global.messages.pbx.client.email_undefined);
        }

        return clientPbxModel.findByIdAndUpdate($client_id,
            {$set: $data},
            {safe: true, upsert: false, new: true}).exec()
    }

    function promiseReturn(result) {
        result = result.toObject();
        _.unset(result, ['pbx']);
        return result;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem dados cadastrais da conta
 * @param $client_id
 * @param $data
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.GetAccountData = function ($client_id) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdate() {
        return clientPbxModel.findById($client_id).exec()
    }

    function promiseReturn(result) {
        result = result.toObject();
        _.unset(result, ['pbx']);
        _.unset(result, ['hash_card']);
        return result;
    }


    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem dados de licenças do cliente
 * @param $client_id
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.GetAccountLicences = function ($client_id) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdate() {
        return clientPbxModel.findById($client_id).exec()
    }

    function promiseReturn(result) {
        if (result == null) {
            throw new notFoundError(global.messages.pbx.client.undefined);
        }
        result = result.toObject();
        return result.pbx.license;
    }


    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Obtem dados de pagamento da conta
 * @param $client_id
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.GetAccountPaymentData = function ($client_id) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdate() {
        return clientPbxModel.findById($client_id).exec()
    }

    function promiseReturn(result) {
        result = result.toObject();
        if (result.payment_cards != undefined) {
            return result.payment_cards;
        }
        else {
            return [];
        }

    }


    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia e-mail de alerta sobre saldo abaixo do valor configurado pelo client
 * @param $client
 */
ClientPbxBL.prototype.SendClientLowBalanceAlertToEmail = function ($client) {

    var log = null;
    var application = null;
    var client = null;

    //promise list
    return promise.try(promiseCheckAplicationPemission)
        .then(promiseReturn)
        .catch(promiseError);


    //Valida acesso a aplicação
    function promiseCheckAplicationPemission() {
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier(global.applications.pbx);

    }

    function promiseReturn(result) {
        application = result.toObject();
        var sended_emails = [];
        if ($client.pbx.settings.alert_low_balance) {
            if ($client.pbx.settings.alert_low_balance_value == $client.pbx.current_balance) {

                var subject = global.email.text.client_low_balance.subject.replace(/#app_name#/gi, application.name);
                var text = global.email.text.client_low_balance.text.replace(/#client_name#/gi, $client.name);
                text = text.replace(/#value#/gi, $client.pbx.settings.alert_low_balance_value);
                text = text.replace(/#app_name#/gi, application.name);

                return promise.each($client.pbx.user, function (value) {
                    return promise.try(promisseResult)
                        .catch(promiseErrorResult);

                    function promisseResult() {
                        if (value.permission == 10) {
                            text = text.replace('#user_name#', value.name);
                            var email = {
                                user: application.email_settings.user,
                                password: application.email_settings.password,
                                smtp: application.email_settings.smtp,
                                ssl: application.email_settings.ssl,
                                port: application.email_settings.port,
                                template_path: application.email_settings.template_path,
                                recipient: value.email,
                                subject: subject,
                                text: text
                            };
                            sendmail.Send(email);
                            sended_emails.push(value.email);
                        }
                    }

                    //tratamento de erro
                    function promiseErrorResult(ex) {
                        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
                        throw ex;
                    }
                })
                    .then(function (resultEach) {
                        return sended_emails;
                    });
                return sended_emails;
            }
        }

    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia e-mail de alerta sobre saldo zerado
 * @param $client_id
 */
ClientPbxBL.prototype.SendClientZeroBalanceAlertToEmail = function ($client) {

    var log = null;
    var application = null;

    //promise list
    return promise.try(promiseCheckAplicationPemission)
        .then(promiseReturn)
        .catch(promiseError);


    //Valida acesso a aplicação
    function promiseCheckAplicationPemission() {
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier(global.applications.pbx);

    }

    function promiseReturn(result) {
        application = result.toObject();
        var sended_emails = [];

        if ($client.pbx.settings.alert_zero_balance) {
            var subject = global.email.text.client_zero_balance.subject.replace(/#app_name#/gi, application.name);
            var text = global.email.text.client_zero_balance.text.replace(/#client_name#/gi, $client.name);
            text = text.replace(/#app_name#/gi, application.name);


            return promise.each($client.pbx.user, function (value) {

                return promise.try(promisseResult)
                    .catch(promiseErrorResult);

                function promisseResult() {
                    if (value.permission == 10) {
                        text = text.replace(/#user_name#/gi, value.name);
                        var email = {
                            user: application.email_settings.user,
                            password: application.email_settings.password,
                            smtp: application.email_settings.smtp,
                            ssl: application.email_settings.ssl,
                            port: application.email_settings.port,
                            template_path: application.email_settings.template_path,
                            recipient: value.email,
                            subject: subject,
                            text: text
                        };
                        sendmail.Send(email);
                        sended_emails.push(value.email);
                    }
                }

                function promiseErrorResult(ex) {
                    global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
                    throw ex;
                }
            })
                .then(function (resultEach) {
                    return sended_emails;
                });
            return sended_emails;
        }
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia e-mail de alerta sobre saldo abaixo do valor a ser pago no dia de pagamento
 * @param $client
 */
ClientPbxBL.prototype.SendClientLowBalanceForLicensePaymentCron = function ($client, $application) {

    var log = null;
    var application = $application;
    var total = 0
    var products = [];

    //promise list
    return promise.try(promiseCalcTotalLicense)
        .then(promiseCalcTotalNumber)
        .then(promiseReturnSendEmail)
        .then(promiseCreatOrder)
        .catch(promiseError);


    //Valida acesso a aplicação
    function promiseCalcTotalLicense() {
        _.forEach($client.pbx.license, function (value, key) {
            var product = {
                name: global.name_order.monthly,
                discount: 0,
                extra: 0,
            }
            if (key == 'agent' && value > 0) {
                product.value = $client.pbx.plan.services.license_pabx.monthly_value * value;
                product.quantity = value;
                product.description = global.description_order.pbx;
                products.push(product);
                total += $client.pbx.plan.services.license_pabx.monthly_value * value;
            } else if (key == 'voip' && value > 0) {
                product.value = $client.pbx.plan.services.license_voip.monthly_value * value;
                product.quantity = value;
                product.description = global.description_order.voip;
                products.push(product);
                total += $client.pbx.plan.services.license_voip.monthly_value * value;
            } else if (key == 'webcall' && value > 0) {
                product.value = $client.pbx.plan.services.license_webcall.monthly_value * value;
                product.quantity = value;
                product.description = global.description_order.webcall;
                products.push(product);
                total += $client.pbx.plan.services.license_webcall.monthly_value * value;
            }

        })
        return;
    }

    function promiseCalcTotalNumber() {
        if ($client.pbx.number.length > 0) {
            _.forEach($client.pbx.number, function (value) {
                var product = {
                    name: global.name_order.monthly,
                    discount: 0,
                    extra: 0,
                }
                if (value.receptive) {
                    if (value.number.includes("0800")) {
                        product.value = $client.pbx.plan.services.receptive_0800.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.receptive_0800;
                        products.push(product);
                        total += $client.pbx.plan.services.receptive_0800.monthly_value;
                    } else {
                        product.value = $client.pbx.plan.services.receptive_4020.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.receptive_4020;
                        products.push(product);
                        total += $client.pbx.plan.services.receptive_4020.monthly_value;
                    }
                } else {
                    if (value.area_code = 11) {
                        product.value = $client.pbx.plan.services.ddr_11.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.ddr_11;
                        products.push(product);
                        total += $client.pbx.plan.services.ddr_11.monthly_value;
                    } else {
                        product.value = $client.pbx.plan.services.ddr_others.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.ddr_others;
                        products.push(product);
                        total += $client.pbx.plan.services.ddr_others.monthly_value;
                    }
                }
            })
        }
        return;
    }

    function promiseReturnSendEmail(result) {
        var sended_emails = [];

        var subject = global.email.text.client_low_balance_payment.subject.replace(/#app_name#/gi, application.name);
        var text = global.email.text.client_low_balance_payment.text.replace(/#client_name#/gi, $client.name);
        text = text.replace(/#app_name#/gi, application.name);
        text = text.replace(/#value_payment#/gi, total);

        return promise.each($client.pbx.user, function (value) {
            return promise.try(promisseResult)
                .catch(promiseErrorResult);

            function promisseResult() {
                if (value.permission == 10) {
                    text = text.replace(/#user_name#/gi, value.name);
                    var email = {
                        user: application.email_settings.user,
                        password: application.email_settings.password,
                        smtp: application.email_settings.smtp,
                        ssl: application.email_settings.ssl,
                        port: application.email_settings.port,
                        template_path: application.email_settings.template_path,
                        recipient: value.email,
                        subject: subject,
                        text: text
                    };
                    sendmail.Send(email);
                    sended_emails.push(value.email);
                }
            }

            //tratamento de erro
            function promiseErrorResult(ex) {
                global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
                throw ex;
            }
        }).then(function (resultEach) {
            return sended_emails;

        });

        return sended_emails;
    }

    function promiseCreatOrder(result) {
        var purchase = {
            products: products,
            payment: {
                mode: "invoice",
                recurrent: false
            },
            client_id: $client._id
        }

        return purchase;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }

}

/**
 * Envia e-mail de alerta dizendo que pagamento não foi feito e conta foi suspensa
 * @param $client
 */
ClientPbxBL.prototype.SendClientNotPaymentLicenseSuspendAccont = function ($client, $application) {

    var log = null;
    var application = null;
    var total = 0

    //promise list
    return promise.try(promiseSuspendAccontClient)
        .then(promiseSuspendAccontClientCentral)
        .then(promiseReturn)
        .catch(promiseError);


    //Valida acesso a aplicação
    function promiseSuspendAccontClient() {
        return clientPbxModel.findOneAndUpdate(
            {'_id': $client._id},
            {
                $set: {'suspended': true}
            })
    }

    function promiseSuspendAccontClientCentral() {
        var aux = {
            central_id: $client.central_id,
            suspenso: true
        }

        var api_central_address = _.find($application.settings.api_central, {'name': $client.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.put_client_suspended,
            method: 'PUT',
            json: aux,
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            }
        })
    }

    function promiseReturn(result) {
        var sended_emails = [];

        var subject = global.email.text.client_not_payment.subject.replace(/#app_name#/gi, application.name);
        var text = global.email.text.client_not_payment.text.replace(/#client_name#/gi, $client.name);
        text = text.replace(/#app_name#/gi, application.name);

        return promise.each($client.pbx.user, function (value) {
            return promise.try(promisseResult)
                .catch(promiseErrorResult);

            function promisseResult() {
                if (value.permission == 10) {
                    text = text.replace(/#user_name#/gi, value.name);
                    var email = {
                        user: application.email_settings.user,
                        password: application.email_settings.password,
                        smtp: application.email_settings.smtp,
                        ssl: application.email_settings.ssl,
                        port: application.email_settings.port,
                        template_path: application.email_settings.template_path,
                        recipient: value.email,
                        subject: subject,
                        text: text
                    };
                    sendmail.Send(email);
                    sended_emails.push(value.email);
                }
            }

            //tratamento de erro
            function promiseErrorResult(ex) {
                global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
                throw ex;
            }
        }).then(function (resultEach) {
            return sended_emails;

        });
        return sended_emails;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia e-mail de final de minutos de franquia
 * @param $client
 * @param $type
 */
ClientPbxBL.prototype.SendClientLowBalanceofMinutesFranchiseAlertToEmail = function ($client, $type) {

    var application = null;

    //promise list
    return promise.try(promiseCheckAplicationPemission)
        .then(promiseReturn)
        .catch(promiseError);


    //Valida acesso a aplicação
    function promiseCheckAplicationPemission() {
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier(global.applications.pbx);
    }

    function promiseReturn(result) {
        application = result;
        var send_emails = [];
        if ($client.pbx.settings.alert_low_balance_4004_0800) {

            if ($client.pbx.settings.alert_low_balance_4004_0800_value == $client.pbx.current_balance_0800 ||
                $client.pbx.settings.alert_low_balance_4004_0800_value == $client.pbx.current_balance_4004) {

                var subject = global.email.text.low_receptive_balance.subject.replace(/#app_name#/gi, application.name);
                subject = subject.replace('#type#', $type);

                var text = global.email.text.low_receptive_balance.text.replace(/#client_name#/gi, $client.name);
                text = text.replace(/#app_name#/gi, application.name);
                text = text.replace(/#type#/gi, $type);

                return promise.each($client.pbx.user, function (value) {

                    return promise.try(promisseResult)
                        .catch(promiseErrorResult);

                    function promisseResult() {
                        if (value.permission == 10) {
                            text = text.replace(/#user_name#/gi, value.name);
                            var email = {
                                user: application.email_settings.user,
                                password: application.email_settings.password,
                                smtp: application.email_settings.smtp,
                                ssl: application.email_settings.ssl,
                                port: application.email_settings.port,
                                template_path: application.email_settings.template_path,
                                recipient: value.email,
                                subject: subject,
                                text: text
                            };
                            sendmail.Send(email);
                            send_emails.push(value.email);
                        }
                    }

                    //tratamento de erro
                    function promiseErrorResult(ex) {
                        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
                        throw ex;
                    }
                })
                    .then(function (resultEach) {
                        return send_emails;
                    });
                return send_emails;
            }

        }

    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Envia e-mail de final de minutos de franquia
 * @param $client
 * @param $type
 */
ClientPbxBL.prototype.SendClientEndOfMinutesFranchiseAlertToEmail = function ($client, $type) {

    var log = null;
    var application = null;

    //promise list
    return promise.try(promiseCheckAplicationPemission)
        .then(promiseReturn)
        .catch(promiseError);


    //Valida acesso a aplicação
    function promiseCheckAplicationPemission() {
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier(global.applications.pbx);
    }

    function promiseReturn(result) {
        application = result;
        var send_emails = [];
        if ($client.pbx.settings.alert_zero_balance_4004_0800) {
            var subject = global.email.text.decrease_receptive_balance.subject.replace(/#app_name#/gi, application.name);
            subject = subject.replace(/#type#/gi, $type);

            var text = global.email.text.decrease_receptive_balance.text.replace(/#client_name#/gi, $client.name);
            text = text.replace(/#app_name#/gi, application.name);
            text = text.replace(/#type#/gi, $type);

            return promise.each($client.pbx.user, function (value) {

                return promise.try(promisseResult)
                    .catch(promiseErrorResult);

                function promisseResult() {
                    if (value.permission == 10) {
                        text = text.replace(/#user_name#/gi, value.name);
                        var email = {
                            user: application.email_settings.user,
                            password: application.email_settings.password,
                            smtp: application.email_settings.smtp,
                            ssl: application.email_settings.ssl,
                            port: application.email_settings.port,
                            template_path: application.email_settings.template_path,
                            recipient: value.email,
                            subject: subject,
                            text: text
                        };
                        sendmail.Send(email);
                        send_emails.push(value.email);
                    }
                }

                //tratamento de erro
                function promiseErrorResult(ex) {
                    global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
                    throw ex;
                }
            })
                .then(function (resultEach) {
                    return send_emails;
                });
            return send_emails;
        }
    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Adiciona valor de saldo na conta do cliente
 * @param $client_id
 * @param $value
 * @param $order_id
 * @param $order_number
 * @param $application
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.AddNewValueBalanceForClientId = function ($client_id, $value, $order_id, $order_number, $application) {

    var application = null;
    var old_balance = null;

    return promise.try(promiseGetApplication)
        .then(promiseGetClient)
        .then(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetApplication() {
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier(global.applications.pbx);
    }

    function promiseGetClient(result) {
        application = result;
        return clientPbxModel.findById($client_id).exec();
    }

    function promiseUpdate(result) {
        old_balance = result.pbx.current_balance;
        var new_value = $value + old_balance;
        return clientPbxModel.findByIdAndUpdate($client_id, {
            $set: {
                'pbx.current_balance': +new_value
            },
            $push: {
                'balance_history': {
                    order_id: $order_id,
                    date: new Date(),
                    value: $value
                }
            }
        }, {new: true}).exec()
    }

    function promiseReturn(result) {
        result = result.toObject();
        var currency_opt = {format: '%s%v', symbol: 'R$', locale: 'pt-BR'};
        var subject = global.email.text.update_add_balance.subject.replace('#app_name#', application.name);
        var text = global.email.text.update_add_balance.text.replace('#client_name#', result.name);
        text = text.replace('#app_name#', application.name);
        text = text.replace('#new_balance#', formatCurrency($value, currency_opt));
        text = text.replace('#order_number#', $order_number);

        _.forEach(result.pbx.user, function (value) {
            if (value.permission == 10) {
                var email = {
                    user: application.email_settings.user,
                    password: application.email_settings.password,
                    smtp: application.email_settings.smtp,
                    ssl: application.email_settings.ssl,
                    port: application.email_settings.port,
                    template_path: application.email_settings.template_path,
                    recipient: value.email,
                    subject: subject,
                    text: text
                };
                sendmail.Send(email);


                if (old_balance < 0) {
                    var subject_old = global.email.text.client_negative_balance.subject.replace('#app_name#', application.name);
                    var text_old = global.email.text.client_negative_balance.text.replace('#client_name#', result.name);
                    text_old = text_old.replace('#app_name#', application.name);
                    text_old = text_old.replace('#new_balance#', formatCurrency($value, currency_opt));
                    text_old = text_old.replace('#old_balance#', formatCurrency(old_balance, currency_opt));
                    text_old = text_old.replace('#balance#', formatCurrency(result.pbx.current_balance, currency_opt));
                    email.subject = subject_old;
                    email.text = text_old
                    sendmail.Send(email);
                }

            }
        });

        var balance_central = {
            client_id: result.central_id,
            new_balance: result.pbx.current_balance,
            type: 'ativo'
        }

        var api_central_address = _.find($application.settings.api_central, {'name': result.api_central});
        request({
            url: api_central_address.address + global.pbx_central.put_client_balance_update,
            method: 'PUT',
            json: balance_central,
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            }
        })

    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * decrementa valor de saldo na conta do cliente
 * @param $client_id
 * @param $value
 * @param $order_id
 * @param $order_number
 * @param $application
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.DecreaseBalanceTypeByClientId = function ($client_id, $value, $type, $application) {

    var application = null;
    var client = null;
    var central_update_receptive = false;

    return promise.try(promiseGetClient)
        .then(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetClient() {
        return clientPbxModel.findOne({'_id': $client_id});
    }

    function promiseUpdate(result) {
        client = result;
        if (result.payment_mode == 'pre') {
            var update = null;
            switch ($type) {
                case 'sms':
                case 'VC1':
                case 'VC2':
                case 'VC3':
                case 'local_fixo':
                case 'ddd_fixo': {
                    update = {
                        $inc: {
                            'pbx.current_balance': -$value
                        }
                    };
                    break;
                }
                case 'receptivo_0800_celular':
                case 'receptivo_0800_fixo': {
                    central_update_receptive = true;
                    if (result.pbx.current_balance_0800 > 0) {
                        var valid_balance = result.pbx.current_balance_0800 - $value;
                        if (valid_balance <= 0) {
                            var new_balance = result.pbx.current_balance - (valid_balance * -1);
                            update = {
                                $set: {
                                    'pbx.current_balance': new_balance,
                                    'pbx.current_balance_0800': 0,
                                }
                            };
                        } else {
                            update = {
                                $inc: {
                                    'pbx.current_balance_0800': -$value
                                }
                            };
                        }
                    } else {
                        update = {
                            $inc: {
                                'pbx.current_balance': -$value
                            }
                        };
                    }
                    break;
                }
                case 'receptivo_4004': {
                    central_update_receptive = true;
                    if (result.pbx.current_balance_4004 > 0) {
                        var valid_balance = result.pbx.current_balance_4004 - $value;
                        if (valid_balance < 0) {
                            var new_balance = result.pbx.current_balance - (valid_balance * -1);
                            update = {
                                $set: {
                                    'pbx.current_balance': new_balance,
                                    'pbx.current_balance_4004': 0,
                                }
                            };
                        } else {
                            update = {
                                $inc: {
                                    'pbx.current_balance_4004': -$value
                                }
                            };
                        }
                    } else {
                        update = {
                            $inc: {
                                'pbx.current_balance': -$value
                            }
                        };
                    }
                    break;
                }
                case 'webcall':
                    if (result.pbx.current_balance_webcall > 0) {
                        var valid_balance = result.pbx.current_balance_webcall - $value;
                        if (valid_balance < 0) {
                            var new_balance = result.pbx.current_balance - (valid_balance * -1);
                            update = {
                                $set: {
                                    'pbx.current_balance': new_balance,
                                    'pbx.current_balance_webcall': 0,
                                }
                            };
                        } else {
                            update = {
                                $inc: {
                                    'pbx.current_balance_webcall': -$value
                                }
                            };
                        }
                    } else {
                        update = {
                            $inc: {
                                'pbx.current_balance': -$value
                            }
                        };
                    }
                    break;
            }
            return clientPbxModel.findByIdAndUpdate($client_id, update, {new: true}).exec()
        }
        else {
            return null;
        }
    }

    function promiseReturn(result) {
        if (result !== null) {
            result = result.toObject();
            if ($type == 'receptivo_0800_fixo' || $type == 'receptivo_0800_celular') {
                if (result.pbx.current_balance_0800 <= 0) {
                    local.SendClientEndOfMinutesFranchiseAlertToEmail(result, "0800");
                } else if (result.pbx.current_balance_0800 <= global.balance_limit.receptive_0800) {
                    local.SendClientLowBalanceofMinutesFranchiseAlertToEmail(result, "0800");
                }
            } else if ($type == 'receptivo_4004') {
                if (result.pbx.current_balance_4004 <= 0) {
                    local.SendClientEndOfMinutesFranchiseAlertToEmail(result, "4004");
                } else if (result.pbx.current_balance_0800 <= global.balance_limit.receptive_4004) {
                    local.SendClientLowBalanceofMinutesFranchiseAlertToEmail(result, "4004");
                }

            } else if ($type == 'webcall') {
                if (result.pbx.current_balance_webcall <= 0) {
                    local.SendClientEndOfMinutesFranchiseAlertToEmail(result, "webcall");
                } else if (result.pbx.current_balance_webcall <= global.balance_limit.webcall) {
                    local.SendClientLowBalanceofMinutesFranchiseAlertToEmail(result, "webcall");
                }
            } else {
                if (result.pbx.current_balance > 0 && result.pbx.current_balance <= global.balance_limit.active) {
                    local.SendClientLowBalanceAlertToEmail(result);
                } else if (result.pbx.current_balance < 0) {
                    local.SendClientZeroBalanceAlertToEmail(result);
                }
            }

            //atualização da central
            var balance_central = {
                client_id: result.central_id,
                balance: {
                    new_balance: result.pbx.current_balance,
                    new_balance_0800: result.pbx.current_balance_0800,
                    new_balance_4004: result.pbx.current_balance_4004,
                    new_balance_webcall: result.pbx.current_balance_webcall,
                }
            }

            var api_central_address = _.find($application.settings.api_central, {'name': result.api_central});
            request({
                url: api_central_address.address + global.pbx_central.put_client_balance_update,
                method: 'PUT',
                json: balance_central,
                responseType: 'json',
                timeout: 60000,
                rejectUnauthorized: false,
                requestCert: true,
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    app_identifier: global.pbx_central.app_identifier,
                    app_key: global.pbx_central.app_key,
                }
            })
            return result;
        } else {
            return client;
        }
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Atualiza periodo de teste do cliente
 * @param $central_id
 * @param $evaluation_period_day
 * @param $evaluation_period
 * @param $application
 * @returns {Promise|Promise.<TResult>}
 * @constructor
 */
ClientPbxBL.prototype.UpdatePeriodExpired = function ($central_id, $evaluation_period_day, $evaluation_period, $application) {

    //promise list
    return promise.try(promiseUpdateExpired)
        .then(promiseUpdateCentral)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdateExpired() {
        if ($evaluation_period) {
            return clientPbxModel.findOneAndUpdate(
                {'central_id': $central_id},
                {
                    $set: {
                        'pbx.trial.expired': false,
                        'pbx.trial.day': $evaluation_period_day,
                        'active': true,
                        'suspended': false
                    }
                },
                {safe: true, upsert: false, new: true}).exec()
        } else {
            return clientPbxModel.findOneAndUpdate(
                {'central_id': $central_id},
                {
                    $set: {
                        'pbx.trial.expired': true,
                        'active': false,
                        'suspended': true
                    }
                },
                {safe: true, upsert: false, new: true}).exec()
        }
    }

    function promiseUpdateCentral(result) {
        var aux = {
            suspenso: $evaluation_period ? false : true,
            central_id: $central_id
        }

        var api_central_address = _.find($application.settings.api_central, {'name': result.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.put_client_suspended,
            method: 'PUT',
            json: aux,
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            },
        });
    }

    function promiseReturn(result) {
        return;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * criar periodo de teste do cliente
 * @param $client_id
 * @param $data
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.CreatPeriodExpired = function ($central_id, $evaluation_period_day, $evaluation_period) {

    //promise list
    return promise.try(promiseUpdateExpired)
        .catch(promiseError);

    function promiseUpdateExpired() {
        if ($evaluation_period) {
            return clientPbxModel.findOneAndUpdate(
                {'central_id': $central_id},
                {
                    $set: {
                        'pbx.trial.expired': false,
                        'pbx.trial.day': $evaluation_period_day,
                        'pbx.trial.start_date': new Date(),
                        'active': true,
                        'suspended': false
                    }
                },
                {safe: true, upsert: false, new: true}).exec()
        }
        return;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Atualiza quantidade da lincensa de acordo com a proposta
 * @param $client_id
 * @param $data
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.UpdateQuantityLicenseForProposal = function ($data, $application) {
    var client = null;
    var agent_remove_queue = [];

    //promise list
    return promise.try(promiseUpdateAccountType)
        .then(promiseUpdate)
        .then(promiseUpdateLicense)
        .then(promiseUpateQueueByAgent)
        .then(promiseUpateWebcall)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdateAccountType() {
        var aux = '';
        if ($data.pabx_quantity > 0 || $data.webcall_quantity > 0) {
            aux = "pabx";
        } else if ($data.voip_quantity) {
            aux = "voip";
        } else {
            aux = "ativo";
        }
        return clientPbxModel.findOneAndUpdate(
            {'central_id': $data.central_id},
            {
                $set: {
                    'system_type': aux,
                }
            },
            {safe: true, upsert: false, new: true}).exec()
    }

    function promiseUpdate(result_app) {
        return clientPbxModel.findOneAndUpdate(
            {'central_id': $data.central_id},
            {
                $set: {
                    'pbx.license.voip': $data.voip_quantity,
                    'pbx.license.agent': $data.pabx_quantity,
                    'pbx.license.webcall': $data.webcall_quantity
                }
            },
            {safe: true, upsert: false, new: true}).exec()

    }

    function promiseUpdateLicense(result) {
        client = result.toObject();
        var aux_agent = 0;
        var aux_voip = 0;
        var aux = null;
        aux = _.filter(client.pbx.branch_number, {'agent': true});
        aux_agent = aux != undefined ? aux.length - $data.pabx_quantity : 0;
        aux = _.filter(result.pbx.branch_number, {'voip': true});
        aux_voip = aux != undefined ? aux.length - $data.voip_quantity : 0;

        _.forEachRight(client.pbx.branch_number, function (branch) {
            if (branch.agent == true && aux_agent > 0) {
                branch.agent = false;
                agent_remove_queue.push(branch);
                aux_agent--;

            } else if (branch.voip == true && aux_voip > 0) {
                branch.voip = false;
                aux_voip--;

            } else if (aux_agent <= 0 && aux_voip <= 0) {
                return false;
            }
        })

        return clientPbxModel.findOneAndUpdate(
            {'central_id': $data.central_id},
            {$set: {'pbx.branch_number': client.pbx.branch_number}},
            {safe: true, upsert: false, new: true}).exec();

    }

    function promiseUpateQueueByAgent(result_license) {
        if (agent_remove_queue.length > 0) {

            return promise.each(agent_remove_queue, function (agent) {

                return promise.try(promiseVerifyInsideInQueue)
                    .then(promiseRemoveQueue)
                    .catch(promiseErrorPullAgent);

                function promiseVerifyInsideInQueue() {
                    var branchNumberClient_BL = new branchNumberClientPbxBL();
                    return branchNumberClient_BL.VerifyBranchNumberAgentInsideQueue(client._id, agent);
                }

                function promiseRemoveQueue(result_verify) {
                    if (result_verify) {
                        var branchNumberClient_BL = new branchNumberClientPbxBL();
                        return branchNumberClient_BL.RemoveBranchNumberAgentInsideQueue(client._id, agent, $application);
                    }

                }

                function promiseErrorPullAgent(ex) {
                    console.log("Erro de remoção de agent ClientPBXBL", ex);
                }
            })
        } else {
            return;
        }
    }

    function promiseUpateWebcall(result_queue) {
        var aux_webcall = 0;
        aux_webcall = client.pbx.webcall.length - $data.webcall_quantity;
        var aux = clone(client.pbx.webcall);

        _.forEachRight(aux, function (webcall) {
            if (aux_webcall > 0) {
                var index = client.pbx.webcall.indexOf(webcall);
                client.pbx.webcall.splice(index, 1);
                aux_webcall--;

            } else {
                return false;
            }
        });


        return clientPbxModel.findOneAndUpdate(
            {'central_id': $data.central_id},
            {$set: {'pbx.webcall': client.pbx.webcall}},
            {safe: true, upsert: false, new: true}).exec();

    }

    function promiseReturn(result) {
        return result;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Atualiza  quantidade da lincensa de acordo com o pagamento
 * @param $client_id
 * @param $data
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.UpdateQuantityLicenseForCron = function ($data, $order, $application) {
    var client = null;
    var application = null;
    var agent_remove_queue = [];
    //promise list
    return promise.try(promiseGetApplication)
        .then(promiseUpdate)
        .then(promiseUpdateLicense)
        .then(promiseUpateQueueByAgent)
        .then(promiseUpateWebcall)
        .then(promiseSendEmail)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetApplication() {
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier(global.applications.pbx);
    }

    function promiseUpdate(result_app) {
        application = result_app.toObject();
        return clientPbxModel.findOneAndUpdate(
            {'_id': $data.client_id},
            {
                $set: {
                    'pbx.license.voip': $data.voip_quantity,
                    'pbx.license.agent': $data.pabx_quantity,
                    'pbx.license.webcall': $data.webcall_quantity
                }
            },
            {safe: true, upsert: false, new: true}).exec()

    }

    function promiseUpdateLicense(result) {
        client = result.toObject();
        var aux_agent = 0;
        var aux_voip = 0;
        var aux = null;
        aux = _.filter(client.pbx.branch_number, {'agent': true});
        aux_agent = aux != undefined ? aux.length - $data.pabx_quantity : 0;
        aux = _.filter(result.pbx.branch_number, {'voip': true});
        aux_voip = aux != undefined ? aux.length - $data.voip_quantity : 0;

        _.forEachRight(client.pbx.branch_number, function (branch) {
            if (branch.agent == true && aux_agent > 0) {
                branch.agent = false;
                agent_remove_queue.push(branch);
                aux_agent--;

            } else if (branch.voip == true && aux_voip > 0) {
                branch.voip = false;
                aux_voip--;

            } else if (aux_agent <= 0 && aux_voip <= 0) {
                return false;
            }
        })

        return clientPbxModel.findOneAndUpdate(
            {'central_id': $data.central_id},
            {$set: {'pbx.branch_number': client.pbx.branch_number}},
            {safe: true, upsert: false, new: true}).exec();


    }

    function promiseUpateQueueByAgent(result_license) {
        if (agent_remove_queue.length > 0) {

            return promise.each(agent_remove_queue, function (agent) {

                return promise.try(promiseVerifyInsideInQueue)
                    .then(promiseRemoveQueue)
                    .catch(promiseErrorPullAgent);

                function promiseVerifyInsideInQueue() {
                    var branchNumberClient_BL = new branchNumberClientPbxBL();
                    return branchNumberClient_BL.VerifyBranchNumberAgentInsideQueue(client._id, agent, $application);
                }

                function promiseRemoveQueue(result_verify) {
                    if (result_verify) {
                        var branchNumberClient_BL = new branchNumberClientPbxBL();
                        return branchNumberClient_BL.RemoveBranchNumberAgentInsideQueue(client._id, agent, $application);
                    }

                }

                function promiseErrorPullAgent(ex) {
                    console.log("Erro de remoção de agent ClientPBXBL", ex);
                }
            })
        } else {
            return;
        }

    }

    function promiseUpateWebcall(result_queue) {
        var aux_webcall = 0;
        aux_webcall = client.pbx.webcall.length - $data.webcall_quantity;
        var aux = clone(client.pbx.webcall);

        _.forEachRight(aux, function (webcall) {
            if (aux_webcall > 0) {
                var index = client.pbx.webcall.indexOf(webcall);
                client.pbx.webcall.splice(index, 1);
                aux_webcall--;

            } else {
                return false;
            }
        });

        return clientPbxModel.findOneAndUpdate(
            {'_id': $data.client_id},
            {$set: {'pbx.webcall': client.pbx.webcall}},
            {safe: true, upsert: false, new: true}).exec();


    }

    function promiseSendEmail(result) {
        var subject = global.email.text.client_payment_license.subject.replace('#app_name#', application.name);
        var text = global.email.text.client_payment_license.text.replace('#client_name#', client.name);

        _.forEach(result.pbx.user, function (value) {
            if (value.permission == 10) {
                var email = {
                    user: application.email_settings.user,
                    password: application.email_settings.password,
                    smtp: application.email_settings.smtp,
                    ssl: application.email_settings.ssl,
                    port: application.email_settings.port,
                    template_path: application.email_settings.template_path,
                    recipient: value.email,
                    subject: subject,
                    text: text
                };
                sendmail.Send(email);
            }
        });
        return result;
    }

    function promiseReturn(result) {
        var aux = {
            order_id: $order._id,
            order_number: $order.number,
            reason: global.name_order.monthly,
            total: $order.total_value,
            date: $order.date_purchase,
        }
        return clientPbxModel.findOneAndUpdate(
            {'_id': $data.client_id},
            {$push: {'pbx.payment_history': aux}},
            {safe: true, upsert: false, new: true}).exec();

    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Executa Atualização no cliente suspendendo e inativando
 * @param $central_id
 * @return {proposalPbxModel}
 */
ClientPbxBL.prototype.UpdateSuspendNotActiveAccountClient = function ($central_id) {

    //promise list
    return promise.try(promiseSuspendClient)
        .catch(promiseError);

    function promiseSuspendClient() {
        return clientPbxModel.findOneAndUpdate(
            {'central_id': $central_id},
            {
                $set: {
                    'active': false,
                    'suspended': true
                }
            },
            {safe: true, upsert: false, new: true}).exec()
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Executa Ativação da conta do cliente
 * @param $central_id
 * @return {proposalPbxModel}
 */
ClientPbxBL.prototype.UpdateActiveAccountClient = function ($client_id, $order_id) {

    //promise list
    return promise.try(promiseActiveClient)
        .then(promiseResult)
        .catch(promiseError);

    function promiseActiveClient() {

        return clientPbxModel.findOneAndUpdate(
            {'_id': $client_id, 'revenues_order': $order_id},
            {
                $set: {
                    'revenues_order': null,
                    'active': true,
                    'suspended': false
                }
            },
            {safe: true, upsert: false, new: true}).exec()
    }

    function promiseResult(result) {
        return
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * seta paid true no cliente
 * @param $central_id
 * @return {proposalPbxModel}
 */
ClientPbxBL.prototype.UpdatePaid = function ($central_id, $order_id) {

    //promise list
    return promise.try(promisePaidClient)
        .catch(promiseError);


    function promisePaidClient() {
        return clientPbxModel.findOneAndUpdate(
            {'central_id': $central_id},
            {
                $set: {
                    'paid': true,
                    'revenues_order': $order_id
                }
            },
            {safe: true, upsert: false, new: true}).exec()
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * torna o cliente permanente removendo periodo de teste
 * @param $central_id
 * @return {proposalPbxModel}
 */
ClientPbxBL.prototype.UpdateAccountClientPermanent = function ($data) {

    //promise list
    return promise.try(promiseActiveClient)
        .catch(promiseError);

    function promiseActiveClient() {

        var aux_data_proposal = new Date($data.date_proposal);
        var aux_data_end = aux_data_proposal.setDate(aux_data_proposal.getDate() + $data.evaluation_period_day);
        aux_data_end = new Date(aux_data_end);
        var payment_day = aux_data_end > new Date() ? aux_data_end : new Date();

        return clientPbxModel.findOneAndUpdate(
            {'central_id': $data.central_id},
            {
                $set: {
                    'payment_day': payment_day,
                    'paid': true
                }
            },
            {safe: true, upsert: false, new: true}).exec()
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * cria produto e gera a ordem
 * @param $central_id
 * @return {proposalPbxModel}
 */
ClientPbxBL.prototype.CreateProductForClient = function ($central_id, application) {
    var products = [];
    //promise list
    return promise.try(promiseGetClient)
        .then(promiseCalcTotalLicense)
        .then(promiseCalcTotalNumber)
        .then(promiseCreatOrder)
        .catch(promiseError);

    function promiseGetClient() {
        return clientPbxModel.findOne({'central_id': $central_id}).exec()
    }

    function promiseCalcTotalLicense(client_result) {
        client_result = client_result.toObject();
        _.forEach(client_result.pbx.license, function (value, key) {
            var product = {
                name: "license",
                discount: 0,
                extra: 0,
            }
            if (key == 'agent' && value > 0) {
                product.value = client_result.pbx.plan.services.license_pabx.monthly_value * value;
                product.quantity = value;
                product.description = global.description_order.pbx;
                products.push(product);
            } else if (key == 'voip' && value > 0) {
                product.value = client_result.pbx.plan.services.license_voip.monthly_value * value;
                product.quantity = value;
                product.description = global.description_order.voip;
                products.push(product);
            } else if (key == 'webcall' && value > 0) {
                product.value = client_result.pbx.plan.services.license_webcall.monthly_value * value;
                product.quantity = value;
                product.description = global.description_order.webcall;
                products.push(product);
            }

        })
        return client_result;
    }

    function promiseCalcTotalNumber(result_client) {
        if (result_client.pbx.number.length > 0) {
            _.forEach(result_client.pbx.number, function (value) {
                var product = {
                    name: "license",
                    discount: 0,
                    extra: 0,
                }
                if (value.receptive) {
                    if (value.number.includes("0800")) {
                        product.value = result_client.pbx.plan.services.receptive_0800.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.receptive_0800;
                        products.push(product);
                    } else {
                        product.value = result_client.pbx.plan.services.receptive_4020.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.receptive_4020;
                        products.push(product);
                    }
                } else {
                    if (value.area_code = 11) {
                        product.value = result_client.pbx.plan.services.ddr_11.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.ddr_11;
                        products.push(product);
                    } else {
                        product.value = result_client.pbx.plan.services.ddr_others.monthly_value * value;
                        product.quantity = value;
                        product.description = global.description_order.ddr_others;
                        products.push(product);
                    }
                }
            })
        }
        return result_client;
    }

    function promiseCreatOrder(client) {
        var purchase = {
            products: products,
            payment: {
                mode: "invoice"
            },
            client_id: client._id
        }

        return purchase;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * metodo para adc uma compra recorrente
 * @param $central_id
 * @return {proposalPbxModel}
 */
ClientPbxBL.prototype.AddCreditRecurrentForClient = function ($client_id, $product, $order_id) {
    var products = [];
    //promise list
    return promise.try(promiseGetClient)
        .then(promiseUpdate)
        .then(promisseNewRecurrent)
        .catch(promiseError);

    function promiseGetClient() {
        clientPbxModel.findById($client_id);
    }

    function promiseUpdate(result_client) {
        _.forEach(result_client.credit_recurrent, function (recurrent) {
            var day = new Date(recurrent.day);
            if (day.getDate() == new Date().getDate()) {
                if ($product.value > recurrent.value) {
                    return clientPbxModel.findOneAndUpdate(
                        {'client_id': $client_id, 'credit_recurrent._id': recurrent._id},
                        {
                            $set: {
                                'credit_recurrent.$.value': $product.value,
                                'credit_recurrent.$.revenues_order': $order_id
                            }
                        },
                        {safe: true, upsert: false, new: true}).exec();
                } else {
                    return true;
                }
            }

        });
        return;
    }

    function promisseNewRecurrent() {
        if (result != undefined || result != null) {
            return;
        } else {
            var aux = {
                day: new Date(),
                value: $product.value,
                revenues_order: $order_id
            }
            return clientPbxModel.findOneAndUpdate(
                {'client_id': $client_id},
                {$push: {'credit_recurrent': aux}},
                {safe: true, upsert: false, new: true}).exec();
        }
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/***
 * Obtem plano do cliente
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.GetPbxPlanClient = function ($client_id) {

    return promise.try(promiseGet)
        .then(promisevalidateInformation)
        .catch(promiseError);

    function promiseGet() {
        return clientPbxModel.findById($client_id).exec();
    }

    function promisevalidateInformation(result) {
        return result.pbx.plan;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem uma lista de clientes pré para faturamento
 * @returns {Promise.<T>|Promise}
 * @constructor
 */
ClientPbxBL.prototype.GetListAllClientPreForBilling = function () {

    return promise.try(promisseProcess)
        .catch(promiseError);

    function promisseProcess() {
        return clientPbxModel.find({
            'payment_mode': 'pre',
            'active': true,
            'demo': false,
            'internal': {$not: /bcr/},
            'suspended': false,
            'system_type': {$not: /ativo/},
        }).exec();
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Obtem dados de licenças webcall do cliente e valida filas disponiveis
 * @param $client_id
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.GetAccountWebcallLicenses = function ($client_id) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseValidateWebcallQueues)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdate() {
        return clientPbxModel.findById($client_id).exec()
    }

    function promiseValidateWebcallQueues(result) {
        if (result == null) {
            throw new notFoundError(global.messages.pbx.client.undefined);
        }
        result = result.toObject();
        var webcall_code = result.pbx.license.webcall;
        if (webcall_code !== undefined && webcall_code !== null && webcall_code.length > 0) {
            var webcall_plan = _.find(result.pbx.plan.services.webcall, {'code': webcall_code});
            if (webcall_plan !== undefined) {
                return webcall_plan;
            }
        }

    }


    function promiseReturn(result) {
        if (result == null) {
            throw new notFoundError(global.messages.pbx.client.undefined);
        }
        return result;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Gravar arquivo de audio de musica de espera
 * @param $client_id
 * @param $file
 * @param $file_data_form
 * @returns {Promise}
 * @constructor
 */
ClientPbxBL.prototype.SaveNewAudioWaitingMusicFile = function ($client_id, $file, $file_data_form) {
    //promise list
    var new_file_name = null;
    var new_file = null;
    var result_file = null;
    return promise.try(promiseUploadFile)
        .then(promiseUploadFileLinux)
        .then(promiseReturnFileData)
        .then(promiseGetClientPbxAccount)
        .then(promiseSaveClientPbxWaitingSounds)
        .catch(promiseError);

    function promiseUploadFile() {
        if (!fs.existsSync(global.file_paths.server.path_file)) {
            fs.mkdirSync(global.file_paths.server.path_file);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music + "/" + $client_id)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music + "/" + $client_id);
        }

        var date = new Date();
        new_file_name = Guid.v4() + "_" + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + ".mp3";
        new_file = global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music + "/" + $client_id + "/" + new_file_name;
        return fsp.copy($file.path, new_file);

    }

    function promiseUploadFileLinux(new_file_result) {
        return fs.chmod(new_file, 0755);
    }

    function promiseReturnFileData(new_file_result_linux) {
        //fs.chown(new_file, 'www-data');
        return result = {
            client_id: $client_id,
            file_name: new_file_name,
            file_url: global.file_paths.server.url_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music + "/" + $client_id + "/" + new_file_name
        }
    }

    function promiseGetClientPbxAccount(result) {
        var playlists = [];
        _.forEach($file_data_form.playlist, function (item) {
            playlists.push(item.text);
        });
        result_file = {
            name: $file_data_form.name,
            file_url: result.file_url,
            file_name: result.file_name,
            playlists: playlists
        };
        return clientPbxModel.findOneAndUpdate({
            '_id': $client_id
        }, {
            $push: {
                'pbx.waiting_music': result_file
            }
        }, {
            safe: true, upsert: true, new: true
        }).exec();
    }

    function promiseSaveClientPbxWaitingSounds(result) {
        if (result == null) {
            throw new clientError(global.messages.pbx.webcall_history.client_undefined);
        }

        return result.pbx.waiting_music;

    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }

}


/**
 * Obtem lista de musicas de espera salvas na conta
 * @param $client_id
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.GetAccountWaitingMusics = function ($client_id) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseUpdate() {
        return clientPbxModel.findById($client_id).exec()
    }

    function promiseReturn(result) {
        if (result == null) {
            throw new notFoundError(global.messages.pbx.client.undefined);
        }
        return result.pbx.waiting_music;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Remove musica de espera da lista
 * @param $client_id
 * @param $file_name
 * @returns {Promise|Promise.<T>|*}
 * @constructor
 */
ClientPbxBL.prototype.RemoveWaitingMusic = function ($client_id, $file_name) {

    var musics = null;

    //promise list
    return promise.try(promiseGetClient)
        .then(promiseRemoveMusicFromModel)
        .then(promiseRemoveMusicFromServer)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetClient() {
        return clientPbxModel.findById($client_id).exec();
    }

    function promiseRemoveMusicFromModel(result) {
        if (result == null) {
            throw new notFoundError(global.messages.pbx.client.undefined);
        }

        var file = _.find(result.pbx.waiting_music, {'file_name': $file_name});
        return clientPbxModel.findOneAndUpdate(
            {'_id': $client_id, 'pbx.waiting_music._id': file._id},
            {
                $pull: {
                    'pbx.waiting_music': {
                        file_name: $file_name
                    }
                }
            },
            {safe: true, upsert: true, new: true}
        ).exec();
    }

    function promiseRemoveMusicFromServer(result) {
        if (result == null) {
            throw new notFoundError(global.messages.pbx.client.undefined);
        }
        musics = result.pbx.waiting_music;
        var url = global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_waiting_music + "/" + $client_id + "/" + $file_name;
        return fs.unlink(url);
    }

    function promiseReturn(result) {
        return musics;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * valida cliente 55pbx para envio de ticket para suporte (webphone)
 * @param $client_id
 * @param $user
 * @param $form_data
 * @returns {Promise}
 * @constructor
 */
ClientPbxBL.prototype.ValidClientToOpenZendeskTicketToSupport = function ($client_id, $user, $form_data) {
    //promise list
    return promise.try(promiseGetClientById)
        .then(promiseGetClientInformation)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetClientById() {
        if ($client_id == undefined || $client_id == null || $client_id.length <= 0) {
            throw new clientError(global.messages.pbx.client.client_undefined);
        }
        if ($user == undefined || $user == null || $user._id.length <= 0) {
            throw new clientError(global.messages.pbx.client.user_undefined);
        }
        return clientPbxModel.findById($client_id).exec();
    }

    function promiseGetClientInformation(result) {
        if (result == undefined || result == null) {
            throw new clientError(global.messages.pbx.client.client_undefined);
        }

        var client = {
            account_name: result.name,
            client_id: $client_id,
            central_id: result.central_id,
            user_name: $user.name,
            user_email: $user.email,
            branch_number: $user.branch_number.number,
            system_type: result.system_type
        };

        var zendesk_bl = new zendeskPbxBL();
        return zendesk_bl.SendNewSupportTicketByWebphone(client, $form_data);
    }

    function promiseReturn(result) {
        if (result == undefined || result == null) {
            throw new clientError(global.messages.pbx.client.client_undefined);
        }
        return result;
    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }

}


module.exports = ClientPbxBL;
