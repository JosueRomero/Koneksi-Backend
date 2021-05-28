'use strict'

//CREACION DE USERSERVICES
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserServicesSchema = Schema({
    id: String,
    user: {type: Schema.ObjectId, ref: 'User'},
    description: String,
    schedule: String,
    images: [Object],
    tags: [String]
});
 
module.exports = mongoose.model('UserServices', UserServicesSchema);