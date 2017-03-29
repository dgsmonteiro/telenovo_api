var mongoose = require('mongoose');
var path = require('app-root-path');
var Schema = mongoose.Schema;

var model = new Schema({
    queueName : {type: String, required: true, trim: true},
    queueNumber : {type: Number, required: true, trim: true},
    groupStrategy : {type: String, required: false, trim: true},
    groupMusic : {type: String, required: false, trim: true},
    callRecording : {type: String, required: false, trim: true},
    branches : [
        {
            user_id: {type: Number, required: false, trim: true},
            branch_number : {type: Number, required: false, trim: true},
            name : {type: String, required: false, trim: true},
        }
    ],

});

module.exports = model;