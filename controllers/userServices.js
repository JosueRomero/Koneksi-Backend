'use strict'

const UserServices = require('../models/UserServices');
const uploadServices = require("../middlewares/storageServices"); // Para imágenes
const User = require('../models/User');
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

var fs = require('fs');
var path = require('path');

function home(req, res) {
    res.status(200).send({ message: 'Hola mundo' });
}

/* 
    RUTA POR POST: /saveUserServices
*/
// Método que realiza el registro de los servicios de una empresa
function saveUserServices(req, res) {

    // Error de la imagen
    uploadServices(req, res, async function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error al subir el archivo");0
        }

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/userService');
        var files = req.files;

        if (req.method === 'POST') {
            var urls = new Array();
            for (const file of files) {
                const { path } = file;
                const newPath = await uploader(path)
                urls.push(newPath)
                fs.unlinkSync(path)
            }

        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }

        // Datos
        var params = req.body;
        var userServices = new UserServices();
        var file_name = req.files;

        // Error en caso de que falten datos
        if (!params.description || !params.schedule || !params.id)
            return res.status(400).send("Faltan datos para la creación del servicio")

        // Asignacion de atributos al objeto userServices
        userServices.description = params.description;
        userServices.schedule = params.schedule;
        userServices.user = params.id;

        // Tags
        userServices.tags = params.tags.split(',');


        // Imagenes
        for (let i = 0; i < file_name.length; i++) {
            userServices.images[i] = urls[i];
        }

        // Guardado del objeto
        userServices.save((err, userServicesStored) => {
            if (err) {
                for (let i = 0; i < userServices.images.length; i++) {
                    removeFileOfUploads(userServices.images[i].id);
                }
                return res.status(500).send("Error al guardar");
            }
            if (!userServicesStored) {
                for (let i = 0; i < userServices.images.length; i++) {
                    removeFileOfUploads(userServices.images[i].id);
                }
                return res.status(404).send("No se encontró el objeto de userService");
            }

            return res.status(200).send({ userServices: userServicesStored });
        })
    });
}

/* 
    RUTA POR PUT: /update-images
*/
//Método que actualiza la imagen de un servicio
function updateImages(req, res) {
    uploadServices(req, res, async function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error al subir el archivo");
        }


        var userServiceId = req.body.id;
        var imagenes = new Array();

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/userService');
        var files = req.files;

        if (req.method === 'PUT') {
            var urls = new Array();
            for (const file of files) {
                const { path } = file;
                const newPath = await uploader(path)
                urls.push(newPath)
                fs.unlinkSync(path)
            }

        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }


        // Imagenes
        for (let i = 0; i < urls.length; i++) {
            imagenes.push(urls[i]);
        }

        UserServices.update({ '_id': userServiceId }, { $addToSet: { images: { $each: imagenes } } }).exec().then(response => {
            if (response) {
                return res.status(200).send({ message: "Imagenes agregadas con éxito" });
            }
        }).catch(err => {
            if (err) {
                for (let i = 0; i < file_name.length; i++) {
                    removeFileOfUploads(urls[i].id);
                }
                return res.status(200).send({ message: "Error al subir las imagenes" });
            }
        });

    });
}

/* 
    RUTA POR POST: /updateUserServices/:id
*/
//Método que actualiza los datos del servicio de un usuario
function updateUserServices(req, res) {
    var userServicesId = req.params.id;
    var update = req.body;
    UserServices.findByIdAndUpdate(userServicesId, update, (err, userServicesUpdated) => {
        console.log(err);
        if (err) return res.status(500).send("Error al actualizar");
        if (!userServicesUpdated) return res.status(404).send("No existe el userService a actulizar");

        return res.status(200).send({ userServices: userServicesUpdated });
    });
}


/* 
    RUTA POR PUT: /delete-photo/:id
*/
//Método que elimina una foto de un servicio 
function deletePhoto(req, res) {
    var id = req.params.id;
    var idimage = req.body.id;
    UserServices.update({ 'user': id }, { $pull: { 'images': {'id' : idimage} } }).exec().then(response => {
        if (!response) return res.status(200).send({ message: 'Error al borrar la imagen' });
        if (response) {
            console.log(response);
            removeFileOfUploads(idimage);
            return res.status(200).send({ message: 'Imagen borrada con éxito' });
        }
    }).catch(error => {
        if (error) {
            return res.status(200).send({ message: 'Error al borrar la imagen' });
        }
    });

}

/* 
    RUTA POR GET: /get-user-services/:id?/:page?
*/
//Método que retorna los servicios en general o el servicio de un usuario
function getUserservices(req, res) {
    var userId = req.params.id;

    if (userId && userId != 1) {
        UserServices.find({ user: userId }, { user: 0 }).exec((err1, services) => {
            if (err1) return res.status(500).send({ message: 'Error al buscar el servicio' });
            if (!services) return res.status(404).send({ message: 'No hay servicio que mostrar' });

            User.find({ _id: userId }, { password: 0 }).exec((err2, user) => {
                if (err2) return res.status(500).send({ message: 'Error al buscar servicios' });
                if (!user) return res.status(404).send({ message: 'No hay servicio que mostrar' });

                return res.status(200).send({
                    services,
                    user
                });
            });
        });
    } else {
        var page = 1;
        if (req.params.page) {
            page = req.params.page;
        }
        var itemsPerPage = 5;
        //Todos los servicios desordenados
        UserServices.find().populate('user', 'name surname image cover_page lat lon').paginate(page, itemsPerPage, (err, services, total) => {
            if (err) return res.status(500).send({ message: 'Error al buscar servicios' });

            if (!services) return res.status(404).send({ message: 'No hay productos que mostrar' });
            //console.log(result);
            return res.status(200).send({
                services,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    }
}

/* 
    RUTA POR DELETE: /deleteUserServices
*/
//Método que borra el servicio de un usuario
function deleteUserServices(req, res) {
    var serviceId = req.params.id;
    var serviceImagesPaths = [];
    var userServiceId = 0;

    UserProducts.findById({ '_id': serviceId }, (err, service) => {

        for (let i = 0; i < params.images.length; i++) {
            serviceImagesPaths[i] = service.images[i];
        }

        userServiceId = service.user;
    });

    //Se comprueba que el que va a borrar el servicio, sea el que lo creó
    if (userServiceId == req.user.sub) {
        UserServices.deleteOne({ 'user': req.user.sub, '_id': serviceId }, (err, result) => {
            if (err) return res.status(500).send({ message: 'Error al borrar el servicio' });

            // Checar imagenes -------------------------------------------------------------------------------
            for (let i = 0; i < serviceImagesPaths.length; i++) {
                removeFileOfUploads(serviceImagesPaths[i].id);
            }

            return res.status(200).send({ message: 'Servicio borrado correctamente' });
        });
    }
}


/* -------------Remover la imagen del server--------------------- */
function removeFileOfUploads(old_file_name) {
    cloudinaryApi.v2.uploader.destroy(old_file_name, function (result) { console.log(result) });
}


module.exports = {
    home,
    saveUserServices,
    updateUserServices,
    getUserservices,
    deleteUserServices,
    deletePhoto,
    updateImages
}