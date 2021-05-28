'use strict'

//CREACION DE ENTIDAD FAVORITES
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FavoritesSchema = Schema({
    id: String,
    user: {type: Schema.ObjectId, ref: 'User'},
    userSaved: {type: Schema.ObjectId, ref: 'User'},
    accType: String
});

module.exports = mongoose.model('Favorites', FavoritesSchema);