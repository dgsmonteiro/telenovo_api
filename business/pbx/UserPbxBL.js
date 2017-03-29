/**
 * Classe -> UserBL
 * @desc: classe para manipulação de dados de usuário do sistema 55PBX.
 */

//imports
var _ = require('lodash');
var path = require('app-root-path');
var promise = require("bluebird");
var logger = global.logger;
var jwt = require("jsonwebtoken");
var ms = require("ms");
var appError = Error.extend('AppError', 500);
var clientError = Error.extend('ClientError', 400);
var notFoundError = Error.extend('HttpNotFoundError', 404);
var unauthorizedError = Error.extend('HttpUnauthorized', 401);
var deniedError = Error.extend('HttpUnauthorized', 406);
var tokenError = Error.extend('HttpUnauthorized', 417);
var guid = require('node-uuid');
var fs = require('fs');
var fsp = require('fs-promise');
var string_tools = require(path + '/business/tools/StringTools')

//models and class
var userPbxModel = require(path + '/model/pbx/UserPbxModel');
var clientPbxModel = require(path + '/model/pbx/client/ClientPbxModel');
var applicationBL = require(path + '/business/app/ApplicationBL');
var application_name_registred = [global.applications.admin, global.applications.pbx_report];

/**
 * Contrutora da classe de transações
 * @constructor
 */
function UserPbxBL() {

}

/**
 * Autentica permissão de usuário para acesso a aplicação.
 * @param $app_identifier
 * @return {ApplicationModel}
 */
