const express = require('express');
const bodyparser = require('body-parser');
const methodoverride = require('method-override');
const http = require('http');
const jwt = require('jsonwebtoken');
const keys = require('./settings/keys');
const cors = require('cors');
const { Router } = require('express');
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const companyModel = require('./CompanyDataDB');
const adminModel = require('./AdministratorDataDB');
const e = require('express');
const { sign } = require('crypto');
const { route } = require('express/lib/router');
mongoose.connect('mongodb+srv://migueleonrojas:Venezuela.2022@cluster0.tsjtp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', (err, res) => {

    
    if(err){ 
        throw err;
    }
    else{
        console.log('Conexion con el servidor de manera exitosa');
    }
    /*  */
    

});



const app = express();
app.use(cors());
app.set('key',keys.key);
app.use(bodyparser.urlencoded({ extended:false }));
app.use(bodyparser.json());
app.use(express.json( { limit: '50mb' } ));
app.use(methodoverride());



const router = express.Router();

//validaciones que se crean para proteger las rutas con la autenticacion jwt
router.use((req, res, next) =>{

    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if(!token){
        res.status(401).send({
            codigo: 0,
            error: "Sin errores",
            mensaje: 'Es necesario el token de autenticacion'
            
        })
        return
    }

    if(token.startsWith('Bearer ')){
        token = token.slice(7, token.length);
        console.log(token);
    }

    if(token){
        jwt.verify(token, app.get('key'), (error, decoded) => {
            if(error){
                return res.json({
                    codigo: 0,
                    error: "Sin errores",
                    mensaje: 'El token no es valido'
                })
            }
            else{
                req.decoded = decoded;
                next();
            }
        });
    }

});


//consulta por id
app.post('/consult_admin_for_id',router ,(req, res) => {

    let query = { _id: { $eq : req.body.id} };

    adminModel.findOne( query, (err, respuesta) => {

        //si sucede algun error
        if(err){
            res.send({
                codigo: -1,
                error: err.message ,
                mensaje: { mensaje: err.message}
            })
        }
        //si la respuesta no trae nada
        if(respuesta === null){

            res.send( {
                codigo: 0,
                error: "Sin errores",
                mensaje: `El usuario no existe`
                
            });
        }
        //si todo fue exitoso
        else{
            res.send({
                codigo: 1,
                error: "Sin errores",
                mensaje: `El usuario existe`,
                dataAdmin: respuesta
            });
        }

    });

});

app.put('/login',router,(req, res) => {
    
    let query = { _id: req.body.id };

    //busca por id
    adminModel.findOne(query, (err, retorno) => {

        //modifica el estatus para que aparezca que esta logueado
        retorno.LoggedIn = true;
        
        retorno.updateOne({LoggedIn:retorno.LoggedIn},(err, respuesta) =>{
            //si sucede un error
            if(err){
                res.send({
                    codigo: -1,
                    error: err.message ,
                    mensaje: err.message
                })
            }
            //si todo fue exitoso
            else{
                
                res.send({
                    codigo: 1,
                    error:  'No hay errores' ,
                    mensaje: retorno
                })
            }
        })      

    });   

});

app.put('/logoff',router,(req, res) => {
    
    let query = { _id: req.body.id };
    //busca por id
    adminModel.findOne(query, (err, retorno) => {

        //modifica el estatus para que aparezca que esta no logueado
        retorno.LoggedIn = false;
        
        retorno.updateOne({LoggedIn:retorno.LoggedIn},(err, respuesta) =>{
            //si hubo errores
            if(err){
                res.send({
                    codigo: -1,
                    error: err.message ,
                    mensaje: err.message
                })
            }
            //si todo fue exitoso
            else{
                res.send({
                    codigo: 1,
                    error:  'No hay errores' ,
                    mensaje: retorno
                })
            }
        })      

    });   

});

//consulta por nombre y password
app.post('/consult_admin', (req, res) => {  

    let query = { $and: [ { Nombre: { $eq : req.body.nombre} }, { Password: { $eq: req.body.password  } } ]  };
    
    adminModel.findOne( query, (err, respuesta) => {

        //si hubo un error
        if(err){
            res.send( {
                codigo: -1,
                error: err.message ,
                mensaje:  err.message
            });
        }

        //si no hubo exito
        if(respuesta === null){

            res.send( {
                codigo: 0,
                error: "Sin errores",
                mensaje: `El usuario o el password es incorrecto`
                
            });
        }

        //si hubo exito
        else{
            const payload = {
                check:true
            };
            //crea el token
            const token = jwt.sign(payload, app.get('key'),{
                expiresIn: "7d"
            });

            //envia el resultado para guardar el token
            res.send({
                codigo: 1,
                error: "Sin errores",
                mensaje: `Bienvenido ${req.body.nombre}`,
                dataAdmin: respuesta,
                token:token
            });
        }

    });
    
});

