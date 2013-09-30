fusio
=====

Minimalist Socket.IO Server Replacement
---------------------------------------

Implements the server-side portion of the Socket.IO protocol, providing only WebSocket and FlashSocket transport support. No support for socket rooms/namespaces.

Stateless operation: minimizes resource or memory leaks, especially when using node-cluster.

Developed as a workaround to observed Socket.IO server-side memory usage issues, while keeping Socket.IO client usage intact.

Usage
-----

Client code remains the same (make sure it supports WebSocket and FlashSocket transports).

Server:

    var fusio = require('fusio');

    fusio.listen(config.port).on('connection', function (socket) {
        socket.emit('myServerEvent', 'arg1', 2, 'arg3'); // emit custom Socket.IO event to client
        socket.on('myClientEvent', function () { /* handle custom Socket.IO client event */ });

        socket.on('disconnect', function () { /* handle client disconnect */ });
    });

License (MIT)
-------------

Copyright (c) 2013 Instaclick Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Contributors
------------

* Nick Matantsev <nick.matantsev@gmail.com>

