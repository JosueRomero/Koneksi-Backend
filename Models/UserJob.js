'use strict'

//CREACION DE ENTIDAD USERJOB
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userJobSchema = Schema({
    id: String,
    user: {type: Schema.ObjectId, ref: 'User'},
    jobs: {type: Schema.ObjectId, ref: 'Jobs'},
    description: String,
    schedule: String,
    tags: [String]
});


module.exports = mongoose.model('UserJob', userJobSchema);