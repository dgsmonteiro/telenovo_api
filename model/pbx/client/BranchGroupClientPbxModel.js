var mongoose = require('mongoose');
var path = require('app-root-path');
var Schema = mongoose.Schema;

var model = new Schema({
    queueName : {type: Text, required: true, trim: true},
    queueNumber : {type: Number, required: true, trim: true},
    groupStrategy : {type: Text, required: false, trim: true},
    groupMusic : {type: String, required: false, trim: true},
    callRecording : {type: String, required: false, trim: true},
    branches : {type: Array, required: false, trim: true},
    failOverDestination : {type: String, required: false, trim: true},

});

module.exports = model;