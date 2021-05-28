'use strict'
var mongoosePaginate = require('mongoose-pagination');
var Comment = require('../models/Comments');
var Rating = require('../models/Rating');
var axios = require('axios');


function probando(req, res) {
    res.status(200).send({ message: 'Probando' });
}


/* 
    RUTA POR POST: /comment
*/
//Método que guarda el comentario  
function saveComment(req, res) {
    var params = req.body;

    if (!params.text || !params.receiver) return res.status(500).send({ message: 'Error' });

    var comment = new Comment();
    comment.emitter = req.user.sub; //usuario loggeado. La propiedad sub es el id.
    comment.receiver = params.receiver; //req.body.receiver
    comment.text = params.text;
    comment.activity_id = params.activity_id;
    comment.created_at = Date.now();

    comment.save((err, commentStored) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!commentStored) return res.status(500).send({ message: 'Error al enviar el mensaje' });

        return res.status(200).send({ message: commentStored });
    });
}

/* 
    RUTA POR POST: /deleteComment
*/
//Metodo que elimina
function deleteComment(req, res) {
    var Id = req.body.receiverId;
    Comment.remove({ "_id": Id, "emitter": req.user.sub }).exec((err, delCom) => {
        if (err) return res.status(500).send({ message: "Error al borrar el comentario" });
        return res.status(200).send({ message: "Comentario borrado exitosamente" });
    });
}

/* 
    RUTA POR POST: /getComment/:page?
*/
//Metodo que retorna los comentarios de un usuario
function getComments(req, res) {
    var userId = req.body.receiver;
    var actId = req.body.activity_id;

    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 4;

    Comment.find({ receiver: userId, activity_id: actId }).populate('emitter', 'name surname image').paginate(page, itemsPerPage, (err, comment, total) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!comment) return res.status(404).send({ message: 'No hay mensajes' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            comment
        });
    });
}

/* 
    RUTA POR POST: /saveRating
*/
//Verificar que solo se pueda dejar un rating por persona
function saveRating(req, res) {

    var rate = new Rating();
    rate.user = req.user.sub;
    rate.userSaved = req.body.userSaved;
    rate.rating = req.body.rating;

    Rating.find( { user: rate.user, userSaved: rate.userSaved }, function (err, results) {
        if (err) { return res.status(500).send({ message: 'Error en la petición' }); }
        if (!results.length) {
            rate.save((err, ratingStored) => {
                if (err) return res.status(500).send({ message: 'Error en la petición' });
                if (!ratingStored) return res.status(500).send({ message: 'Error al guardar tu calificación' });
    
            return res.status(200).send({ message: "Calificación guardada" });
        });
        return;
        }

        Rating.findByIdAndUpdate(results[0]._id, { rating : rate.rating }, { new: true }, (err, ratingUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la petición' });
            return res.status(200).send({
                rating: ratingUpdated
            });
        });

    });

}

/* 
    RUTA POR POST: /getRating/:userSaved
*/
//Método que obtiene el rating de un usuario
function getRating(req, res) {
    var userSav = req.params.userSaved;

    Rating.find({ userSaved: userSav }).exec((err, valor) => {
        if (err) return res.status(500).send({ message: "Error al buscar calificacion del usuario" });
        let promedio = 0;
        let tamano = 0;
        if (valor.length == 0) {
            promedio = 0;
        } else {

            valor.forEach(num => {
                promedio += num.rating;
                tamano += 1;
            });

            promedio /= tamano;
        }

        return res.status(200).send({ promedio: Math.round(promedio) });
    });
}

/* 
    RUTA POR POST: /getDistance
*/
//Metodo que retorna la distancia entre dos puntos (latFrom, lonFrom, latTo, lonTo)
function getDistance(req, res){
    var origin = req.body.latFrom + ',' + req.body.lonFrom;
    var destination = req.body.latTo + ',' + req.body.lonTo;

    axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
            units: 'km',
            origins: origin,
            destinations: destination,
            key: 'AIzaSyDgRN1AR5CnGjgdcc3f93CzMho80a2yWog'
        }
    }).then(function (resp) {
        return res.status(200).send({
            distanceText: resp.data.rows[0].elements[0].distance.text,
            distanceValue: resp.data.rows[0].elements[0].distance.value
        });

    }).catch(err => {
        console.log(err);
    });
}

module.exports = {
    probando,
    saveComment,
    deleteComment,
    getComments,
    saveRating,
    getRating,
    getDistance
};