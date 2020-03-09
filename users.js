const users = [];
const rooms = [];

const addUser = ({ id, name, room }) => {
    name = name.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // Verify user info
    const existingUser = users.find((user) => user.room === room && user.name === name);
    if(existingUser) {
        return { error: "Username is taken." };
    }

    // Add user to user list
    const user = { id, name, room };
    users.push(user);

    // Add room to room list if needed, otherwise increment the room's user count.
    const existingRoom = rooms.find((room) => user.room === room.name);
    if(!existingRoom) {
        rooms.push({ name: user.room, users: 1 });
    } else {
        existingRoom.users += 1;
    }

    return { user };
}

const removeUser = (id) => {
    const index = users.findIndex(user => user.id === id);

    if(index !== -1) {
        // User found
        const userRoom = users[index].room;

        // Remove user from room
        const existingRoomIndex = rooms.findIndex((room) => userRoom === room.name);
        const existingRoom = rooms[existingRoomIndex];
        if(existingRoom) {
            existingRoom.users -= 1;
            if(existingRoom.users === 0) {
                // Remove room if there are no longer any users in it
                rooms.splice(existingRoomIndex, 1);
            }
        }

        return users.splice(index, 1)[0];
    }
}

const getUser = (id) => {
    return users.find(user => user.id === id);
}

const isUserAvailable = (name, room) => {
    return !(getUsersInRoom(room).find(user => user.name === name))
}

const getUsersInRoom = (room) => {
    return users.filter(user => user.room === room)
}

const getRooms = () => {
    return rooms;
}

module.exports = { addUser, removeUser, getUser, isUserAvailable, getUsersInRoom, getRooms };