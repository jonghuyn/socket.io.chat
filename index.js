// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 4000;
var redis = require('redis');
// const mongoose = require('mongoose');
// // ENV
// require('dotenv').config();
// mongoose.Promise = global.Promise;
// // CONNECT TO MONGODB SERVER
// mongoose.connect(process.env.MONGO_URI, { useMongoClient: true })
//     .then(() => console.log('Successfully connected to mongodb'))
//     .catch(e => console.error(e));

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// Routing 'public' folder what is front-end source folder
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom server side source
var numUsers = 0;
var userNumberEachRoom = {};

io.on('connection', (socket) => {
    console.log('server socket connected!!');
    var addedUser = false;
    socket.publishClient = redis.createClient();
    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        socket.publishClient.publish(socket.roomname, JSON.stringify({
            type: 'message',
            userName: socket.username,
            message: data
        }));
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user in room', (username, roomName) => {
        console.log('add user in room rome name is : ' + roomName);
        if (addedUser) return;
        var client = redis.createClient();
        client.subscribe(roomName);
        // we store the username in the socket session for this client
        socket.username = username;
        socket.roomname = roomName;

        userNumberEachRoom[roomName] = !Number.isInteger(userNumberEachRoom[roomName]) ? 0 : userNumberEachRoom[roomName];
        userNumberEachRoom[roomName]++;
        addedUser = true;
        socket.emit('login', {
            numUsers: userNumberEachRoom[roomName],
            roomName: roomName
        });
        socket.publishClient.publish(socket.roomname, JSON.stringify({
            type: 'login someone',
            userName: socket.username,
            message: ''
        }));
        client.on('message', function (channel, data) {
            var parseObject = JSON.parse(data);
            console.log('channel : ' + channel + ' userName : ' + parseObject.userName + ' message : ' + parseObject.message);
            if (parseObject.type === 'message') {
                socket.emit('new message', {
                    username: parseObject.userName,
                    message: parseObject.message
                });
            } else if (parseObject.type === 'typing') {
                socket.emit('typing', {
                    username: parseObject.userName
                });
            } else if (parseObject.type === 'stop typing') {
                socket.emit('stop typing', {
                    username: parseObject.userName
                });
            } else if (parseObject.type === 'user left') {
                socket.emit('user left', {
                    username: parseObject.userName,
                    numUsers: userNumberEachRoom[socket.roomname]
                });
            } else if (parseObject.type === 'login someone') {
                socket.emit('user joined', {
                    username: parseObject.userName,
                    numUsers: userNumberEachRoom[socket.roomname]
                });
            }
        })
    });


    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.publishClient.publish(socket.roomname, JSON.stringify({
            type: 'typing',
            userName: socket.username,
            message: ''
        }));
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        socket.publishClient.publish(socket.roomname, JSON.stringify({
            type: 'stop typing',
            userName: socket.username,
            message: ''
        }));
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --userNumberEachRoom[socket.roomname];

            // echo globally that this client has left

            socket.publishClient.publish(socket.roomname, JSON.stringify({
                type: 'user left',
                userName: socket.username,
                message: ''
            }));
        }
    });
});