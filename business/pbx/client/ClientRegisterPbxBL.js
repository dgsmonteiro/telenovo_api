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
var dateFormat = require('dateformat');


//models and class
var clientPbxModel = require(path + '/model/pbx/client/ClientPbxModel');
var userPbxBL = require(path + '/business/pbx/UserPbxBL');
var applicationPbxBL = require(path + '/business/app/ApplicationBL');

/**
 * Contrutora da classe de Registro de Clintes
 * @constructor
 */
function ClientRegisterPbxBL() {

}


ClientRegisterPbxBL.prototype.Register = Register;
ClientRegisterPbxBL.prototype.RegisterNewAccountFromPreRegister = RegisterNewAccountFromPreRegister;


module.exports = ClientRegisterPbxBL;


/**
 * Executa registro de um novo cliente
 * @param $data
 * @param $transaction
 * @param $application
 * @return {clientPbxModel}
 */
function Register($data, $transaction, $application) {

    //variaveis
    var user = null;
    var client = null;
    var plan = null;
    var operator = null;
    var user_pbx_bl = new userPbxBL();
    var plan_pbx_bl = new planPbxBL();
    var operator_pbx_bl = new operatorPbxBL();


    //promise list
    return promise.try(promiseGetClient)
        .then(promiseGetPlan)
        .then(promiseGetOperatorPrice)
        .then(promiseValidUser)
        .then(promiseRegisterUser)
        .then(promiseRegisterClientInCentral)
        .then(promiseRegister)
        .then(promiseUpdateClientInCentral)
        .then(promiseReturn)
        .catch(promiseError);

    //processamento
    function promiseGetClient() {
        if ($data.name == undefined || $data.name == null || $data.name.length == 0) {
            throw new clientError(global.messages.pbx.client.name_undefined);
        }
        if ($data.email == undefined || $data.email == null || $data.email.length == 0) {
            throw new unauthorizedError(global.messages.pbx.client.email_undefined);
        }
        if ($data.area_code == undefined || $data.area_code == null || $data.area_code.length == 0) {
            throw new unauthorizedError(global.messages.pbx.client.area_code_undefined);
        }
        var key = {email: $data.email};
        return clientPbxModel.findOne(key).exec();
    };

    function promiseGetPlan(result) {
        if (result !== null) {
            throw new unauthorizedError(global.messages.pbx.client.email_exists);
        }
        return plan_pbx_bl.GetDefaultPlan();
    }

    function promiseGetOperatorPrice(result) {
        if (result == null) {
            throw new appError(global.messages.pbx.client.plan_undefined);
        }
        plan = result.toObject();
        return operator_pbx_bl.GetById(plan.default_operator_id);
    }

    function promiseValidUser(result) {
        if (result == null) {
            throw new appError(global.messages.pbx.client.operator_undefined);
        }
        if (!result.active) {
            throw new appError(global.messages.pbx.client.operator_not_actived);
        }
        operator = result.toObject();
        return user_pbx_bl.GetByEmail($data.email)
    };

    function promiseRegisterUser(result) {
        if (result == null) {
            var new_user = {
                email: $data.email,
                name: $data.name,
            };
            return user_pbx_bl.RegiterNewUser(new_user, $transaction)
        } else {
            return result;
        }
    }

    function promiseRegisterClientInCentral(result) {
        user = result;
        var central_client = {
            nome: $data.name,
            VC1: 0,
            VC2: 0,
            VC3: 0,
            local_fixo: 0,
            ddd_fixo: 0,
            receptivo_4004: 0,
            receptivo_0800_fixo: 0,
            receptivo_0800_celular: 0,
            saldo_ativo: 0,
            saldo_0800: 0,
            saldo_4004: 0,
            saldo_webcall: 0,
            webcall: 0,
            ativo: false,
            modo_conta: $data.system_type !== undefined ? $data.system_type : 'ativo',
            cobranca_conta: $data.payment_mode !== undefined ? $data.payment_mode : 'pre',
        };

        var api_central_address = _.find($application.settings.api_central, {'name': $data.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.post_method_client_register,
            method: 'POST',
            json: central_client,
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
    };

    function promiseRegister(result) {
        var new_client = $data;
        new_client.sip_server = $application.settings.sip[0].sip_server;
        new_client.transaction_id = $transaction.transaction_id;
        new_client.central_id = result.id;
        new_client.system_type = $data.system_type !== undefined ? $data.system_type : 'ativo';
        new_client.payment_mode = $data.payment_mode !== undefined ? $data.payment_mode : 'pre';
        if ($data.source == 'commercial') {
            new_client.paid = $data.status == 'approved' ? true : false;
            new_client.email = $data.email,
                new_client.commercial_name = $data.commercial_name,
                new_client.commercial_segment = $data.commercial_segment,
                new_client.contact_name = $data.contact_name,
                new_client.type = $data.type,
                new_client.document = $data.document,
                new_client.name = $data.name,
                new_client.phone = $data.phone,
                new_client.cell_phone = $data.cell_phone,
                new_client.area_code = $data.area_code
            if ($data.pabx_quantity > 0) {
                new_client.system_type = 'pabx';
                new_client.system_type = 'pabx';

            } else if ($data.voip_quantity > 0) {
                new_client.system_type = 'voip';
                new_client.system_type = 'voip';

            } else if ($data.webcall_quantity > 0) {
                new_client.system_type = 'pabx';
                new_client.system_type = 'pabx';

            } else {
                new_client.system_type = 'ativo';
                new_client.system_type = 'ativo';

            }
        }
        new_client.pbx = {
            current_balance: plan.balance_start,
            current_balance_0800: 0,
            current_balance_4004: 0,
            operator: [{
                operator_id: operator._id,
                name: operator.name,
                priority: 0,
            }],
            call_cost: {
                vc1_value: operator.call_price.vc1_value,
                vc2_value: operator.call_price.vc2_value,
                vc3_value: operator.call_price.vc3_value,
                local_fixed_value: operator.call_price.local_fixed_value,
                ddd_fixed_value: operator.call_price.ddd_fixed_value,
                receptive_0800_fix_value: operator.call_price.receptive_0800_fix_value,
                receptive_0800_mobile_value: operator.call_price.receptive_0800_mobile_value,
                receptive_4004_value: operator.call_price.receptive_4004_value,
                sms: operator.call_price.sms,
                webcall: operator.call_price.webcall,
            },
            license: {
                agent: $data.pabx_quantity != undefined ? $data.pabx_quantity : 0,
                voip: $data.voip_quantity != undefined ? $data.voip_quantity : 0,
                webcall: $data.webcall_quantity != undefined ? $data.webcall_quantity : 0,
            },
            plan: {
                plan_id: plan._id,
                name: plan.name,
                special_price: $data.source == "commercial" ? true : false,
                services: $data.source == "commercial" ? $data.services : plan.services
            },
            user: [{
                user_id: user._id,
                name: user.name,
                email: user.email,
                permission: global.permission.pbx.admin,
            }],
            branch_number: [{
                mask: $application.settings.pbx.branch_number.mask,
                number: new_client.central_id.toString() + "01",
                name: $application.settings.pbx.branch_number.name + " - 01",
                password: string_tools.GeneratePassword(8),
                user_id: user._id,
                user_name: user.name,
                user_email: user.email,
                mode_type_name: $application.settings.pbx.branch_number.mode_name,
                mode_ip_address: $application.settings.pbx.branch_number.ip,
                mode_ip_nameserver: $application.settings.pbx.branch_number.nameserver,
            }],
            trial: $data.trial
        }
        if ($data.quantity_webcall > 0 && $data.pabx_quantity <= 0) {
            new_client.pbx.license.agent = 1;
        }
        var client_pbx_model = new clientPbxModel($data);
        return client_pbx_model.save();
    };

    function promiseUpdateClientInCentral(result) {
        client = result.toObject();
        var central_client = {
            cliente: {
                id: client.central_id,
                nome: client.name,
                modo_conta: client.system_type,
                VC1: operator.call_price.vc1_value,
                VC2: operator.call_price.vc2_value,
                VC3: operator.call_price.vc3_value,
                local_fixo: operator.call_price.local_fixed_value,
                ddd_fixo: operator.call_price.ddd_fixed_value,
                receptivo_0800_fixo: operator.call_price.receptive_0800_fix_value,
                receptivo_0800_celular: operator.call_price.receptive_0800_mobile_value,
                receptivo_4004: operator.call_price.receptive_4004_value,
                webcall: operator.call_price.webcall,
                saldo_ativo: client.pbx.current_balance,
                saldo_0800: client.pbx.current_balance_0800,
                saldo_4004: client.pbx.current_balance_4004,
                saldo_webcall: client.pbx.current_balance_webcall,
                ativo: true,
                id_externo: client._id,
            },
            ramal: {
                id_cliente: client.central_id,
                ramal: client.pbx.branch_number[0].number,
                senha: client.pbx.branch_number[0].password,
                mascara: client.pbx.branch_number[0].mask,
                nome: client.pbx.branch_number[0].user_name,
                tipo_ramal: client.pbx.branch_number[0].mode_type_name,
                status: "indisponivel",
            }
        }

        var api_central_address = _.find($application.settings.api_central, {'name': client.api_central});
        return request({
            url: api_central_address.address + global.pbx_central.put_method_client_register_update,
            method: 'PUT',
            json: central_client,
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            }
        });
    }


    function promiseReturn(result) {

        var subject = $application.settings.email_client_register.subject.replace(/#app_name#/gi, $application.name);
        var text = $application.settings.email_client_register.text.replace(/#user_name#/gi, user.name);
        text = text.replace(/#app_url#/gi, $application.url);
        text = text.replace(/#user_email#/gi, user.email);
        text = text.replace(/#app_name#/gi, $application.name);
        var email = {
            user: $application.email_settings.user,
            password: $application.email_settings.password,
            smtp: $application.email_settings.smtp,
            ssl: $application.email_settings.ssl,
            port: $application.email_settings.port,
            template_path: $application.email_settings.template_path,
            recipient: client.email,
            subject: subject,
            text: text,
        };
        sendmail.Send(email);

        _.unset(client, ['address']);
        _.unset(client, ['portability']);
        _.unset(client, ['pbx']);
        _.unset(client, ['transaction_id']);
        _.unset(client, ['suspended']);
        _.unset(client, ['registered']);
        _.unset(client, ['active']);
        var zendesk_obj = {
            name: $data.name,
            email: $data.email,
            source: $data.source
        };

        var zendesk_bl = new zendeskBL();
        zendesk_bl.RegisterNewClientInZendeskBCR(zendesk_obj);

        //envia dados para alerta de contas registradas
        email.subject = "Nova conta 55PBX registrada!";
        email.text = "Dados do Cliente:" +
            "</br><p>Nome: " + client.name + "</strong></p>" +
            "</br><p>E-mail: " + client.email + "</strong></p>" +
            "</br><p>DDD: " + client.area_code + "</strong></p>" +
            "</br><p>Telefone: " + client.phone + "</strong></p>" +
            "</br><p>Origem: " + client.source + "</strong></p>";

        _.each($application.settings.email_alerts.register, function (addrress) {
            email.recipient = addrress;
            sendmail.Send(email);
        });

        return result;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}

/**
 * Cria nova conta com base em um pré-registro.
 * @param $pre_register_id
 * @returns {Promise|Promise.<T>}
 * @constructor
 */
function RegisterNewAccountFromPreRegister($pre_register_id) {

    //variaveis
    var preRegister = null;
    var application = null;
    var user = null;
    var client = null;
    var plan = null;
    var operator = null;
    var user_pbx_bl = new userPbxBL();
    var plan_pbx_bl = new planPbxBL();
    var operator_pbx_bl = new operatorPbxBL();


    return promise.try(promiseGetPreRegister)
        .then(promiseGetApplication)
        .then(promiseGetPlan)
        .then(promiseGetOperatorPrice)
        .then(promiseValidUser)
        .then(promiseRegisterUser)
        .then(promiseRegisterClientInCentral)
        .then(promiseRegister)
        .then(promiseUpdateClientInCentral)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetPreRegister() {
        return preRegisterClientModel.findById($pre_register_id).exec();
    }


    function promiseGetApplication(result) {
        if (result == null) {
            throw new unauthorizedError(global.messages.pbx.client.pre_register_exists);
        }
        preRegister = result;
        var app_pbx = new applicationPbxBL();
        return app_pbx.GetApplicationForIdentifier(global.applications.pbx);

    }

    function promiseGetPlan(result) {
        application = result;
        return plan_pbx_bl.GetPlansId(preRegister.plan_id);
    }

    function promiseGetOperatorPrice(result) {
        if (result == null) {
            throw new appError(global.messages.pbx.client.plan_undefined);
        }
        plan = result.toObject();
        return operator_pbx_bl.GetById(plan.default_operator_id);
    }

    function promiseValidUser(result) {
        if (result == null) {
            throw new appError(global.messages.pbx.client.operator_undefined);
        }
        if (!result.active) {
            throw new appError(global.messages.pbx.client.operator_not_actived);
        }
        operator = result.toObject();
        return user_pbx_bl.GetByEmail(preRegister.user.email)
    }

    function promiseRegisterUser(result) {
        if (result == null) {
            var new_user = {
                email: preRegister.user.email,
                name: preRegister.user.name,
            };
            return user_pbx_bl.RegiterNewUser(new_user, {source: preRegister.source, application_result: application, transaction_id: preRegister._id})
        } else {
            return result;
        }
    }

    function promiseRegisterClientInCentral(result) {
        user = result;
        var central_client = {
            nome: preRegister.account.commercial_name,
            VC1: 0,
            VC2: 0,
            VC3: 0,
            local_fixo: 0,
            ddd_fixo: 0,
            receptivo_4004: 0,
            receptivo_0800_fixo: 0,
            receptivo_0800_celular: 0,
            saldo_ativo: 0,
            saldo_0800: 0,
            saldo_4004: 0,
            saldo_webcall: 0,
            webcall: 0,
            ativo: false,
        };


        return request({
            url: application.settings.api_central[0].address + global.pbx_central.post_method_client_register,
            method: 'POST',
            json: central_client,
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

    function promiseRegister(result) {
        var new_client = preRegister.account.toObject();
        new_client.sip_server = application.settings.sip[0].sip_server;
        new_client.sip_seapi_centralrver = application.settings.api_central[0].name;
        new_client.transaction_id = $pre_register_id;
        new_client.central_id = result.id;
        new_client.payment_mode = 'pre';
        if (preRegister.license.pabx > 0 || preRegister.license.voip > 0) {
            if (preRegister.license.pabx > 0) {
                new_client.system_type = 'pabx';
            } else {
                new_client.system_type = 'voip';
            }
        } else {
            new_client.system_type = 'ativo';
        }
        new_client.paid = true;
        new_client.pbx = {
            current_balance: preRegister.credit,
            current_balance_0800: 0.0,
            current_balance_4004: 0.0,
            operator: [{
                operator_id: operator._id,
                name: operator.name,
                priority: 0,
            }],
            call_cost: {
                vc1_value: operator.call_price.vc1_value,
                vc2_value: operator.call_price.vc2_value,
                vc3_value: operator.call_price.vc3_value,
                local_fixed_value: operator.call_price.local_fixed_value,
                ddd_fixed_value: operator.call_price.ddd_fixed_value,
                receptive_0800_fix_value: operator.call_price.receptive_0800_fix_value,
                receptive_0800_mobile_value: operator.call_price.receptive_0800_mobile_value,
                receptive_4004_value: operator.call_price.receptive_4004_value,
                sms: operator.call_price.sms,
                webcall: preRegister.webcall !== undefined && preRegister.webcall !== null ? preRegister.webcall.minute_price : 0.0,
            },
            license: {
                agent: preRegister.license.pabx,
                voip: preRegister.license.voip,
                webcall_code: preRegister.webcall.code,
            },
            plan: {
                plan_id: plan._id,
                name: plan.name,
                special_price: false,
                services: plan.services
            },
            user: [{
                user_id: user._id,
                name: user.name,
                email: user.email,
                permission: global.permission.pbx.admin,
            }],
            branch_number: [{
                mask: application.settings.pbx.branch_number.mask,
                number: new_client.central_id.toString() + "01",
                name: application.settings.pbx.branch_number.name + " - 01",
                password: string_tools.GeneratePassword(8),
                user_id: user._id,
                user_name: user.name,
                user_email: user.email,
                mode_type_name: application.settings.pbx.branch_number.mode_name,
                mode_ip_address: application.settings.pbx.branch_number.ip,
                mode_ip_nameserver: application.settings.pbx.branch_number.nameserver,
                agent: preRegister.license.pabx > 0 ? true : false,
                voip: preRegister.license.voip > 0 ? true : false,
                record_audio: preRegister.license.pabx > 0 ? true : false,
                function_branch: preRegister.license.pabx > 0 ? 'attendace' : 'administrative',
                type: preRegister.license.pabx > 0 || preRegister.license.pabx.voip > 0 ? 'ambos' : 'ativo',
            }],
            trial: false,
        }
        var client_pbx_model = new clientPbxModel(new_client);
        return client_pbx_model.save();
    }

    function promiseUpdateClientInCentral(result) {
        client = result;
        var central_type = null;
        if (client.pbx.branch_number[0].function_branch == 'administrative') {
            if (client.pbx.branch_number[0].type == 'ambos') {
                central_type = 'r_ambos';
            } else if (client.pbx.branch_number[0].type == 'ativo') {
                central_type = 'r_ativo';
            } else {
                central_type = 'r_receptivo'
            }
        } else {
            if (client.pbx.branch_number[0].type == 'ambos') {
                central_type = 'cc_ambos';
            } else if (client.pbx.branch_number[0].type == 'ativo') {
                central_type = 'cc_ativo';
            } else {
                central_type = 'cc_receptivo'
            }
        }


        var central_client = {
            cliente: {
                id: client.central_id,
                nome: client.name,
                modo_conta: client.system_type,
                cobranca_conta: client.payment_mode,
                VC1: operator.call_price.vc1_value,
                VC2: operator.call_price.vc2_value,
                VC3: operator.call_price.vc3_value,
                local_fixo: operator.call_price.local_fixed_value,
                ddd_fixo: operator.call_price.ddd_fixed_value,
                receptivo_0800_fixo: operator.call_price.receptive_0800_fix_value,
                receptivo_0800_celular: operator.call_price.receptive_0800_mobile_value,
                receptivo_4004: operator.call_price.receptive_4004_value,
                webcall: operator.call_price.webcall,
                saldo_ativo: client.pbx.current_balance,
                saldo_0800: client.pbx.current_balance_0800,
                saldo_4004: client.pbx.current_balance_4004,
                saldo_webcall: client.pbx.current_balance_webcall,
                ativo: true,
                id_externo: client._id,
            },
            ramal: {
                id_cliente: client.central_id,
                ramal: client.pbx.branch_number[0].number,
                senha: client.pbx.branch_number[0].password,
                mascara: client.pbx.branch_number[0].mask,
                nome: client.pbx.branch_number[0].user_name,
                tipo_ramal: client.pbx.branch_number[0].mode_type_name,
                status: "indisponivel",
                callcenter: central_type,
                nameserver: client.pbx.branch_number[0].mode_ip_nameserver,
                grava_audio: client.pbx.branch_number[0].record_audio,
                status_atual: "desconectado",
            }
        }

        var api_central_address = application.settings.api_central[0];
        return request({
            url: api_central_address.address + global.pbx_central.put_method_client_register_update,
            method: 'PUT',
            json: central_client,
            responseType: 'json',
            timeout: 60000,
            rejectUnauthorized: false,
            requestCert: true,
            headers: {
                Accept: 'application/json, text/plain, */*',
                app_identifier: global.pbx_central.app_identifier,
                app_key: global.pbx_central.app_key,
            }
        });
    }


    function promiseReturn(result) {
        var subject = global.email.text.register_account.subject.replace(/#app_name#/gi, application.name.toUpperCase());
        var text = global.email.text.register_account.text.replace(/#client_name#/gi, client.commercial_name.toUpperCase());
        text = text.replace(/#app_name#/gi, application.name.toUpperCase());
        text = text.replace(/#user_name#/gi, preRegister.user.name.toUpperCase());
        text = text.replace(/#user_email#/gi, preRegister.user.email.toLowerCase());
        text = text.replace(/#order_number#/gi, preRegister.order_id);
        text = text.replace(/#app_url#/gi, application.settings.urls.admin.toLowerCase());
        text = text.replace(/#app_webphone_chrome_url#/gi, application.settings.urls.webphone_chrome.toLowerCase());

        var email = {
            user: application.email_settings.user,
            password: application.email_settings.password,
            smtp: application.email_settings.smtp,
            ssl: application.email_settings.ssl,
            port: application.email_settings.port,
            template_path: application.email_settings.template_path,
            recipient: preRegister.user.email,
            subject: subject,
            text: text,
        };
        sendmail.Send(email);


        //envia solicitação de DDR
        var contracted_number_pbx = new contractedNumberPbxBL();
        var email_numbers = [];

        if (preRegister.numbers.receptive_0800 > 0) {
            for (var i = 0; i <= preRegister.numbers.receptive_0800; i++) {
                contracted_number_pbx.RequestNewNumber(client._id, client.commercial_name, preRegister.order_id, '0800', '0800');
            }
            email_numbers.push({
                type: '0800',
                quantity: preRegister.numbers.receptive_0800,
                area_code: '0800'
            })
        }

        if (preRegister.numbers.receptive_4020 > 0) {
            for (var i = 0; i <= preRegister.numbers.receptive_4020; i++) {
                contracted_number_pbx.RequestNewNumber(client._id, client.commercial_name, preRegister.order_id, '4020', '4020');
            }
            email_numbers.push({
                type: '4020',
                quantity: preRegister.numbers.receptive_4020,
                area_code: '4020'
            })
        }

        if (preRegister.numbers.ddr.length > 0) {
            _.forEach(preRegister.numbers.ddr, function (item) {
                var ddr = item.area_code + "-" + item.city.toUpperCase();
                for (var i = 0; i <= item.quantity; i++) {
                    contracted_number_pbx.RequestNewNumber(client._id, client.commercial_name, preRegister.order_id, 'ddd', ddr);
                }
                email_numbers.push({
                    type: 'ddd',
                    quantity: 1,
                    area_code: ddr
                })
            })
        }

        //envia e-mail para compra de DDR
        if (email_numbers.length > 0) {
            var subject = global.email.text.number_request.subject;
            var text = global.email.text.number_request.text.replace(/#client_name#/gi, client.commercial_name.toUpperCase());
            text = text.replace(/#client_id#/gi, client._id);
            text = text.replace(/#client_name#/gi, client.commercial_name);
            text = text.replace(/#order_id#/gi, preRegister.order_id);
            text = text.replace(/#date#/gi, dateFormat(client.register_date, "dd/mm/yyyy"));
            var text_resume = "";
            _.forEach(email_numbers, function (item) {
                text_resume += "<p>Tipo: " + item.type.toUpperCase() + " | Quantidade: " + item.quantity + " |  DDD: " + item.area_code + "</p>";
            });
            text += text_resume;
            text += "</br></br></br></br><h6> E-mail enviado automaticamente pelo sistema.</h6>";

            var emails = application.settings.email_alerts;
            _.forEach(emails.support, function (item) {
                var email = {
                    user: application.email_settings.user,
                    password: application.email_settings.password,
                    smtp: application.email_settings.smtp,
                    ssl: application.email_settings.ssl,
                    port: application.email_settings.port,
                    template_path: application.email_settings.template_path,
                    recipient: item,
                    subject: subject,
                    text: text,
                };
                sendmail.Send(email);
            })


            //envia e-mail ao cliente informado sobre os números
            subject = global.email.text.register_account_new_number.subject.replace(/#app_name#/gi, application.name);
            text = global.email.text.register_account_new_number.text.replace(/#app_name#/gi, application.name);
            text = text.replace(/#client_name#/gi, client.commercial_name.toUpperCase());
            text = text.replace(/#user_name#/gi, preRegister.user.name.toUpperCase());
            text = text.replace(/#order_number#/gi, preRegister.order_id);
            text += text_resume;
            text += "</br></br></br></br><p>Atenciosamente,</p>";
            text += "</br></br><p> Equipe " + application.name + "!</p>";

            var email = {
                user: application.email_settings.user,
                password: application.email_settings.password,
                smtp: application.email_settings.smtp,
                ssl: application.email_settings.ssl,
                port: application.email_settings.port,
                template_path: application.email_settings.template_path,
                recipient: preRegister.user.email,
                subject: subject,
                text: text,
            };
            sendmail.Send(email);

        }

        return result;
    }

    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}
