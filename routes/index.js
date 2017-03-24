var express = require('express');
var router = express.Router();
var path = require('app-root-path');

/**
 * Rota inicial da aplicação
 */
router.get('/', function (req, res) {
    res.sendFile(path + '/doc/index.html');
});

router.get('/api/status', function (req, res) {
    var retorno = global.api;
    retorno.status = "active";
    retorno.message = "Restricted access! Authorized to registered applications and customers.";
    res.status(200).json(retorno);
});

module.exports = router;
