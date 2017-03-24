var mongoose = require('mongoose');
var path = require('app-root-path');
var Schema = mongoose.Schema;

var model = new Schema({
        user_id: {type: String, required: false, trim: true},
        name: {type: String, required: false, trim: true},
        email: {type: String, required: false, trim: true},
        permission : {type: String, required: false, trim: true},
        active: {type: Boolean, required: false, trim: true, default: true},
        updatedAt: {type: Date, required: false, trim: true, default: new Date()},
        createdAt: {type: Date, required: false, trim: true, default: new Date()},
});


module.exports = model;
