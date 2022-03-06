const mongoose = require('mongoose');
const schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const validator = require('validator');

let companySchema = new schema ({
    Nombre: {
        type: String,
        required: [true, 'El nombre de la empresa no puede estar vacio'],
        unique: true,
        trim: true

    },
    Rif: {
        type: String,
        required: [true, 'El rif no puede estar vacio'],
        unique: true,
        trim: true
    },
   
    Direccion:{
        type: String,
        required: [true, 'La direccion no puede estar vacio'],
        unique: true,
        trim: true
    },

    IdAdmin:{
        type: String,
        required: [true, 'Se debe indicar el Id del admin que esta registrando la empresa'],
    }
});

companySchema.plugin(uniqueValidator, { message: 'El campo {PATH} ya se encuentra registrado' });

module.exports = mongoose.model('Company', companySchema);