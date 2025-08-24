const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

/** In-memory user store */
const users = {};
/*
users[socketId] = {
  name: string,
  color: number,
  state: { x:number, y:number, z:number, ry:number, sitting?:boolean }
}
*/

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("setUsername", ({ name, color }) => {
    // init user
    users[socket.id] = {
      name,
      color,
      state: { x: 0, y: 1.6, z: 5, ry: 0, sitting: false }
    };

    // send current world to the new client
    socket.emit("init", { selfId: socket.id, users });

    // notify everyone about the newcomer
    socket.broadcast.emit("userJoined", {
      id: socket.id,
      name,
      color,
      state: users[socket.id].state
    });

    // update the Online list for all
    io.emit("updateUserList", Object.values(users).map(u => u.name));
  });

  socket.on("chatMessage", (msg) => {
    const u = users[socket.id];
    if (!u) return;
    io.emit("chatMessage", { user: u.name, msg });
  });

  // position/rotation updates from the client
  socket.on("state", (state) => {
    if (!users[socket.id]) return;
    users[socket.id].state = state;
    // send to everyone except the sender
    socket.broadcast.emit("stateUpdate", { id: socket.id, state });
  });

  socket.on("disconnect", () => {
    const u = users[socket.id];
    if (u) {
      delete users[socket.id];
      io.emit("userLeft", u.name);
      io.emit("removeUser", socket.id);
      io.emit("updateUserList", Object.values(users).map(u => u.name));
    }
    console.log("disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
