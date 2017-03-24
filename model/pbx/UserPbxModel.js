/**
 * Objeto de Dados -> User
 * @desc: representa um usuário do sistema PBX.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var model = new Schema({
    email: {type: String, trim: true},
    name: {type: String, trim: true},
    document: {type: String, trim: true},
    gender: {type: String, trim: true},
    mobile_phone: {type: String, trim: true},
    birth_date: {type: String, trim: true},
    img_url: {type: String, trim: true},
    password: {type: String, trim: true},
    token: {type: String, trim: true},
    registered: {type: Boolean, trim: true, default: false},
    language: {type: String, trim: true},
    history_password: [{
        ip: {type: String, trim: true},
        transaction_id: {type: String, trim: true},
        token: {type: String, trim: true},
        date: {type: Date, trim: true, default: Date.now},
    }],
}, {
    timestamps: true
});

module.exports = mongoose.model('pbx.user', model);
