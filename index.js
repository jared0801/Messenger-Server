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
    // Show currently available rooms
    socket.emit('getRooms', getRooms());

    // Check if a username is taken in a given room
    socket.on('checkUser', ({ name, room }, callback) => {
        if(isUserAvailable(name, room)) {
            callback(true);
        } else {
            callback(false);
        }
    });

    // Join a room with a given name
    socket.on('join', ({ name, room }, callback) => {

        // Attempt to add user to a rooms user list
        const { error, user } = addUser({ id: socket.id, name, room });
        if(error) {
            console.log('error:', error);
            return callback(error);
        }
        console.log(name, "has joined");
        // Share currently populated rooms
        socket.broadcast.emit('getRooms', getRooms());

        // Send welcome message to user who just joined a new room
        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room ${user.room}`, datetime: new Date() });

        // Inform the room that a new user has joined
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`, datetime: new Date() });

        // Attach this socket to the new room
        socket.join(user.room);

        // Update room data with all current users
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', ({ message, file }, callback) => {
        const user = getUser(socket.id);

        const msgData = {
            user: user.name,
            text: message,
            file: file?.data.toString('base64'),
            fileName: file?.name,
            fileType: file?.type,
            datetime: new Date()
        }

        io.to(user.room).emit('message', msgData);

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            // Update room data after removing the user
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

            // Update population of current rooms for all users
            socket.broadcast.emit('getRooms', getRooms());

            // Notify the room that a user has left
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.`, datetime: new Date() });
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}.`));