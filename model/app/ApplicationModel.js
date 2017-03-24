/**
 * Objeto de Dados -> Application
 * @desc: representa objeto de uma aplicação disponível no sistema.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var model = new Schema({
    name: {type: String, trim: true},
    identifier: {type: String, trim: true},
    url: {type: String, trim: true},
    version_history: [{
        number: {type: String, trim: true},
        date: {type: Date, trim: true, default: Date.now},
        description: {type: String, trim: true},
        features: [{
            description: {type: String, trim: true}
        }]
    }],
    serialize: {type: String, trim: true},
    active: {type: Boolean, trim: true, default: true},
    company: {
        name: {type: String, trim: true},
        url: {type: String, trim: true},
    },
    settings: {
        api_central: [{
            name: {type: String, trim: true},
            address: {type: String, trim: true},
        }],
        wizard: {
            pabx: {type: String, trim: true},
            voip: {type: String, trim: true},
            webcall: {type: String, trim: true},
            ativo: {type: String, trim: true},
        },
        iugu: {
            id_account: {type: String, trim: true},
            token_sandbox: {type: String, trim: true},
            token_production: {type: String, trim: true},
            invoice: {
                invoice_tax: {type: Number, trim: true},
                invoice_tax_type: {type: String, trim: true},
            },
            card: {
                card_tax_type: {type: Number, trim: true},
                card_tax: {type: String, trim: true},
            }
        },
        payment: {
            active: {type: Boolean, trim: true, defaut: true},
            credit_card: {type: Boolean, trim: true, defaut: false},
            invoice: {type: Boolean, trim: true, defaut: true}
        },
        terms: {
            title: {type: String, trim: true},
            text: {type: String, trim: true}
        },
        email_user_register: {
            subject: {type: String, trim: true},
            text: {type: String, trim: true}
        },
        email_user_recovery: {
            subject: {type: String, trim: true},
            text: {type: String, trim: true}
        },
        email_client_register: {
            subject: {type: String, trim: true},
            text: {type: String, trim: true}
        },
        email_alerts: {
            register: [{type: String, trim: true}],
            support: [{type: String, trim: true}],
            commercial: [{type: String, trim: true}],
        },
        urls: {
            admin: {type: String, trim: true},
            webphone_chrome: {type: String, trim: true},
        },
        sip: [{
            sip_server: {type: String, trim: true},
            sip_public_identity: {type: String, trim: true},
            sip_realm: {type: String, trim: true},
            sip_websocket: {type: String, trim: true},
            sip_ice_servers: {type: String, trim: true},
            sip_terium_server: {type: String, trim: true},
        }],
        pbx: {
            phone: {
                type: {type: String, trim: true},
            },
            branch_number: {
                mask: {type: Number, trim: true},
                name: {type: String, trim: true},
                mode_name: {type: String, trim: true},
                password: {type: String, trim: true},
                ip: {type: String, trim: true},
                nameserver: {type: String, trim: true},
            },
            ddd: [{
                area_code: {type: String, trim: true},
                city: {type: String, trim: true},
            }]
        },
        integrations: [{
            name: {type: String, trim: true},
            url: {type: String, trim: true},
            user: {type: String, trim: true},
            password: {type: String, trim: true},
        }],
        sms: {
            username: {type: String, trim: true},
            password: {type: String, trim: true},
            from: {type: String, trim: true}
        }
    },
    email_settings: {
        "user": {type: String, trim: true},
        "password": {type: String, trim: true},
        "smtp": {type: String, trim: true},
        "ssl": {type: String, trim: true},
        "port": {type: String, trim: true},
        "template_path": {type: String, trim: true},
    },
    hosts: [{type: String, trim: true}],
    anticipated_day: {type: String, trim: true},
    update_at: {type: Date, trim: true, default: Date.now},
    create_at: {type: Date, trim: true, default: Date.now}
});

module.exports = mongoose.model('Application', model);