//para registrar un admin
app.post('/register_administrator',router, (req, res) => {  

    let objectAdmin = new adminModel();
    objectAdmin.Nombre = req.body.nombre;
    objectAdmin.Password = req.body.password;
    objectAdmin.LoggedIn = false

    objectAdmin.save((err, respuesta) => {

        if(err){
            res.send( {
                codigo:-1,
                error: "No se pudo registrar el admin",
                mensaje: err.message
            });
        }

        else{
            res.send({
                codigo:1,
                error: "Sin errores",
                mensaje: "El admin se guardo con exito"
            });
        }

    });
    
});

//registra una compania
app.post('/register_company',router, (req, res) => {  
    let objectCompany = new companyModel();
    objectCompany.Nombre = req.body.nombre;
    objectCompany.Rif = req.body.rif;
    objectCompany.Direccion = req.body.direccion;
    

    let idValid;
    //valida si el codigo es valido para crear un object id
    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValid = req.body.idAdmin;
    }
    //si no se crea uno por defecto
    else{
        idValid = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let query =  { _id : mongoose.Types.ObjectId(idValid)};

    //se busca por id
    adminModel.findOne(query, (err, respuesta) =>{

        //si hubo errores
        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo registrar la compañia",
                mensaje: err.message
            });
        }
        //si no hubo respuesta
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "Sin errores",
                mensaje: "No existe el admin"
            });
        }
        else{
            //a la compania se le asigna el id del admin que lo creo
            objectCompany.IdAdmin = req.body.idAdmin;
            //valida que el admin este logueado para registrar la compania
            if(respuesta.LoggedIn){
                objectCompany.save( (err, respuesta) => { 
                    //si hubo un error
                    if(err){
                        res.send( {
                            codigo:-1,
                            error: "No se pudo registrar la compañia",
                            mensaje: err.message
                        });
                    }
                    //se guardo la empresa
                    else{
                        res.send({
                            codigo:1,
                            error: "Sin errores",
                            mensaje: "La compañia se guardo con exito"
                        });
                    }
            
                 });
            }
            //si no esta logueado no se registra la empresa
            else{
                res.send( {
                    codigo:0,
                    error: "No se pudo registrar la compañia",
                    mensaje: "Debe estar logueado para registrar una compañia"
                });
            }
        }
    });

    
});

//actualiza una empresa
app.put('/update_company',router ,(req, res) => {
    
    let idValidAdmin;

    let admin = req.body;

    //valida si el codigo es valido para crear un object id
    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValidAdmin = req.body.idAdmin;
    }
    //si no se crea uno por defecto
    else{
        idValidAdmin = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let queryAdmin =  { _id : mongoose.Types.ObjectId(idValidAdmin)};
    //se busca por id el admin
    adminModel.findOne(queryAdmin, (err, respuesta) => {
        //si hubo error
        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo registrar la compañia",
                mensaje: err.message
            });
        }
        //si el admin no existe
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "No existe el id del administrador",
                mensaje: `No existe el admin`
            });
        }
        //si se encontro
        else{
            //se valida que este logueado
            if(respuesta.LoggedIn){

                let idValidCompany;

                //se valida el id valido para crear un object id
                if(mongoose.isValidObjectId(req.body.idCompany)){
                    idValidCompany = req.body.idCompany;
                }
                //si no se crea uno por defecto
                else{
                    idValidCompany = "aaaaaaaaaaaaaaaaaaaaaaaa";
                }

                let queryCompany =  { _id : mongoose.Types.ObjectId(idValidCompany)};
                //se busca la empresa
                companyModel.findOne(queryCompany,(err, retorno) => {
                    //si hubo error
                    if(err){
                        res.send({
                            codigo:-1,
                            error: "Error",
                            mensaje: err.message
                        });
                    }
                    //si no encontro la empresa
                    if(retorno === null){
                        res.send({
                            codigo: 0,
                            error: "Sin errores",
                            mensaje:  `No existe la compañia que quiere actualizar`
                        });
                    }
                    //si la encuentra
                    else{
                        //actualiza los datos de la empresa
                        retorno.updateOne({
                            Nombre:req.body.nombreCompany,
                            Rif:req.body.rifCompany,
                            Direccion:req.body.direccionCompany
                        }, admin, { runValidators: true },(err, respuesta) =>{
                            //si hubo errores
                            if(err){
                                res.send({
                                    codigo: -1,
                                    error: err.message ,
                                    mensaje: err.message
                                })
                            }
                            //si se actualizo con exito
                            else{
                                res.send({
                                    codigo: 1,
                                    error:  'No hay errores',
                                    mensaje: respuesta
                                })
                            }
                        }) 
                        
                    }

                });
                
            }
            
        }
       

    });   

});

