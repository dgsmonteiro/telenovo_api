/** Configuração do Servidor **/
global.server = {
    mode: 'dev', // dev / homologa / production
    dev_ip: '172.0.0.1',
    https_port: 30500,
    domain: 'telenovo.com',
    log: {
        database: false,
        console: true,
        file: false,
        file_path: '/bcr/telenovo/log/telenovo_log_api.log',
        level: 'ALL',
        name: 'telenovo_api'
    },
    motor_task_minutes: 1,
    motor_task_day: 31,
    quick_update_active: true
};

/** Configuração do Banco de dados **/
global.database = {
    dev: {
        database_name: 'TELENOVO_DEV',
        database_log_name: 'TELENOVO_DEV_LOG',
        port: '27017',
        host: 'localhost',
        poolSize: 1,
    }
}
