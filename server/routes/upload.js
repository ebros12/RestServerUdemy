const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const Usuario = require('../models/usuario');
const Producto = require('../models/producto');
const fs = require('fs');
const path = require('path')
    // default options
app.use(fileUpload());

app.put('/upload/:tipo/:id', function(req, res) {
    let tipo = req.params.tipo;
    let id = req.params.id;
    if (Object.keys(req.files).length == 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No se a ingresado el archivo'
            }
        });
    }
    //Valida Tipo
    let tiposValidos = ['productos', 'usuarios'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las tipos permitidos son ' + tiposValidos.join(', ')
            }
        });
    }
    let archivo = req.files.archivo;
    let nombreArchivoCortado = archivo.name.split('.');
    let extension = nombreArchivoCortado[nombreArchivoCortado.length - 1]
    console.log(extension);
    //Extenciones Permitidas
    let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg', 'jfif']
    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las extensiones permitidas son' + extensionesValidas.join(', '),
                ext: extension
            }
        });
    }

    //Cambiar nombre al archivo
    let nombreArchivo = `${ id }-${ new Date().getMilliseconds()}.${extension}`;
    archivo.mv(`uploads/${tipo}/${ nombreArchivo }`, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (tipo == "usuarios") {
            imagenUsuario(id, res, nombreArchivo)
        } else {
            imagenProducto(id, res, nombreArchivo)
        }

    });

});

function imagenUsuario(id, res, nombreArchivo) {
    Usuario.findById(id, (err, usuarioDB) => {
        console.log(usuarioDB);
        if (err) {
            borraArchivo(nombreArchivo, 'usuarios')
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!usuarioDB) {
            borraArchivo(nombreArchivo, 'usuarios')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no existe'
                }
            });
        }

        borraArchivo(usuarioDB.img, 'usuarios')
        usuarioDB.img = nombreArchivo;

        usuarioDB.save((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                usuario: usuarioDB,
                img: nombreArchivo
            })
        })

    })
}

function imagenProducto(id, res, nombreArchivo) {
    Producto.findById(id, (err, ProductoDB) => {
        console.log(ProductoDB);
        if (err) {
            borraArchivo(nombreArchivo, 'productos')
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!ProductoDB) {
            borraArchivo(nombreArchivo, 'productos')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no existe'
                }
            });
        }
        borraArchivo(ProductoDB.img, 'productos')
        ProductoDB.img = nombreArchivo;

        ProductoDB.save((err, ProductoDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                Producto: ProductoDB,
                img: nombreArchivo
            })
        })

    })
}

function borraArchivo(nombreImagen, tipo) {
    let pathImagen = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImagen}`);
    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen);
    }
}
module.exports = app;