/*jslint node: true */

/**
 * @copyright 2013 Instaclick Inc.
 * @author    Nick Matantsev <nick.matantsev@gmail.com>
 */

'use strict';

var Fusio                  = require('./lib/Fusio'),

    defaultFlashPolicyPort = 10843; // compiled-in to the Socket.IO client

exports.listen = function (port, flashPolicyPort) {
    return new Fusio(port, flashPolicyPort || defaultFlashPolicyPort);
};
