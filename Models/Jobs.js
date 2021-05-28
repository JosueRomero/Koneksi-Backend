'use strict'

//CREACION DE ENTIDAD JOBS
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JobsSchema = Schema({
    id: String,
    name: String
});

module.exports = mongoose.model('Jobs', JobsSchema);