const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve files from /public
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("setUsername", (name) => {
    socket.data.username = name;
    io.emit("userJoined", name);
  });

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", { user: socket.data.username, msg });
  });

  socket.on("disconnect", () => {
    if (socket.data.username) {
      io.emit("userLeft", socket.data.username);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
