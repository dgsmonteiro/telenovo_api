/**
 * Objeto de Dados -> Transaction
 * @desc: representa objeto de uma transação de aplicação.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var model = new Schema({
    type: {type: String, trim: true},
    transacao_id: {type: String, trim: true},
    source: {type: String, trim: true},
    parameters: {type: String, trim: true},
    headers: {type: String, trim: true},
    body: {type: String, trim: true},
    service: {type: String, trim: true},
    application: {type: String, trim: true},
    user: {type: String, trim: true},
    client: {type: String, trim: true},
    response: Schema.Types.Mixed,
    exception: Schema.Types.Mixed,
    create_at: {type: Date, trim: true, default: Date.now}
});

module.exports = mongoose.model('Transaction', model);
