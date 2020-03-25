const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const { addUser, removeUser, getUser, isUserAvailable, getUsersInRoom, getRooms } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    socket.emit('getRooms', getRooms());

    socket.on('checkUser', ({ name, room }, callback) => {
        if(isUserAvailable(name, room)) {
            callback(true);
        } else {
            callback(false);
        }
    });

    socket.on('join', ({ name, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, name, room });
        if(error) {
            console.log('error:', error);
            return callback(error);
        }
        console.log(name, "has joined");
        socket.broadcast.emit('getRooms', getRooms());

        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room ${user.room}`, datetime: new Date() });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`, datetime: new Date() });

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', { user: user.name, text: message, datetime: new Date() });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            socket.broadcast.emit('getRooms', getRooms());
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.`, datetime: new Date() });
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}.`));