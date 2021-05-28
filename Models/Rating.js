'use strict'

//CREACION DE USERSERVICES
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RatingSchema = Schema({
    id: String,
    user: {type: Schema.ObjectId, ref: 'User'},
    userSaved: {type: Schema.ObjectId, ref: 'User'},
    rating: Number
});

module.exports = mongoose.model('Rating', RatingSchema);