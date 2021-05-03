'use strict'

// IMPORTACIONES
const Usuario = require('../modelos/usuario.model');
const bcrypt = require("bcrypt-nodejs");
const jwt = require('../servicios/jwt');

// FUNCION EJEMPLO
// Otra forma de exportar y trabajar.
// exports.ejemplo = (req, res) => {
//     res.status(200).send({ mensaje: 'Hola, soy un ejemplo! :D' })
// }
function ejemplo(req, res) {
    if (req.user.rol === 'ROL_USUARIO') { 
        res.status(200).send({ mensaje: `Hola, mi nombre es ${req.user.rol} ` }) 
    } else{
        res.status(200).send({ mensaje: 'No es un Usuario' })
    }
    
}

function registrar(req, res) {
    var usuarioModel = new Usuario();
    var params = req.body;
    console.log(params);
    if (params.usuario && params.email && params.password) {
        usuarioModel.nombre = params.nombre;
        usuarioModel.usuario = params.usuario;
        usuarioModel.email = params.email;
        usuarioModel.rol = 'ROL_USUARIO';
        usuarioModel.imagen = null;

        Usuario.find({
            $or: [
                { usuario: usuarioModel.usuario },
                { email: usuarioModel.email }
            ]
        }).exec((err, usuariosEncontrados) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion del Usuario' })

            if (usuariosEncontrados && usuariosEncontrados.length >= 1) {
                return res.status(500).send({ mensaje: 'El usuario ya existe' })
            } else {
                bcrypt.hash(params.password, null, null, (err, passwordEncriptada) => {
                    usuarioModel.password = passwordEncriptada;

                    usuarioModel.save((err, usuarioGuardado) => {
                        if (err) return res.status(500).send({ mensaje: 'Error al guardar el Usuario' })

                        if (usuarioGuardado) {
                            res.status(200).send(usuarioGuardado)
                        } else {
                            res.status(404).send({ mensaje: 'No se ha podido registrar el Usuario' })
                        }
                    })
                })
            }
        })
    }
}

function obtenerUsuarios(req, res) {
    // Usuario.find().exec((err, usuariosEncontrados)=>{})
    Usuario.find((err, usuariosEncontrados) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de Obtener Usuarios' })
        if (!usuariosEncontrados) return res.status(500).send({ mensaje: 'Error en la consulta de Usuarios' })
        // usuariosEncontrados === [datos] ||  !usuariosEncontrados === [] <-- no trae nada
        return res.status(200).send({ usuariosEncontrados })
        // {
        //     usuariosEncontrados: ["array de lo que contenga esta variable"]
        // }

    })
}

function obtenerUsuarioID(req, res) {
    var idUsuario = req.params.idUsuario
    // User.find({ _id: idUsuario }, (err, usuarioEncontrado)=>{})  <---- Me retorna un Array = [] || usuarioEncontrado[0].nombre
    // User.findOne({ _id: idUsuario }, (err, usuarioEncontrado)=>{})  <--- Me retorna un objeto = {} || usuarioEncontrado.nombre
    Usuario.findById(idUsuario, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion del Usuario' })
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'Error en obtener los datos del Usuario' })
        console.log(usuarioEncontrado.email);
        return res.status(200).send({ usuarioEncontrado })
    })
}

function login(req, res) {
    var params = req.body;

    Usuario.findOne({ email: params.email }, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });

        if (usuarioEncontrado) {                                               //TRUE || FALSE 
            bcrypt.compare(params.password, usuarioEncontrado.password, (err, passCorrecta) => {
                if (passCorrecta) {
                    if (params.obtenerToken === 'true') {
                        return res.status(200).send({
                            token: jwt.createToken(usuarioEncontrado)
                        });
                    } else {
                        usuarioEncontrado.password = undefined;
                        return res.status(200).send({ usuarioEncontrado })
                    }
                } else {
                    return res.status(404).send({ mensaje: 'El usuario no se ha podido identificar' })
                }
            })
        } else {
            return res.status(404).send({ mensaje: 'El usuario no ha podido ingresar' })
        }
    })
}

function editarUsuario(req, res) {
    var idUsuario = req.params.idUsuario;
    var params = req.body;

    // BORRAR LA PROPIEDAD DE PASSWORD PARA QUE NO SE PUEDA EDITAR
    delete params.password;

    // req.user.sub <--- id Usuario logeado
    if(idUsuario != req.user.sub){
        return res.status(500).send({ mensaje: 'No posees los permisos necesarios para actulizar este Usuario.' });
    }

    Usuario.findByIdAndUpdate(idUsuario, params, { new: true }, (err, usuarioActualizado)=>{
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion' });
        if(!usuarioActualizado) return res.status(500).send({ mensaje: 'No se ha podido actualizar al Usuario' });
        // usuarioActualizado.password = undefined;
        return res.status(200).send({ usuarioActualizado });
    })

    
}

function editarUsuarioADMIN(req, res) {
    var idUsuario = req.params.idUsuario;
    var params = req.body;

    // BORRAR LA PROPIEDAD DE PASSWORD PARA QUE NO SE PUEDA EDITAR
    delete params.password;

    if(req.user.rol != "ROL_ADMIN"){
        return res.status(500).send({ mensaje: "Solo el Administrador puede editarlos" })
    }

    Usuario.findByIdAndUpdate(idUsuario, params, { new: true }, (err, usuarioActualizado)=>{
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion' });
        if(!usuarioActualizado) return res.status(500).send({ mensaje: 'No se ha podido actualizar al Usuario' });
        // usuarioActualizado.password = undefined;
        return res.status(200).send({ usuarioActualizado });
    })

    
}


function eliminarUsuario(req, res) {
    const idUsuario = req.params.idUsuario;

    if(idUsuario != req.user.sub){
        return res.status(500).send({ mensaje: 'No posee los permisos para eliminar a este Usuario.' })
    }

    Usuario.findByIdAndDelete(idUsuario, (err, usuarioEliminado)=>{
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion de Eliminar' });
        if(!usuarioEliminado) return res.status(500).send({ mensaje: 'Error al eliminar el usuario.' });

        return res.status(200).send({ usuarioEliminado });
    })
}

function eliminarUsuarioAdmin(req, res) {
    const idUsuario = req.params.idUsuario;

    if(req.user.rol != 'ROL_ADMIN'){
        return res.status(500).send({mensaje: 'Solo puede eliminar el Administrador.'})
    }

    Usuario.findByIdAndDelete(idUsuario, (err, usuarioEliminado)=>{
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion de Eliminar' });
        if(!usuarioEliminado) return res.status(500).send({ mensaje: 'Error al eliminar el usuario.' });

        return res.status(200).send({ usuarioEliminado });
    })
}

module.exports = {
    ejemplo,
    registrar,
    obtenerUsuarios,
    obtenerUsuarioID,
    login,
    editarUsuario,
    eliminarUsuario,
    editarUsuarioADMIN,
    eliminarUsuarioAdmin
}