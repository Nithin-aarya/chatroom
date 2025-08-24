const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

let users = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("setUsername", (name) => {
    socket.data.username = name;
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    users[socket.id] = { name, color, x: 0, y: 0, z: 0 };

    io.emit("updateUserList", users);
    io.emit("userJoined", { id: socket.id, name, color });
  });

  socket.on("move", (pos) => {
    if (users[socket.id]) {
      users[socket.id].x = pos.x;
      users[socket.id].y = pos.y;
      users[socket.id].z = pos.z;
      io.emit("updatePositions", users);
    }
  });

  socket.on("chatMessage", (msg) => {
    if (socket.data.username) {
      io.emit("chatMessage", { user: socket.data.username, msg });
    }
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      const name = users[socket.id].name;
      delete users[socket.id];
      io.emit("userLeft", name);
      io.emit("updateUserList", users);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
