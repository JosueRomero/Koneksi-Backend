'use strict'

//CREACION DE USERSERVICES
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessagesSchema = Schema({
    id: String,
    emitter: {type: Schema.ObjectId, ref: 'User'},
    receiver: {type: Schema.ObjectId, ref: 'User'},
    text: String,
    created_at: Date,
    checked: Boolean
});

module.exports = mongoose.model('Messages', MessagesSchema);