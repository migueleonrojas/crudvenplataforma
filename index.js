const express = require('express');
const bodyparser = require('body-parser');
const methodoverride = require('method-override');
const http = require('http');
const cors = require('cors');

const { Router } = require('express');
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const companyModel = require('./CompanyDataDB');
const adminModel = require('./AdministratorDataDB');
const e = require('express');
mongoose.connect('mongodb+srv://migueleonrojas:Venezuela.2022@cluster0.tsjtp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', (err, res) => {

    
    if(err) throw err;

    console.log('Conexion con el servidor de manera exitosa');

});

const app = express();
app.use(cors());

app.use(bodyparser.urlencoded({ extended:false }));
app.use(bodyparser.json());
app.use(express.json( { limit: '50mb' } ));
app.use(methodoverride());

const router = express.Router();

router.post('/consult_admin_for_id',(req, res) => {

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

router.put('/login',(req, res) => {
    
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

router.put('/logoff',(req, res) => {
    
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

router.post('/consult_admin', (req, res) => {  

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
            res.send({
                codigo: 1,
                error: "Sin errores",
                mensaje: `Bienvenido ${req.body.nombre}`,
                dataAdmin: respuesta
            });
        }

    });
    
});

router.post('/register_administrator', (req, res) => {  

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

router.post('/register_company', (req, res) => {  
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

router.put('/update_company',(req, res) => {
    
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

router.post('/consult_companies', (req, res) =>{

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

router.delete('/delete_company',(req, res) => {
    
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





/* const port = 3000;
app.listen(port, () =>  {

    console.log(`El servidor esta corriendo en el puerto ${port}`);

}); */

app.use(router);