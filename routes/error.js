var express = require('express');
var router = express.Router();

//Rota de Erro da aplicação - página inexistente

/**
 * @apiSuccessExample {json} Sucesso
 *    HTTP/1.1 200 OK
 *    {
 *      "status": "active",
 *      "name": "text",
 *      "corporate": "text",
 *      "version": "text",
 *      "message": "text", 
 *    }
 *
 */
router.use(function (req, res) {    
    var retorno = global.api;
    retorno.status = "active";
    retorno.message = "Error 404! API route not found!";
    res.status(404).json(retorno);
});

module.exports = router;
