/**
 * Arquivo de configuração e inicialização da aplicação
 */
delete process.env["DEBUG_FD"];
var _ = require('lodash');
var path = require('app-root-path');
var express = require('express');
var bodyParser = require('body-parser');
var numeral = require('numeral');
var fs = require('fs');
var http = require('http');
var https = require('https');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var compression = require('compression');
var mongoose = require('mongoose');
var log4js = require('log4js');
var promise = require("bluebird");
var mongoAppender = require('log4js-node-mongodb');
var helmet = require('helmet');
var Error = require('extend-error');
var express_enforces_ssl = require('express-enforces-ssl');
var multipart = require('connect-multiparty');
var router = require(path + '/bin/route-settings.js');
var parameters_file = require(path + '/app-parameters.js');
var settings_file = require(path + '/app-settings.js');
var messages_file = require(path + '/app-messages.js');
var userClientPbxBL = require(path + '/business/pbx/client/UserClientPbxBL');
var user_client_bl = new userClientPbxBL();
var applicationBL = require(path + '/business/app/ApplicationBL');


//pametrização do serviço
var settings = global.server;

//config numeral
numeral.register('locale', 'br', {
    delimiters: {
        thousands: '.',
        decimal: ','
    },
    abbreviations: {
        thousand: 'k',
        million: 'm',
        billion: 'b',
        trillion: 't'
    },
    currency: {
        symbol: 'R$'
    }
});

//configuração do banco de dados MongoDB
var database = global.database;
var database_uri = null;
var database_uri_log = null;

//ativa bluebird promise para mongoose.
mongoose.Promise = require('bluebird');


var connect_option = {
    server: {poolSize: database.dev.poolSize},
}
database_uri = 'mongodb://' + database.dev.host + ":" + database.dev.port + "/" + database.dev.database_name;
database_uri_log = 'mongodb://' + database.dev.host + ":" + database.dev.port + "/" + database.dev.database_log_name;
mongoose.connect(database_uri, connect_option);


