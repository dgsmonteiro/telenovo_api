var mongoose = require('mongoose');
var path = require('app-root-path');
var Schema = mongoose.Schema;

var model = new Schema({
    group_capture : {type: Number, required: false, trim: true},
    group_caller : {type: Number, required: false, trim: true},
    branch : {type: Number, required: false, trim: true},
    name : {type: String, required: false, trim: true},
    password : {type: String, required: false, trim: true},
    email : {type: String, required: false, trim: true},
    port : {type: Number, required: false, trim: true},
    context : {type: String, required: false, trim: true},
    voicemail : {type: Boolean, required: false, trim: true},
    updatedAt: {type: Date, required: false, trim: true, default: new Date()},
    createdAt: {type: Date, required: false, trim: true, default: new Date()},
});

module.exports = model;