/*jslint node: true */

/**
 * @copyright 2013 Instaclick Inc.
 * @author    Nick Matantsev <nick.matantsev@gmail.com>
 */

'use strict';

var EventEmitter = require('events').EventEmitter,
    util         = require('util');

function FusioClient(messageStream) {
    this.stream = messageStream;

    this.stream.on('data', this.onMessage.bind(this));
    this.stream.on('end', this.onEnd.bind(this));

    // write initial connect message
    this.stream.write('1:::');
}

util.inherits(FusioClient, EventEmitter);

FusioClient.prototype.onMessage = function (message) {
    var eventData, eventName, eventArguments;

    // parse event message
    if (message.substring(0, 4) !== '5:::') {
        return;
    }

    try {
        eventData      = JSON.parse(message.substring(4));
        eventName      = eventData.name;
        eventArguments = eventData.args;
    } catch (error) {
        // silently ignore parsing errors
        return;
    }

    if (typeof eventName !== 'string') {
        // silently ignore parsing error
        return;
    }

    // arguments are optional
    if (!eventArguments) {
        eventArguments = [];
    }

    // invoke real event emit with the name and args
    EventEmitter.prototype.emit.apply(this, [ eventName ].concat(eventArguments));
};

FusioClient.prototype.onEnd = function () {
    EventEmitter.prototype.emit.call(this, 'disconnect');
};

FusioClient.prototype.emit = function () {
    var eventArguments = Array.prototype.slice.call(arguments, 0),
        eventName      = eventArguments.shift(),
        eventData      = { name: eventName };

    if (eventArguments.length > 0) {
        eventData.args = eventArguments;
    }

    this.stream.write('5:::' + JSON.stringify(eventData));
};

FusioClient.prototype.disconnect = function () {
    this.stream.end();
};

module.exports = FusioClient;
