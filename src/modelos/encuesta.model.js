'use strict'

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var EncuestaSchema = Schema({
    titulo: String,
    descripcion: String,
    opinion: {
        si: Number,
        no: Number,
        ninguna: Number,
        usuariosEncuestados: []
    },
    listaComentarios: [{
        textoComentario: String,
        idUsuarioComentario: { type: Schema.Types.ObjectId, ref: 'Usuarios'} 
    }],
    creadorEncuesta: { type: Schema.Types.ObjectId, ref: 'Usuarios' }
})

module.exports = mongoose.model('Encuestas', EncuestaSchema);