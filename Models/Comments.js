'use strict'

//CREACION DE ENTIDAD COMMENTS
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentsSchema = Schema({
    id: String,
    emitter: {type: Schema.ObjectId, ref: 'User'}, //El User que deja el comentario
    receiver: {type: Schema.ObjectId, ref: 'User'}, //User, el id se va a sacar de UserJob, UserProduct o UserService
    activity_id: String, //UserJob, UserProduct o UserService
    created_at: Date,
    text: String
});

module.exports = mongoose.model('Comments', CommentsSchema);