app.post('/consult_companies', router, (req, res) =>{

    let idValidAdmin;
    //se valida un id valida para crear un object id
    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValidAdmin = req.body.idAdmin;
    }
    //si no se crea un por defecto
    else{
        idValidAdmin = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let queryAdmin =  { _id : mongoose.Types.ObjectId(idValidAdmin)};

    //se busca el admin por el id
    adminModel.findOne(queryAdmin, (err, respuesta) => {

        if(err){
            //si hubo error
            res.send({
                codigo:-1,
                error: "No se pudo consultar las compañias",
                mensaje: err.message
            });
        }
        //si no existe el admin
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "No existe el id del administrador",
                mensaje: `No existe el admin`
            });
        }
        //si hubo exito
        else{
            //se valida que este logueado
            if(respuesta.LoggedIn){
                //encuentra las empresas que creo el admin logueado
                companyModel.find({IdAdmin:respuesta._id},(err, resultado) => {
                    //si hubo error
                    if(err){
                        res.send({
                            codigo:-1,
                            error: "No se pudo consultar las compañias",
                            mensaje: err.message
                        });
                    }
                    //si no existen
                    if(resultado === null){
                        res.send({
                            codigo:0,
                            error: "No existe el id del administrador",
                            mensaje: `No existe el admin`
                        });
                    }
                    //te muestran todas las empresas
                    else{
                        res.send({
                            codigo:1,
                            error: "Si existe el id del administrador",
                            mensaje: resultado
                        });
                    }
                });
            }
            //si no esta logueado el admin
            else{
                res.send({
                    codigo:0,
                    error: "Sin errores",
                    mensaje: `Debes de estar logueado para consultar las compañias`
                });
            }
        }

    });
});

app.delete('/delete_company', router,(req, res) => {
    
    let idValidAdmin;
    //se valida el id para crear un object id
    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValidAdmin = req.body.idAdmin;
    }
    //si no se crea uno por defecto
    else{
        idValidAdmin = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let queryAdmin =  { _id : mongoose.Types.ObjectId(idValidAdmin)};
    //se buca el admin por id
    adminModel.findOne(queryAdmin, (err, respuesta) => {
        //si hubo errores
        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo eliminar la compañia",
                mensaje: err.message
            });
        }
        //si no existe
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "No existe el id del administrador",
                mensaje: `No existe el admin`
            });
        }
        //si se encuentra
        else{
            //si esta logueado
            if(respuesta.LoggedIn){

                let idValidCompany;
                //se valida un id para crear un object id para consultar el object id de la compania
                if(mongoose.isValidObjectId(req.body.idCompany)){
                    idValidCompany = req.body.idCompany;
                }
                //se crea uno por defecto si no es valido
                else{
                    idValidCompany = "aaaaaaaaaaaaaaaaaaaaaaaa";
                }

                let queryCompany =  { _id : mongoose.Types.ObjectId(idValidCompany)};
                //se busca por id de la compania
                companyModel.findOne(queryCompany,(err, retorno) => {
                    //si hay errores
                    if(err){
                        res.send({
                            codigo: -1,
                            error: "Error",
                            mensaje: { mensaje: err.message}
                        });
                    }
                    //si no hay resultados
                    if(retorno === null){
                        res.send({
                            codigo:0,
                            error: "Sin errores",
                            mensaje:  `No existe la compañia que quiere eliminar`
                        });
                    }

                    else{
                        //si hubo exito elimina
                        retorno.remove({
                            IdAdmin:req.body.idCompany
                        },(err, respuesta) =>{
                            //si hay error
                            if(err){
                                res.send({
                                    codigo: -1,
                                    error: err.message ,
                                    mensaje: err.message
                                })
                            }
                            //si fue exitoso
                            else{
                                res.send({
                                    codigo: 1,
                                    error:  'No hay errores',
                                    mensaje: respuesta
                                })
                            }
                        }) 
                        
                    }

                });
                
            }

            
        }   

    });   

});






app.listen(process.env.PORT || 3000, () =>{
    console.log(`El servidor esta corriendo`);

})


app.use(router);