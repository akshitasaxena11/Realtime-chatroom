const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userjoin,
  getcurrentuser,
  userleave,
  getroomusers,
} = require("./utils/users");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = "Chatcord Bot";
//set static folder

app.use(express.static(path.join(__dirname, "public")));
//run when client connects

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userjoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit("message", formatMessage(botName, "Welcome to chatroom!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat!`)
      );
    //send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getroomusers(user.room),
    });
  });

  //listen for chat messages
  socket.on("chatmessage", (msg) => {
    const user = getcurrentuser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  socket.on("disconnect", () => {
    const user = userleave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat!`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getroomusers(user.room),
      });
    }
  });
});
const PORT = 3000 || port.env.PORT;

server.listen(PORT, () => console.log(`server running on port ${PORT}`));
