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
              
              var roomName = "";
              
              
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
                        roomName = room;
                        var clientsInRoom = io.sockets.adapter.rooms[room];
                        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0; //房间里的人数
                        
                        log('Room ' + room + ' has ' + numClients + ' client(s)');
                        log('Request to create or join room ' + room);
                        var msg = { room:room };
                        let s = JSON.stringify(msg);
                        var buf = Buffer.from(s, 'utf-8');
                        
                        if (numClients === 0){ //如果房间里没人
                        socket.join(room);
                        socket.emit('created', buf); // 給自已
                        } else if (numClients < 2) { //如果房间里有一个人
                        socket.join(room);
                        socket.broadcast.in(room).emit('someone joined', buf); // 給room其他人
                        socket.emit('join', buf); //給自己 
                        } else { // max two clients
                        socket.emit('full', buf); //給自己
                        }
//                         socket.emit('emit(): client//  ' + socket.id +
//                                     ' joined room ' + room);
//                         socket.broadcast.emit('broadcast(): client ' + socket.id +
//                                               ' joined room ' + room);
                        
                        });
              socket.on('cancelCalling', () => { //收到 “cancelCalling” 消息
              			var msg = { room:roomName };
                        let s = JSON.stringify(msg);
                        var buf = Buffer.from(s, 'utf-8');
                        io.sockets.in(roomName).emit('cancelCalling',buf);
                        
                        });
              socket.on('blockUser', () => { //收到 “block” 消息
              			var msg = { room:roomName };
                        let s = JSON.stringify(msg);
                        var buf = Buffer.from(s, 'utf-8');
                        //socket.emit('blockUser',buf); //給自己 
						socket.broadcast.in(roomName).emit('blockUser',buf); // 給room其他人
                        });          
                        
              socket.on('sdp', (spdInfo) => { //收到 “spd” 消息
                        socket.broadcast.in(roomName).emit('sdp', spdInfo); // 給room其他人
                        
                        });
                        
              socket.on('candidate', (candidateInfo) => { //收到 “candidate” 消息
                        io.sockets.in(roomName).emit('candidate', candidateInfo); // 給room 所有人
                        
                        });
              socket.on('personCount', () => { //收到 “personCount” 消息
              			var clientsInRoom = io.sockets.adapter.rooms[roomName];
                        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0; //房间里的人数
                        var msg = { connectionNumber:numClients };
                        let s = JSON.stringify(msg);
                        var buf = Buffer.from(s, 'utf-8');
                        socket.emit('personCount',buf); //給自己 
                        
                        });
              socket.on('disconnect', (candidateInfo) => { //收到 “disconnect” 消息
              			var clientsInRoom = io.sockets.adapter.rooms[roomName];
                        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0; //房间里的人数
                        if (numClients != 2){
                        	var msg = { room:roomName };
                        	let s = JSON.stringify(msg);
                        	var buf = Buffer.from(s, 'utf-8');
                        	io.sockets.in(roomName).emit('cancelCalling',buf);
                        }
                        
                        });        
                            
              
});
