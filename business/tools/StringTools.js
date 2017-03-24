/**
 * Classe -> StringTools
 * @desc: Biblioteca de funções para strings
 */

var crypto = require("crypto-js");
var random = require("randomstring");

/**
 *  @param $length
 * @desc Gera string com caracteres aleatórios para uso como password.
 */
exports.GeneratePassword = function ($length) {
    var result = random.generate({
        length: $length,
        charset: 'ABCDEEFGHIJKLMNOPQRSTUVWXYZ@#$%&?!1234567890abcdefghijklmnopqrstuvwxyz',
    });
    return result
}

/**
 *  @param $string
 * @desc Gera hash SHA512 para string informada.
 */
exports.ConvertStringToHashSHA512 = function ($string) {
    var hash = crypto.SHA512($string);
    var result = hash.toString(crypto.enc.Base64);
    return result;
}


/**
 * Remove acentos de uma string
 * @param text
 * @returns {*}
 * @constructor
 */
exports.RemoveAccent = function (text) {
    try {
        var map = {
            "â": "a",
            "Â": "A",
            "à": "a",
            "À": "A",
            "á": "a",
            "Á": "A",
            "ã": "a",
            "Ã": "A",
            "ê": "e",
            "Ê": "E",
            "è": "e",
            "È": "E",
            "é": "e",
            "É": "E",
            "î": "i",
            "Î": "I",
            "ì": "i",
            "Ì": "I",
            "í": "i",
            "Í": "I",
            "õ": "o",
            "Õ": "O",
            "ô": "o",
            "Ô": "O",
            "ò": "o",
            "Ò": "O",
            "ó": "o",
            "Ó": "O",
            "ü": "u",
            "Ü": "U",
            "û": "u",
            "Û": "U",
            "ú": "u",
            "Ú": "U",
            "ù": "u",
            "Ù": "U",
            "ç": "c",
            "Ç": "C"
        };
        return text.replace(/[\W\[\] ]/g, function (a) {
            return map[a] || a
        })

    }
    catch (ex) {
        throw ex;
    }
}

/***
 * Remove caracteres especiais de uma string
 * @param text
 * @returns {*}
 * @constructor
 */
exports.RemoveSpecialCharacters = function (text) {
    try {
        return text.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    }
    catch (ex) {
        throw ex;
    }
}

/**
 * Troca espaços por caracteres especiais
 * @param text
 * @returns {string|*}
 * @constructor
 */
exports.ChangeSpaceForUnderline = function (text) {
    try {
        str = text.trim();
        str = str.split(" ").join("_");
        return str;
    }
    catch (ex) {
        throw ex;
    }
}

