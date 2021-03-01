'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_IN6BM';

exports.ensureAuth = function (req, res, next) {
    if(!req.headers.authorization){
        return res.status(401).send({ mensaje: 'La peticion no tiene la cabezara de Autorizacion' });
    }

    var token = req.headers.authorization.replace(/['"]+/g, '');

    try {
        var payload = jwt.decode(token, secret);
        // Exp = a variable que contiene el tiempo de expiracion del token
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                mensaje: 'El Token ha expirado'
            });
        }
    } catch (error) {
        return res.status(404).send({
            mensaje: 'El Token no es valido'
        });
    }

    req.user = payload;
    next();
}