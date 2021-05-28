'use strict'

var User = require('../models/User');
var Jobs = require('../models/Jobs');
var bcrypt = require('bcrypt-nodejs');
var uploadProfile = require("../middlewares/storageProfile");
var uploadBanner = require("../middlewares/storageBanner");
var uploadAvatar = require("../middlewares/storageAvatar");

var userProfilePath = "./uploads/users/profile/";
var userCoverPath = "./uploads/users/banner/";
var jwt = require('../services/jwt.js');
var fs = require('fs');
var path = require('path');
var axios = require('axios');
const cloudinary = require('../middlewares/cloudinary');

/*------------------- CLOUDINARY --------------*/
//API para que conecta con CLOUDINARY para almacenar fotos
const cloudinaryApi = require('cloudinary');
const dotenv = require('dotenv');

dotenv.config({ path: 'cloudinary.env' });

cloudinaryApi.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
//-------------------------------------------


//-------PRUEBAS--------
function home(req, res) {
    res.status(200).send({ message: 'Hola mundo' });
}

function pruebas(req, res) {
    res.status(200).send({ message: 'Accion de pruebas en el servidor de nodejs' });
}
//---------------------

//Registro
//Utiliza: form-data
/*
    id: String,
    name: String,
    surname: String,
    email: String,
    password: String,
    image: String,
    cover_page: String,
    type: String,
    lat: String,
    lon: String,
    last_time_connected: Date,
    created_at: Date

*/
function saveUser(req, res) {
    uploadProfile(req, res, async function (err) {
        if (err) {
            console.log(err);
            return res.end("Error uploading file 1");
        }

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/user/profile');
        var file = req.file;

        if (req.method === 'POST') {
            var urls = new Array();
            const { path } = file;
            const newPath = await uploader(path)
            urls.push(newPath)
            fs.unlinkSync(path)
        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }

        //DATOS
        var params = req.body;
        var user = new User();
        var file_name = req.file.filename;


        if (params.name && params.surname && params.email && params.password &&
            (params.suburb || params.cp || params.street)
            && params.state && params.city) {

            //Datos que se piden para la ubicación
            var location = params.cp + ' ' + params.street + ' ' + params.suburb + ',' + params.city + ' ' + params.state + ' Mexico';
            axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: location,
                    key: 'AIzaSyDgRN1AR5CnGjgdcc3f93CzMho80a2yWog'
                }
            }).then(function (resp) {
                //DATOS BASICOS
                user.name = params.name;
                user.surname = params.surname;
                user.email = params.email;
                user.type = params.type;

                //IMAGENES
                //user.image = file_name;
                user.image = urls;
                user.cover_page = null;

                //UBICACION
                user.lat = resp.data.results[0].geometry.location.lat;
                user.lon = resp.data.results[0].geometry.location.lng;
                user.country = params.country;
                user.state = params.state;
                user.city = params.city;

                //FECHA
                user.created_at = Date.now();
                user.last_time_connected = Date.now();
                User.find({
                    email: user.email.toLowerCase()
                }).exec((err, users) => {
                    if (err) {
                        return removeFileOfUploads(res, userProfilePath + file_name, "Error en la petición de usuarios");
                    }

                    if (users && users.length >= 1) {
                        return removeFileOfUploads(res, userProfilePath + file_name, "El usuario ya esta registrado");
                    } else {
                        //Cifra la password y me guarda los datos
                        bcrypt.hash(params.password, null, null, (err, hash) => {
                            user.password = hash;

                            user.save((err, userStored) => {
                                if (err) {
                                    console.log('sdsdsd');
                                    console.log(err);
                                    return removeFileOfUploads(res, userProfilePath + file_name, "Error al guardar el usuario");
                                }
                                if (userStored) {
                                    res.status(200).send({ user: userStored });
                                } else {
                                    return removeFileOfUploads(res, userProfilePath + file_name, "No se ha registrado el usuario");
                                }
                            });
                        });
                    }
                });

            }).catch(function (error) {
                return removeFileOfUploads(res, userProfilePath + file_name, "Error al procesar la ubicacion");
            });
        } else {
            return removeFileOfUploads(res, userProfilePath + file_name, "Envia todos los campos necesarios");
        }
    });

}


/* 
    LOGIN DEL USUARIO
    RUTA POR POST: /login
*/
function loginUser(req, res) {
    var params = req.body;

    var email = params.email;
    var password = params.password;

    if (email && password) {
        User.findOne({ email: email }, (err, user) => {
            if (err) return res.status(404).send({ message: 'Error en la peticion' });

            if (user) {
                bcrypt.compare(password, user.password, (err, check) => {
                    if (check) {
                        var userId = user._id;

                        //Devolver datos de usuario
                        if (params.gettoken) {
                            //Actualizamos la ultima vez que se conectó el usuario
                            User.findByIdAndUpdate(userId, { last_time_connected: Date.now() }, { new: true }, (err, userUpdated) => {
                                if (err) return res.status(500).send({ message: 'Error en la petición' });

                                if (!userUpdated) return res.status(404).send({ message: 'No se ha podido iniciar sesion' });

                                //generar y devolver token 
                                return res.status(200).send({
                                    token: jwt.createToken(user)
                                });
                            });

                        } else {
                            //Actualizamos la ultima vez que se conectó el usuario
                            User.findByIdAndUpdate(userId, { last_time_connected: Date.now() }, { new: true }, (err, userUpdated) => {
                                if (err) return res.status(500).send({ message: 'Error en la petición' });

                                if (!userUpdated) return res.status(404).send({ message: 'No se ha podido iniciar sesion' });

                                //Devolver datos en claro
                                user.password = undefined;
                                return res.status(200).send({ user });
                            });
                        }

                    } else {
                        return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
                    }
                });
            } else {
                return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
            }
        });
    }

}

