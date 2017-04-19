var mongoose = require('mongoose');
var path = require('app-root-path');
var Schema = mongoose.Schema;

var model = new Schema({
    routeName : {type: String, required: true, trim: true},
    callerId : {type: String, required: true, trim: true},
    musicOnHold : {type: String, required: false, trim: true},
    hostIp : {type: Number, required: false, trim: true},
    techPrefix : {type: Number, required: false, trim: true},
    port : {type: Number, required: false, trim: true},
    user : {type: String, required: false, trim: true},
    userPassword : {type: String, required: false, trim: true},
    outboundRoutes : [
        {
            ddrNumber: {type: Number, required: false, trim: true},
            destination : {type: Number, required: false, trim: true},
        }
    ],

});

module.exports = model;