UserPbxBL.prototype.ValidUserAccessApplication = function ($app_identifier) {

    //promise list
    return promise.try(promiseGetApplication)
        .then(promiseValidate)
        .catch(promiseError);

    function promiseGetApplication() {
        if ($app_identifier == null || $app_identifier == undefined || $app_identifier.length == 0) {
            throw new unauthorizedError(global.messages.application.undefined);
        }
        if (application_name_registred.indexOf($app_identifier) == -1) {
            throw new unauthorizedError(global.messages.default.app_not_permission);
        }
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier($app_identifier);
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
 * Autentica acesso e nivel de permissão de usuário para conta de um cliente.
 * @param $client_id
 * @param $user_id
 * @param $pemission
 * @return {clientPbxModel}
 */
UserPbxBL.prototype.ValidUserAccesClientPermission = function ($client_id, $user_id, $pemission) {

    //promise list
    return promise.try(promiseGetClient)
        .then(promiseValidate)
        .catch(promiseError);

    function promiseGetClient() {
        if ($client_id == null || $client_id == undefined || $client_id.length == 0) {
            throw new unauthorizedError(global.messages.pbx.client.undefined);
        }
        if ($user_id == null || $user_id == undefined || $user_id.length == 0) {
            throw new unauthorizedError(global.messages.user.undefined);
        }
        return clientPbxModel.findById($client_id).exec();
    }

    function promiseValidate(result) {
        if (result === null) {
            throw new notFoundError(global.messages.pbx.client.not_found);
        }
        if (!result.active) {
            throw new unauthorizedError(global.messages.pbx.client.not_active);
        }

        var user_located = _.find(result.pbx.user, {'user_id': $user_id});
        if (user_located == undefined) {
            throw new unauthorizedError(global.messages.pbx.client.user_not_found);
        }
        if (!user_located.active) {
            throw new unauthorizedError(global.messages.pbx.client.user_not_active);
        }
        var pemission_test = user_located.permission >= $pemission;
        if (!pemission_test) {
            throw new unauthorizedError(global.messages.pbx.client.user_not_pemission);
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
 * Autentica um usuário por Email e Senha informado.
 * @param $email
 * @param $password
 * @param $transaction
 * @return {userPbxModel}
 */
UserPbxBL.prototype.AuthenticateByEmail = function ($email, $password, $transaction) {

    //varáveis locais
    var user = null;
    var token = null;

    //promise list
    return promise.try(promiseGetUser)
        .then(promiseValidUser)
        .then(promiseCreateToken)
        .then(promiseGetClient)
        .then(promiseValidClient)
        .catch(promiseError);

    function promiseGetUser() {
        if ($email == null || $email == undefined || $email.length == 0) {
            throw new clientError(global.messages.user.email_undefined);
        }
        return userPbxModel.findOne({'email': $email}).exec()
    };


    function promiseValidUser(result) {
        if ($password == null || $password == undefined || $password.length == 0) {
            throw new deniedError(global.messages.user.password_undefined);
        }
        if (result == null) {
            throw new deniedError(global.messages.user.user_not_found);
        }
        if ($password !== result.password) {
            throw new deniedError(global.messages.user.password_error);
        }
        return result;
    }


    function promiseCreateToken(result) {
        token = jwt.sign({
            _id: result._id,
            email: result.email,
            password: result.password
        }, global.token.key, {expiresIn: global.token.expire_seconds});

        var update_obj = {
            $set: {'token': token},
        };

        var update_options = {
            safe: true,
            upsert: true
        }
        return userPbxModel.findByIdAndUpdate(result._id, update_obj, update_options).exec();
    }


    function promiseGetClient(result) {
        result.token = token;
        result = result.toObject();
        _.unset(result, ['history_password']);
        _.unset(result, ['password']);
        user = result;

        var update_key = {
            "active": true,
            "pbx.user.user_id": result._id,
            "pbx.user.active": true
        };
        return clientPbxModel.find(update_key).exec();
    }

    function promiseValidClient(result) {
        if (result === null || result.length == 0) {
            throw new deniedError(global.messages.pbx.client.user_not_found);
        }
        var clients = [];
        _.forEach(result, function (item) {
            var user_located = _.find(item.pbx.user, {'user_id': user._id.toHexString()});
            if (user_located !== undefined) {
                var item_obj = item.toObject();
                var client = {
                    _id: item_obj._id,
                    central_id: item_obj.central_id,
                    sip_server: item_obj.sip_server,
                    transaction_id: $transaction.transacao_id,
                    name: item_obj.name,
                    document: item_obj.document,
                    user_permission: user_located.permission,
                    user_active: user_located.active,
                    payment_mode: item_obj.payment_mode,
                    system_type: item_obj.system_type,
                    register_completed: item_obj.register_completed,
                    suspended: item_obj.suspended,
                }
                clients.push(client);
            }
        })
        user.clients = _.orderBy(clients, ['name'], ['asc']);
        return user;
    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Registra novo usuário no sistema
 * @param $user
 * @param $transaction
 * @return {userPbxModel}
 */
UserPbxBL.prototype.RegiterNewUser = function ($user, $transaction) {

    //promise list
    return promise.try(promiseGetUser)
        .then(promiseRegister)
        .then(promiseReturn)
        .catch(promiseError);


    function promiseGetUser() {
        if ($user.email == null || $user.email == undefined || $user.email.length == 0) {
            throw new clientError(global.messages.user.email_undefined);
        }

        if ($user.name == null || $user.name == undefined || $user.name.length == 0) {
            throw new clientError(global.messages.user.name_undefined);
        }
        return userPbxModel.findOne({'email': $user.email}).exec()
    };

    function promiseRegister(result) {
        if (result !== null) {
            throw new unauthorizedError(global.messages.user.user_exist);
        }
        $user.application = result;
        $user.text_password = string_tools.GeneratePassword(8);
        var password_hash = string_tools.ConvertStringToHashSHA512($user.text_password);
        $user.password = password_hash;
        $user.history_password = [{
            ip: $transaction.source,
            transaction_id: $transaction.transacao_id,
            date: Date.now()
        }];
        var user_model = new userPbxModel($user);
        return user_model.save();
    };


    function promiseReturn(result) {
        var subject = global.email.text.user_new.subject.replace(/#app_name#/gi, $transaction.application_result.name);
        var text = global.email.text.user_new.text.replace(/#user_name#/gi, $user.name);
        text = text.replace(/#app_url#/gi, $transaction.application_result.url);
        text = text.replace(/#user_email#/gi, $user.email);
        text = text.replace(/#user_password#/gi, $user.text_password);
        text = text.replace(/#app_name#/gi, $transaction.application_result.name);
        var email = {
            user: $transaction.application_result.email_settings.user,
            password: $transaction.application_result.email_settings.password,
            smtp: $transaction.application_result.email_settings.smtp,
            ssl: $transaction.application_result.email_settings.ssl,
            port: $transaction.application_result.email_settings.port,
            template_path: $transaction.application_result.email_settings.template_path,
            recipient: $user.email,
            subject: subject,
            text: text,
        };
        sendmail.Send(email)
        result = result.toObject();
        _.unset(result, ['history_password']);
        _.unset(result, ['password']);
        return result;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Altera senha do usuário informado
 * @param $user_id
 * @param $password
 * @param $new_password
 * @param $transaction
 * @return {userPbxModel}
 */
UserPbxBL.prototype.ChangePassword = function ($user_id, $password, $new_password, $transaction) {

    //promise list
    return promise.try(promiseGetUser)
        .then(promiseChange)
        .then(promiseReturn)
        .catch(promiseError);


    function promiseGetUser() {
        if ($user_id == null || $user_id == undefined || $user_id.length == 0) {
            throw new deniedError(global.messages.user.id_undefined);
        }

        if ($password == null || $password == undefined || $password.length == 0) {
            throw new deniedError(global.messages.user.password_undefined);
        }

        if ($new_password == null || $new_password == undefined || $new_password.length == 0) {
            throw new deniedError(global.messages.user.new_password_undefined);
        }

        return userPbxModel.findById($user_id).exec()
    };


    function promiseChange(result) {
        if (result == null) {
            throw new deniedError(global.messages.user.id_undefined);
        }

        if ($password !== result.password) {
            throw new deniedError(global.messages.user.current_password_error);
        }
        var history = [{
            ip: $transaction.source,
            transaction_id: $transaction.transacao_id,
            date: Date.now()
        }];
        var update_obj = {
            $set: {
                'password': $new_password,
                'registered': true,
            },
            $push: {'history_password': history}
        };
        var update_options = {
            safe: true,
            upsert: true
        }
        return userPbxModel.findByIdAndUpdate(result._id, update_obj, update_options).exec();
    };


    function promiseReturn(result) {
        result = result.toObject();
        _.unset(result, ['history_login']);
        _.unset(result, ['history_password']);
        _.unset(result, ['password']);
        return result;
    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Cria nova senha e envia para email do usuário informado
 * @param $email
 * @param $transaction
 * @return {userPbxModel}
 */
UserPbxBL.prototype.RecoveryPasswordForEmail = function ($email, $transaction) {

    var user = null;

    //promise list
    return promise.try(promiseGetUser)
        .then(promiseGetApplication)
        .then(promiseRegister)
        .then(promiseReturn)
        .catch(promiseError);


    function promiseGetUser() {
        if ($email == null || $email == undefined || $email.length == 0) {
            throw new clientError(global.messages.user.email_undefined);
        }
        return userPbxModel.findOne({'email': $email}).exec()
    };


    function promiseGetApplication(result) {
        if (result == null) {
            throw new notFoundError(global.messages.user.user_not_found);
        }
        user = result;
        var app_bl = new applicationBL();
        return app_bl.GetApplicationForIdentifier($transaction.application);
    }


    function promiseRegister(result) {
        if (result == null) {
            throw new unauthorizedError(global.messages.application.not_found);
        }
        user.application = result;
        user.text_password = string_tools.GeneratePassword(8);
        var password_hash = string_tools.ConvertStringToHashSHA512(user.text_password);
        user.password = password_hash;
        user.registered = false;
        user.history_password = [{
            ip: $transaction.source,
            transaction_id: $transaction.transacao_id,
            date: Date.now()
        }];
        var user_model = new userPbxModel(user);
        return user_model.save();
    };


    function promiseReturn(result) {
        var subject = global.email.text.user_recovery_password.subject.replace(/#app_name#/gi, user.application.name);
        var text = global.email.text.user_recovery_password.text.replace(/#user_name#/gi, user.name);
        text = text.replace(/#app_url#/gi, user.application.url);
        text = text.replace(/#user_email#/gi, user.email);
        text = text.replace(/#user_password#/gi, user.text_password);
        text = text.replace(/#app_name#/gi, user.application.name);
        var email = {
            user: user.application.email_settings.user,
            password: user.application.email_settings.password,
            smtp: user.application.email_settings.smtp,
            ssl: user.application.email_settings.ssl,
            port: user.application.email_settings.port,
            template_path: user.application.email_settings.template_path,
            recipient: user.email,
            subject: subject,
            text: text,
        };
        sendmail.Send(email)
        result = result.toObject();
        _.unset(result, ['history_password']);
        _.unset(result, ['password']);
        _.unset(result, ['token']);
        _.unset(result, ['create_at']);
        _.unset(result, ['update_at']);
        return result;
    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Atualiza dados de perfil do  usuário registrado para o ID informado.
 * @param $id
 * @param $user
 * @return {userPbxModel}
 */
UserPbxBL.prototype.UpdateProfileById = function ($user) {

    //promise list
    return promise.try(promiseUpdate)
        .then(promiseUpdateAllNameUserIdForClient)
        .then(promiseReturn)
        .catch(promiseError);


    function promiseUpdate() {
        if ($user.name == null || $user.name == undefined || $user.name.length == 0) {
            throw new clientError(global.messages.user.name_undefined);
        }
        var update_obj = {
            $set: {
                name: $user.name,
                document: $user.document,
                gender: $user.gender,
                mobile_phone: $user.mobile_phone,
                birth_date: $user.birth_date,
                img_url: $user.img_url,
                language: $user.language
            },
        };
        var update_options = {
            safe: true,
            upsert: false
        }
        return userPbxModel.findByIdAndUpdate($user._id, update_obj, update_options).exec();
    };

    function promiseUpdateAllNameUserIdForClient(result_user) {
        return clientPbxModel.update(
            {'pbx.user.user_id': $user._id},
            {$set: {'pbx.user.$.name': $user.name}},
            {safe: true, upsert: false, multi: true}
        ).exec();
    };

    function promiseReturn(result) {
        if (result === null) {
            throw new notFoundError(global.messages.user.user_not_found);
        }
        $user._id = result._id;
        return $user;
    };


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


/**
 * Grava nova imagem do usuario
 * @param $client_id
 * @param $file
 * @returns {Promise}
 * @constructor
 */
UserPbxBL.prototype.SaveNewImageProfileFile = function ($client_id, $file) {
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

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_profile_image)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_profile_image);
        }

        if (!fs.existsSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_profile_image + "/" + $client_id)) {
            fs.mkdirSync(global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_profile_image + "/" + $client_id);
        }


        var date = new Date();
        new_file_name = guid.v4() + "_" + date.getFullYear() + (date.getMonth() + 1) + date.getDate();
        new_file = global.file_paths.server.path_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_profile_image + "/" + $client_id + "/" + new_file_name;
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
            file_url: global.file_paths.server.url_file + "/" + global.file_paths.prefix.file_path_archive + "/" + global.file_paths.prefix.file_path_profile_image + "/" + $client_id + "/" + new_file_name
        }

    }

    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }

}


/**
 * Obtem um usuario por id informado.
 * @param $id
 * @return {userPbxModel}
 */
UserPbxBL.prototype.GetById = function ($id) {

    return promise.try(promiseGetUser)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetUser() {
        return userPbxModel.findById($id).exec();
    }

    function promiseReturn(result) {
        if (result !== null) {
            result = result.toObject();
            _.unset(result, ['history_login']);
            _.unset(result, ['history_password']);
            _.unset(result, ['password']);
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
 * Obtem um usuario por e-mail informado.
 * @param $email
 * @return {userPbxModel}
 */
UserPbxBL.prototype.GetByEmail = function ($email) {

    //promise list
    return promise.try(promiseGetUser)
        .then(promiseReturn)
        .catch(promiseError);

    function promiseGetUser() {
        var key = {email: $email};
        return userPbxModel.findOne(key).exec()
    };

    function promiseReturn(result) {
        if (result !== null) {
            result = result.toObject();
            _.unset(result, ['history_login']);
            _.unset(result, ['history_password']);
            _.unset(result, ['password']);
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
 * Valida se um token informado ainda é válido
 * @param $email
 * @return {userPbxModel}
 */
UserPbxBL.prototype.ValidateTokenAccess = function ($token) {

    //promise list
    return promise.try(promiseValid)
        .catch(promiseError);

    function promiseValid() {
        return jwt.verify($token, global.token.key, {expiresIn: global.token.expire_seconds});
    };

    //tratamento de erro
    function promiseError(ex) {
        if (ex.name == 'TokenExpiredError') {
            throw new tokenError(global.messages.user.token_invalid);
        } else {
            global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
            throw ex;
        }

    }
}


/**
 * Atualiza apenas email e nome do usuário informado.
 * @param $id
 * @param $email
 * @param $name
 * @return {userPbxModel}
 */
UserPbxBL.prototype.UpdateEmailAndNameById = function ($id, $email, $name) {

    //promise list
    return promise.try(promiseValid)
        .then(promiseUpdate)
        .then(promiseReturn)
        .catch(promiseError);


    function promiseValid() {
        if ($email == null || $email == undefined || $email.length == 0) {
            throw new clientError(global.messages.user.email_undefined);
        }

        if ($name == null || $name == undefined || $name.length == 0) {
            throw new clientError(global.messages.user.name_undefined);
        }
        return userPbxModel.findOne({'email': $email}).exec()
    }

    function promiseUpdate(result) {
        if (result != null && result.id != $id) {
            throw new unauthorizedError(global.messages.user.user_exist);
        }

        var update_obj = {
            $set: {
                name: $name,
                email: $email
            }
        };
        var update_options = {
            safe: true,
            upsert: false,
            new: true
        }
        return userPbxModel.findByIdAndUpdate($id, update_obj, update_options).exec();
    }


    function promiseReturn(result) {
        if (result === null) {
            throw new notFoundError(global.messages.user.user_not_found);
        }
        result = result.toObject();
        _.unset(result, ['history_login']);
        _.unset(result, ['history_password']);
        _.unset(result, ['password']);
        return result;
    }


    //tratamento de erro
    function promiseError(ex) {
        global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
        throw ex;
    }
}


module.exports = UserPbxBL;
