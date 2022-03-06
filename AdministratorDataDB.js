const mongoose = require('mongoose');
const schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const validator = require('validator');

let adminSchema = new schema ({
    
    Nombre: {
        type: String,
        required: [true, 'El nombre del admin no puede estar vacio'],
        unique: true,
        trim: true

    },
    Password: {
        type: String,
        required: [true, 'El password no puede estar vacio'],
        trim: true
    },
    
    LoggedIn:{
        type:Boolean,
        required: [true, 'El login no debe estar vacio'],
        
    }
});

adminSchema.plugin(uniqueValidator, { message: 'El campo {PATH} ya se encuentra registrado' });

module.exports = mongoose.model('Administrator', adminSchema);