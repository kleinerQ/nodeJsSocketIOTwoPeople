var express = require('express');
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipadr = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
const static = require('node-static');
const http = require('http');
const file = new(static.Server)();
const app = http.createServer(function (req, res) {
                              file.serve(req, res);
                              }).listen(port,ipadr);

const io = require('socket.io').listen(app); //侦听 2013

io.sockets.on('connection', (socket) => {
              
              // convenience function to log server messages to the client
              function log(){
              const array = ['>>> Message from server: '];
              for (var i = 0; i < arguments.length; i++) {
              array.push(arguments[i]);
              }
              socket.emit('log', array);
              }
              
              socket.on('message', (message) => { //收到message时，进行广播
                        log('Got message:', message);
                        if (message === 'got user media') {
                        maybeStart();
                        } else if (message.type === 'offer') {
                        if (!isInitiator && !isStarted) {
                        maybeStart();
                        }
                        pc.setRemoteDescription(new RTCSessionDescription(message));
                        doAnswer();
                        } else if (message.type === 'answer' && isStarted) {
                        pc.setRemoteDescription(new RTCSessionDescription(message));
                        } else if (message.type === 'candidate' && isStarted) {
                        var candidate = new RTCIceCandidate({
                                                            sdpMLineIndex: message.label,
                                                            candidate: message.candidate
                                                            });
                        pc.addIceCandidate(candidate);
                        } else if (message === 'bye' && isStarted) {
                        handleRemoteHangup();
                        }
                        
                        });
              
              socket.on('create or join', (room) => { //收到 “create or join” 消息
                        
                        var clientsInRoom = io.sockets.adapter.rooms[room];
                        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0; //房间里的人数
                        
                        log('Room ' + room + ' has ' + numClients + ' client(s)');
                        log('Request to create or join room ' + room);
                        
                        if (numClients === 0){ //如果房间里没人
                        socket.join(room);
                        socket.emit('created', room); // 給自已
                        } else if (numClients < 2) { //如果房间里有一个人
                        socket.join(room);
                        socket.broadcast.in(room).emit('someone joined', room); // 給room其他人
                        socket.emit('join', room); //給自己 
                        } else { // max two clients
                        socket.emit('full', room); //給自己
                        }
//                         socket.emit('emit(): client//  ' + socket.id +
//                                     ' joined room ' + room);
//                         socket.broadcast.emit('broadcast(): client ' + socket.id +
//                                               ' joined room ' + room);
                        
                        });
              socket.on('cancelCalling', (room) => { //收到 “cancelCalling” 消息
                        io.sockets.in(room).emit('cancelCalling',room);
                        
                        });
              socket.on('sdp', (room , spdInfo) => { //收到 “spd” 消息
                        socket.broadcast.in(room).emit('sdp', spdInfo);
                        
                        });
                        
              socket.on('candidate', (room , candidateInfo) => { //收到 “candidate” 消息
                        io.sockets.in(room).emit('candidate', candidateInfo);
                        
                        });
              socket.on('personCount', (room) => { //收到 “personCount” 消息
              			var clientsInRoom = io.sockets.adapter.rooms[room];
                        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0; //房间里的人数
                        var msg = { connectionNumber:numClients };
                        let s = JSON.stringify(msg);
                        var buf = Buffer.from(s, 'utf-8');
                        socket.emit('personCount',buf); //給自己 
                        
                        });                   
              
});
