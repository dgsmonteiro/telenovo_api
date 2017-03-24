/** Configuração da API **/
global.api = {
    name: "55tec_plataform",
    corporation: "BCR Call Center Ltda.",
    version: '2.0.0',
}


/** Configuração de Aplicações **/
global.applications = {
    admin: 'teleNovoAdmin'
}


/** Configuração to Token de acesso por usuário **/
global.token = {
    key: 'admin#web@TELENOVO%2017',
    expire_seconds: 56000,
};


/** Configuração do níveis de permissionamento por tipo de aplicação **/
global.permission = {
    pbx: {
        user: 0,
        supervisor: 5,
        admin: 10
    }
};

global.level = {
    support: {
        user: 'user',
        director: 'director',
    }
};

/** Configuração de pastas de gravação no sistema **/
global.file_paths = {
    server: {
        virtual: "/etc/asterisk"
    }
}