var db = mongoose.connection;
db.on('error', function (ex) {
    console.error.bind('MongoDB connection error: ' + JSON.stringify(ex));
});
db.on('open', function (callback) {
    console.info("Conectado ao banco de dados MongoDB em: " + database_uri);

    //Configurações de LOG
    var log_mode = [];
    if (settings.log.console) {
        log_mode.push({type: 'console'});
    }

    if (settings.log.file) {
        log_mode.push({type: 'file', filename: settings.log.file_path, category: settings.log.name});
    }

    log4js.configure({appenders: log_mode});

    if (settings.log.database) {
        log4js.addAppender(mongoAppender.appender({connectionString: database_uri_log,}), settings.log.name);
    }
    var logger = log4js.getLogger(settings.log.name);
    logger.setLevel(settings.log.level);
    global.logger = logger;




    //certificado SSL do Serviço
    var key = null;
    var cert = null;
    var ca_cert = null;
    // if (settings.mode == 'production' || settings.mode == 'homologa') {
    //     key = fs.readFileSync(path + '/ssl/55pbx_com.key');
    //     cert = fs.readFileSync(path + '/ssl/55pbx_com.crt');
    //     ca_cert = fs.readFileSync(path + '/ssl/55pbx_com.ca_bundle');
    // } else {
    key = fs.readFileSync(path + '/ssl/localhost-ssl.key');
    cert = fs.readFileSync(path + '/ssl/localhost-ssl.crt');
    // }
    var options_ssl = {
        ca: ca_cert,
        key: key,
        cert: cert,
    };


    //configuração do servidor express
    var app = express();
    app.enable('trust proxy');
    var route_list = new router
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(express.static(path + settings.web_path));
    app.use(cors());
    app.use(compression());
    app.use(helmet());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.noCache());
    app.use(helmet.dnsPrefetchControl({allow: false}));
    app.use(express_enforces_ssl());
    app.use(multipart({
        uploadDir: global.file_path,
    }));
    app.enabled('trust proxy');
    app.set('view engine', 'html');
    app = route_list.Load(app);
    app.use(log4js.connectLogger(logger, {level: log4js.levels.INFO}));
    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
        next();
    });
    logger.info("EXPRESS -> configuracoes carregadas com sucesso!");


    //configurações do servidor de aplicação HTTPS
    app.set('port', settings.https_port);
    /*https.globalAgent.options.secureProtocol = 'SSLv3_method';*/
    var server_https = https.createServer(options_ssl, app);
    server_https.listen(settings.https_port);
    server_https.on('error', onError);
    server_https.on('listening', onListeningHttps);


    //Criando servidor SOCKET da aplicação para realtime data
    var socket_io = require('socket.io')(server_https);
    global.app_socket = [];

    socket_io.on('connection', function ($client) {
        $client.on('getConnectionId', function (data) {

            return promise.try(promiseGetApplication)
                .then(promiseLogin)
                .catch(promiseError);

            function promiseGetApplication() {
                var application_bl = new applicationBL();
                return application_bl.GetApplicationForIdentifier(global.applications.pbx);
            }

            function promiseLogin(result) {
                logger.info('Novo usuário conectado: ', data.app + " / " + data.client_name + " / " + data.user_name + "(" + $client.id + ") -> " + data.branch_number);
                var ip = $client.handshake.address;
                $client.emit('receiveConnectionId', {id: $client.id});
                if (data.app != undefined && data.app != null) {
                    global.app_socket.push({
                        app: data.app,
                        branch_number: data.branch_number,
                        client_id: data.client_id,
                        client_name: data.client_name,
                        user_id: data.user_id,
                        user_name: data.user_name,
                        socket: $client,
                        id: $client.id,
                        logout: data.logout,
                        application: result
                    })
                }
            }

            function promiseError(ex) {
                global.logger.error('Processing error in the module: ' + __filename.split(/[\\/]/).pop(), ex);
            }
        });


        //valida socket em aberto
        $client.on('keepAlive', function (user_id) {
            /*logger.info('Conexão ativa do usuário: ', user_id + " / " + $client.id);*/
            $client.emit('keepalive.result', "200-OK");
        })

        $client.on('reconnect', function () {
            logger.info('Usuário foi reconectado: ', data.app + " / " + data.client_name + " / " + data.user_name + "(" + $client.id + ") -> " + data.branch_number);
            $client.emit('receiveConnectionId', {id: $client.id});
            if (data.app != undefined && data.app != null) {
                global.app_socket.push({
                    app: data.app,
                    branch_number: data.branch_number,
                    client_id: data.client_id,
                    client_name: data.client_name,
                    user_id: data.user_id,
                    user_name: data.user_name,
                    socket: $client,
                    id: $client.id,
                    logout: data.logout
                });
            }
            if (data.branch_number != undefined && data.branch_number != null) {
                user_client_bl.ExecuteLoginBranchNumberInCentral(data.branch_number, $client.handshake.address);
            }
        });


        $client.on('disconnect', function () {
            var socket = _.find(global.app_socket, {id: $client.id});
            if (socket != undefined && socket.app == global.applications.pbx) {
                if (socket.logout) {
                    user_client_bl.ExecuteLogoutBranchNumberInCentral(socket.client_id, socket.branch_number, socket.application);
                    logger.info("Um usuário se desconectou: " + socket.app + " - " + socket.client_name + " - " + socket.user_name + "(" + socket.branch_number + ")");
                }
                else {
                    logger.info("Um usuário se desconectou (não ramal): " + socket.app + " - " + socket.client_name + " - " + socket.user_name);
                }
                var aux = global.app_socket.indexOf(socket);
                global.app_socket.splice(aux, 1);
            }
        });
    });

    //socket para webcall
    global.app_socket_webcall = [];
    socket_io.on('connection', function ($client) {
        $client.on('getConnectionIdWebcall', function (data) {
            logger.info('Novo usuário webcall conectado: ', data.app + " / " + data.queue_name + " (" + data.client_id + ") -> " + data.phone);
            var ip = $client.handshake.address;
            $client.emit('receiveConnectionIdWebcall', {id: $client.id});
            if (data.app != undefined && data.app != null) {
                global.app_socket_webcall.push({
                    app: data.app,
                    phone: data.phone,
                    client_id: data.client_id,
                    queue_name: data.queue_name,
                    socket: $client,
                    id: $client.id
                });
            }
        });

    });

    //Normalização de porta do servidorpara: number, string, ou false.
    function normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            return val;
        }

        if (port >= 0) {
            return port;
        }

        return false;
    }


    //Evento de erro de conexão no servidor
    function onError(error) {
        logger.info("Ocorreu um erro ao inicializar o servidor.", Error);

        if (error.syscall !== 'listen') {
            throw error;
        }


        switch (error.code) {
            case 'EACCES':
                console.error(' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    //Evento para excutar eventos do servidor
    function onListeningHttps() {
        var addr_http = server_https.address();
        logger.info("Servidor HTTPS inicializado com sucesso na porta: " + settings.https_port);
    }


});

