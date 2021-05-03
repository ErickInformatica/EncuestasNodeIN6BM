'use strict'

var Encuesta = require('../modelos/encuesta.model');
var mongoose = require('mongoose')

function agregarEncuesta(req, res) {
    var params = req.body;
    var encuestaModel = new Encuesta();

    if(params.titulo && params.descripcion){
        encuestaModel.titulo = params.titulo;
        encuestaModel.descripcion = params.descripcion;
        encuestaModel.opinion = {
            si: 0,
            no:0,
            ninguna:0,
            usuariosEncuestados: []
        };
        encuestaModel.creadorEncuesta = req.user.sub;

        encuestaModel.save((err, encuestaGuardada)=>{
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion de la Encuesta' });
            if(!encuestaGuardada) return res.status(500).send({ mensaje: 'Error al agregar la Encuesta' });

            return res.status(200).send({ encuestaGuardada });
        })
    }else{
        res.status(500).send({
            mensaje: 'Rellene los datos necesarios para crear la Encuesta'
        });
    }
}

function obtenerEncuestas(req, res) {
    Encuesta.find().populate('creadorEncuesta', 'nombre email').exec((err, encuestasEncontradas)=>{
        console.log(err);
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion de encuestas' });
        if(!encuestasEncontradas) return res.status(500).send({ mensaje: 'Error al obtener las encuestas' });
        return res.status(200).send({ encuestasEncontradas });
    })
}

function agregarComentarioEncuesta(req, res) {
    var encuestaID = req.params.idEncuesta;
    var params = req.body;

    Encuesta.findByIdAndUpdate(encuestaID, { $push: { listaComentarios: { textoComentario: params.comentario, idUsuarioComentario: req.user.sub } } },
        {new: true}, (err, comentarioAgregado)=>{
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion del comentario' });
            if(!comentarioAgregado) return res.status(500).send({ mensaje: 'Error al agregar el comentario a la encuesta' });
            return res.status(200).send({ comentarioAgregado });
        })
}

function editarComentarioEncuesta(req, res) {
    var encuestaId = req.params.idEncuesta;
    var comentarioId = req.params.idComentario;
    var params = req.body;
   
    Encuesta.findOneAndUpdate({ _id: encuestaId, "listaComentarios._id": comentarioId, 'listaComentarios.idUsuarioComentario': req.user.sub }, 
    { "listaComentarios.$.textoComentario": params.comentario }, {new: true, useFindAndModify: false}, (err, comentarioEditado)=>{
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion de Comentario' });
        if(!comentarioEditado) return res.status(500).send({ mensaje: 'No posee los permisos para editar este comentario' });
        return res.status(200).send( {comentarioEditado} )
    } )
}

function obtenerComentario(req, res) {
    var encuestaId = req.params.idEncuesta;
    var comentarioId = req.params.idComentario;

    Encuesta.findOne({ _id: encuestaId, "listaComentarios._id": comentarioId }, { "listaComentarios.$": 1, titulo: 1, creadorEncuesta:1 }, (err, comentarioEncontrado)=>{
        if(err) return res.status(500).send({ mensaje: 'Error en la peticion de Encuestas' });
        if(!comentarioEncontrado) return res.status(500).send({ mensaje: 'Error al obtener el comentario' });
        return res.status(200).send({ comentarioEncontrado })
    })
}

function eliminarComentario(req, res) {
    var comentarioId = req.params.idComentario;
   
    Encuesta.findOneAndUpdate({ "listaComentarios._id" : comentarioId}, { $pull: { listaComentarios : { _id: comentarioId } } },
    {new: true, useFindAndModify: false},(err, comentarioEliminado)=>{
        if(err) return res.status(500).send({mensaje: 'Error en la peticion de Comentario'});
        if(!comentarioEliminado) return res.status(500).send({ mensaje: 'Error al eliminar el Comentario' });

        return res.status(200).send({ comentarioEliminado })
    })
}

function obtenerComenarioPorTexto(req, res) {
    var bodyTextoComentario = req.body.textoComentario;
    var encuestaId = req.params.idEncuesta;


    Encuesta.aggregate([ 
        {
            $match: { "_id": mongoose.Types.ObjectId(encuestaId) }
        },
        {
            $unwind: "$listaComentarios" //
        },
        {
            $match: { "listaComentarios.textoComentario": { $regex: bodyTextoComentario, $options: 'i' } }
        },
        {
            $group:{
                "_id" : "$_id",
                "titulo": {"$first":" $titulo"},
                "listaComentarios": { $push: "$listaComentarios" }
            }
        }

    ]).exec((err, ok)=>{
        console.log(err);
        return res.status(200).send({ ok })
    })
}

module.exports = {
    agregarEncuesta,
    obtenerEncuestas,
    agregarComentarioEncuesta,
    editarComentarioEncuesta,
    obtenerComentario,
    eliminarComentario,
    obtenerComenarioPorTexto
}