/* 
    RUTA POR POST: /updateCoverPage
*/
//Edicion de datos de usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    //Borrar propiedad password
    delete update.password;
    if (userId != req.user.sub) {
        return res.status(200).send({ message: 'No tienes permiso para actualizar los datos del usuario' });
    }
    User.find({ email: update.email.toLowerCase() }
    ).exec((err, users) => {

        var user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId) user_isset = true;
        });

        if (user_isset) res.status(500).send({ message: 'Los datos ya estan en uso' });

        User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la petición' });

            if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

            return res.status(200).send({
                user: userUpdated
            });
        });

    });
}

/* 
    RUTA POR PUT: /update-location/:id
*/
//Método que actualiza la ubiacion dle usuario
async function updateLocation(req, res) {
    var userId = req.params.id;
    var update = req.body;

    if (update.street || update.suburb || update.cp) {
        let coords = await location(update);
        update.lat = coords.lat;
        update.lon = coords.lon;
    }

    User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

        return res.status(200).send({
            user: userUpdated
        });
    });

}

//Metodo de apoyo para obtiene la ubicacion del usuario
async function location(params) {
    let location = params.cp + ' ' + params.street + ' ' + params.suburb + ',' + params.city + ' ' + params.state + ' Mexico';
    var lat, lon;
    await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: location,
            key: 'AIzaSyDgRN1AR5CnGjgdcc3f93CzMho80a2yWog'
        }
    }).then(function (resp) {
        lat = resp.data.results[0].geometry.location.lat;
        lon = resp.data.results[0].geometry.location.lng;
    });

    return {
        lat,
        lon
    }
}

/* 
    RUTA POR POST: /updateCoverPage
*/
//Método que actualiza el banner del usuario
async function updateCoverPage(req, res) {
    uploadBanner(req, res, async function (err) {
        if (err) {
            return res.end("Error uploading file");
        }

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/user/banner');
        var file = req.file;

        if (req.method === 'POST') {
            var urls = new Array();
            const { path } = file;
            const newPath = await uploader(path)
            urls.push(newPath)
            fs.unlinkSync(path)


        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }

        //DATOS
        var email = req.body.email;
        var file_name = urls
        var old_file_name = '';
        User.find({ email: email }).exec((err, user) => {
            if (err) {
                return res.status(200).send({ message: 'Error al obtener la imagen del usuario' });
            }
            if (user) {
                old_file_name = user[0].cover_page ? user[0].cover_page[0].id : '';
                if (email && file_name) {
                    User.findOneAndUpdate({ email: email }, { $set: { cover_page: file_name } }).exec((err, user) => {
                        if (err) {
                            return removeFileOfUploads(res, userCoverPath + file_name, "Error al actualizar el banner");
                        }

                        if (user) {
                            removeFileOfUploads(old_file_name);
                            return res.status(200).send({ message: 'Imagen cargada correctamente' });
                        }
                    });
                }
            }
        });
    });
}

/* 
    RUTA POR POST: /updateAvatar
*/
//Método que actualiza la imagen avatar del usuario
function updateAvatar(req, res) {
    uploadAvatar(req, res, async function (err) {
        if (err) {
            return res.end("Error uploading file");
        }

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/user/profile');
        var file = req.file;

        if (req.method === 'POST') {
            var urls = new Array();
            const { path } = file;
            const newPath = await uploader(path)
            urls.push(newPath)
            fs.unlinkSync(path)


        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }


        //DATOS
        var email = req.body.email;
        var file_name = urls;
        var old_file_name = '';
        User.find({ email: email }).exec((err, user) => {
            if (err) {
                return res.status(200).send({ message: 'Error al obtener la imagen del usuario' });
            }
            if (user) {
                old_file_name = user[0].image ? user[0].image[0].id : '';
                if (email && file_name) {
                    User.findOneAndUpdate({ email: email }, { $set: { image: file_name } }).exec((err, user) => {
                        if (err) {
                            return removeFileOfUploads(file_name.id);
                        }
                        if (user) {
                            removeFileOfUploads(old_file_name);
                        }
                    });
                }
            }
        });
    });
}

//Metodo que remueve la imagen del servidor de imagenes
function removeFileOfUploads(old_file_name) {
    cloudinaryApi.v2.uploader.destroy(old_file_name, function (result) { console.log(result) });
}


module.exports = {
    pruebas,
    home,
    saveUser,
    updateCoverPage,
    loginUser,
    updateUser,
    updateAvatar,
    updateLocation
}