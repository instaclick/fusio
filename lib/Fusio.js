/*jslint node: true, nomen: true */

/**
 * @copyright 2013 Instaclick Inc.
 * @author    Nick Matantsev <nick.matantsev@gmail.com>
 */

'use strict';

var EventEmitter        = require('events').EventEmitter,
    fs                  = require('fs'),
    FusioClient         = require('./FusioClient'),
    http                = require('http'),
    path                = require('path'),
    policyfile          = require('policyfile'),
    querystring         = require('querystring'),
    url                 = require('url'),
    util                = require('util'),
    websocket           = require('websocket-driver'),

    handshakePrefix     = '/socket.io/1/', // trailing slash is required
    staticPrefix        = '/socket.io/static/', // trailing slash is required
    socketTransportList = [ 'websocket', 'flashsocket' ],

    socketIoModulePath  = path.dirname(require.resolve('socket.io-client')) + '/..',
    flashWidgetPath     = socketIoModulePath + '/dist/WebSocketMainInsecure.swf',
    flashWidgetData     = null, // flash widget is loaded asynchronously

    clientHeartbeat     = 8640000, // super-long heartbeat expectation, non-zero to prevent old clients crashing
    clientTimeout       = 86400; // hard-coded client timeout for idle activity

// load the flash widget data without waiting for success: no significant race condition
fs.readFile(flashWidgetPath, function (error, content) {
    if (error) {
        throw 'cannot read flash widget content: ' + error;
    }

    flashWidgetData = content;
});

function Fusio(port, flashPolicyPort) {
    var server            = http.createServer(),
        flashPolicyServer = policyfile.createServer();

    EventEmitter.call(this);

    server.on('request', this.onHttpRequest.bind(this));
    server.on('upgrade', this.onHttpUpgrade.bind(this));

    // start the servers
    server.listen(port);

    flashPolicyServer.listen(flashPolicyPort);
}

util.inherits(Fusio, EventEmitter);

Fusio.prototype.onHttpRequest = function (req, res) {
    if (req.url.substring(0, handshakePrefix.length) === handshakePrefix) {
        this.handleHandshake(req, res);

        return;
    }

    if (req.url.substring(0, staticPrefix.length) === staticPrefix) {
        this.handleStatic(req, res);

        return;
    }

    // error by default
    res.writeHead(404);
    res.end('');
};

Fusio.prototype.onHttpUpgrade = function (req, socket, head) {
    var upgradeParts = req.url.substring(handshakePrefix.length).split('/'),
        driver,
        client;

    // unhandled (non-websocket) transport type and actual request type itself
    if (socketTransportList.indexOf(upgradeParts[0]) === -1 || !websocket.isWebSocket(req)) {
        socket.end();

        return;
    }

    // set various socket options
    socket.setTimeout(0); // clear default HTTP socket timeout
    socket.setNoDelay(true);
    socket.setKeepAlive(true);

    // close the half-open socket when client disconnects
    socket.on('end', function () {
        socket.end();
    });

    // pipe socket into the websocket driver
    driver = websocket.http(req);

    socket.pipe(driver.io).pipe(socket);
    driver.start();
    driver.io.write(head);

    // terminate websocket driver on socket error
    socket.on('error', function (error) {
        driver.io.end();
    });

    // return the new client handle
    this.emit('connection', new FusioClient(driver.messages));
};

Fusio.prototype.handleHandshake = function (req, res) {
    var clientId     = '1', // intentionally not random, because no state is kept

        requestUrl   = url.parse(req.url),
        requestQuery = requestUrl.query ? querystring.parse(requestUrl.query) : {},

        headers,
        body;

    headers = {
        'Content-Type': 'text/plain'
    };

    body = [ clientId, clientHeartbeat, clientTimeout, socketTransportList.join(',') ].join(':');

    // https://developer.mozilla.org/En/HTTP_Access_Control
    if (req.headers.origin) {
        headers['Access-Control-Allow-Origin'] = req.headers.origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
    }

    // JSONP requests (IE)
    if (requestQuery.jsonp) {
        headers = { 'Content-Type': 'application/javascript' };
        body = 'io.j[' + parseInt(requestQuery.jsonp, 10) + '](' + JSON.stringify(body) + ');';
    }

    res.writeHead(200, headers);
    res.end(body);
};

Fusio.prototype.handleStatic = function (req, res) {
    var staticPath = req.url.substring(staticPrefix.length);

    // provide flash widget if it is already loaded
    // @todo HEAD requests and ignore non-GETs
    if (staticPath === 'flashsocket/WebSocketMainInsecure.swf' && flashWidgetData !== null) {
        res.writeHead(200, { 'Content-Type': 'application/x-shockwave-flash' });
        res.end(flashWidgetData, 'binary');

        return;
    }

    // error by default
    res.writeHead(404);
    res.end('');
};

module.exports = Fusio;
