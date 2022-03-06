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

router.get('/prueba',(req,res) => {

    res.send("Hola");

});



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



app.post('/consult_admin_for_id',router ,(req, res) => {

    let query = { _id: { $eq : req.body.id} };

    adminModel.findOne( query, (err, respuesta) => {

        if(err){
            res.send({
                codigo: -1,
                error: err.message ,
                mensaje: { mensaje: err.message}
            })
        }

        if(respuesta === null){

            res.send( {
                codigo: 0,
                error: "Sin errores",
                mensaje: `El usuario no existe`
                
            });
        }

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

    adminModel.findOne(query, (err, retorno) => {

        retorno.LoggedIn = true;
        
        retorno.updateOne({LoggedIn:retorno.LoggedIn},(err, respuesta) =>{
            if(err){
                res.send({
                    codigo: -1,
                    error: err.message ,
                    mensaje: err.message
                })
            }

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

    adminModel.findOne(query, (err, retorno) => {

        retorno.LoggedIn = false;
        
        retorno.updateOne({LoggedIn:retorno.LoggedIn},(err, respuesta) =>{
            if(err){
                res.send({
                    codigo: -1,
                    error: err.message ,
                    mensaje: err.message
                })
            }

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

app.post('/consult_admin', (req, res) => {  

    let query = { $and: [ { Nombre: { $eq : req.body.nombre} }, { Password: { $eq: req.body.password  } } ]  };
    
    adminModel.findOne( query, (err, respuesta) => {

        if(err){
            res.send( {
                codigo: -1,
                error: err.message ,
                mensaje:  err.message
            });
        }

        if(respuesta === null){

            res.send( {
                codigo: 0,
                error: "Sin errores",
                mensaje: `El usuario o el password es incorrecto`
                
            });
        }

        else{
            const payload = {
                check:true
            };
    
            const token = jwt.sign(payload, app.get('key'),{
                expiresIn: "7d"
            });

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

app.post('/register_company',router, (req, res) => {  
    let objectCompany = new companyModel();
    objectCompany.Nombre = req.body.nombre;
    objectCompany.Rif = req.body.rif;
    objectCompany.Direccion = req.body.direccion;
    

    let idValid;

    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValid = req.body.idAdmin;
    }

    else{
        idValid = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let query =  { _id : mongoose.Types.ObjectId(idValid)};

    adminModel.findOne(query, (err, respuesta) =>{

        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo registrar la compañia",
                mensaje: err.message
            });
        }
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "Sin errores",
                mensaje: "No existe el admin"
            });
        }
        else{

            objectCompany.IdAdmin = req.body.idAdmin;
    
            if(respuesta.LoggedIn){
                objectCompany.save( (err, respuesta) => { 
                    if(err){
            
                        res.send( {
                            codigo:-1,
                            error: "No se pudo registrar la compañia",
                            mensaje: err.message
                        });
                    }
                    else{
                        res.send({
                            codigo:1,
                            error: "Sin errores",
                            mensaje: "La compañia se guardo con exito"
                        });
                    }
            
                 });
            }
            else{
                res.send( {
                    codigo:0,
                    error: "No se pudo registrar la compañia",
                    mensaje: "Debe estar autenticado para registrar una compañia"
                });
            }
        }
    })

    
});

app.put('/update_company',router ,(req, res) => {
    
    let idValidAdmin;

    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValidAdmin = req.body.idAdmin;
    }

    else{
        idValidAdmin = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let queryAdmin =  { _id : mongoose.Types.ObjectId(idValidAdmin)};

    adminModel.findOne(queryAdmin, (err, respuesta) => {

        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo registrar la compañia",
                mensaje: err.message
            });
        }
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "No existe el id del administrador",
                mensaje: `No existe el admin`
            });
        }
        else{
            if(respuesta.LoggedIn){

                let idValidCompany;

                if(mongoose.isValidObjectId(req.body.idCompany)){
                    idValidCompany = req.body.idCompany;
                }

                else{
                    idValidCompany = "aaaaaaaaaaaaaaaaaaaaaaaa";
                }

                let queryCompany =  { _id : mongoose.Types.ObjectId(idValidCompany)};

                companyModel.findOne(queryCompany,(err, retorno) => {
                    if(err){
                        res.send({
                            codigo:-1,
                            error: "Error",
                            mensaje: err.message
                        });
                    }
                    if(retorno === null){
                        res.send({
                            codigo: 0,
                            error: "Sin errores",
                            mensaje:  `No existe la compañia que quiere actualizar`
                        });
                    }

                    else{
                        
                        retorno.updateOne({
                            Nombre:req.body.nombreCompany,
                            Rif:req.body.rifCompany,
                            Direccion:req.body.direccionCompany
                        },(err, respuesta) =>{
                            if(err){
                                res.send({
                                    codigo: -1,
                                    error: err.message ,
                                    mensaje: err.message
                                })
                            }
                    
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

    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValidAdmin = req.body.idAdmin;
    }

    else{
        idValidAdmin = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let queryAdmin =  { _id : mongoose.Types.ObjectId(idValidAdmin)};

    adminModel.findOne(queryAdmin, (err, respuesta) => {

        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo consultar las compañias",
                mensaje: err.message
            });
        }
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "No existe el id del administrador",
                mensaje: `No existe el admin`
            });
        }
        else{
            if(respuesta.LoggedIn){

                companyModel.find({IdAdmin:respuesta._id},(err, resultado) => {
                    
                    if(err){
                        res.send({
                            codigo:-1,
                            error: "No se pudo consultar las compañias",
                            mensaje: err.message
                        });
                    }
                    if(resultado === null){
                        res.send({
                            codigo:0,
                            error: "No existe el id del administrador",
                            mensaje: `No existe el admin`
                        });
                    }
                    else{
                        res.send({
                            codigo:1,
                            error: "Si existe el id del administrador",
                            mensaje: resultado
                        });
                    }
                });
            }

            else{
                res.send({
                    codigo:0,
                    error: "Sin errores",
                    mensaje: `Debes de estar autenticado para consultar las compañias`
                });
            }
        }

    });
});

app.delete('/delete_company', router,(req, res) => {
    
    let idValidAdmin;

    if(mongoose.isValidObjectId(req.body.idAdmin)){
        idValidAdmin = req.body.idAdmin;
    }

    else{
        idValidAdmin = "aaaaaaaaaaaaaaaaaaaaaaaa";
    }

    let queryAdmin =  { _id : mongoose.Types.ObjectId(idValidAdmin)};

    adminModel.findOne(queryAdmin, (err, respuesta) => {

        if(err){
            res.send({
                codigo:-1,
                error: "No se pudo eliminar la compañia",
                mensaje: err.message
            });
        }
        if(respuesta === null){
            res.send({
                codigo:0,
                error: "No existe el id del administrador",
                mensaje: `No existe el admin`
            });
        }
        else{
            if(respuesta.LoggedIn){

                let idValidCompany;

                if(mongoose.isValidObjectId(req.body.idCompany)){
                    idValidCompany = req.body.idCompany;
                }

                else{
                    idValidCompany = "aaaaaaaaaaaaaaaaaaaaaaaa";
                }

                let queryCompany =  { _id : mongoose.Types.ObjectId(idValidCompany)};

                companyModel.findOne(queryCompany,(err, retorno) => {
                    if(err){
                        res.send({
                            codigo: -1,
                            error: "Error",
                            mensaje: { mensaje: err.message}
                        });
                    }
                    if(retorno === null){
                        res.send({
                            codigo:0,
                            error: "Sin errores",
                            mensaje:  `No existe la compañia que quiere eliminar`
                        });
                    }

                    else{
                        
                        retorno.remove({
                            IdAdmin:req.body.idCompany
                        },(err, respuesta) =>{
                            if(err){
                                res.send({
                                    codigo: -1,
                                    error: err.message ,
                                    mensaje: err.message
                                })
                            }
                    
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