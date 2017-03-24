/**
 * Objeto de Dados -> Client
 * @desc: representa os Clientes do 55PBX
 */

var mongoose = require('mongoose')
require('mongoose-double')(mongoose);
var path = require('app-root-path');
var Schema = mongoose.Schema;
var userClientPbxModel = require(path + '/model/pbx/client/UserClientPbxModel');
var branchNumberModel = require(path + '/model/pbx/client/BranchNumberClientPbxModel');
var types = mongoose.Schema.Types;


var model = new Schema({
    central_id: {type: Number, trim: true, unique: true},
    sip_server: {type: String, trim: true},
    api_central: {type: String, trim: true},
    system_type: {type: String, trim: true, default: 'ativo'},
    register_date: {type: Date, trim: true, defaut: new Date()},
    suspended: {type: Boolean, trim: true, default: false},
    active: {type: Boolean, trim: true, default: true},
    register_completed: {type: Boolean, required: false, trim: true, default: false},
    source: {type: String, trim: true},
    registered: {type: Boolean, trim: true, default: false},
    demo: {type: Boolean, required: false, trim: true, default: false},
    document: {type: String, trim: true},
    type: {type: String, trim: true},
    name: {type: String, trim: true},
    email: {type: String, trim: true, unique: true},
    commercial_name: {type: String, required: false, trim: true},
    commercial_segment: {type: String, required: false, trim: true},
    contact_name: {type: String, required: false, trim: true},
    phone: {type: String, trim: true},
    cell_phone: {type: String, required: false, trim: true},
    revenues_order: {type: String, trim: true},
    paid: {type: Boolean, required: false, trim: true, default: false},
    payment_day: {type: String, trim: true, default: new Date()},
    payment_mode: {type: String, trim: true, default: 'pre'},
    pbx: {
        user: [userClientPbxModel],
        branch_number: [branchNumberModel],
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('pbx.client', model);
