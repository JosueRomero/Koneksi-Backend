'use strict'

//CREACION DE USERPRODUCTS
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserProductsSchema = Schema({
    id: String,
    user: {type: Schema.ObjectId, ref: 'User'},
    name: String,
    original_name: String,
    image: [Object],
    price: Number,
    description: String,
    tags: [String]
});


module.exports = mongoose.model('UserProducts', UserProductsSchema);