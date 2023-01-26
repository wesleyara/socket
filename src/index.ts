import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

import dotenv from "dotenv";
dotenv.config();

import router from "./routes";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

const PORT = process.env.PORT || 3333;

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(cors());
app.use(express.json());
// app.use(express.static("public"));
app.use("/", router);

interface WalletSocket
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  wallet?: string;
}

io.on("connection", (socket: WalletSocket) => {
  socket.on("chat message", msg => {
    io.emit("chat message", msg);
  });

  socket.on("set wallet", function (name) {
    socket.wallet = name;
  });

  socket.on("room", (room, wallet) => {
    // console.log(socket.wallet);
    socket.emit("get room");
    if (io.sockets.adapter.rooms.get(room)!) {
      const arr = Array.from(io.sockets.adapter.rooms.get(room)!.keys()).filter(
        id => id.length <= 12,
      );

      if (arr.length >= 2) {
        io.emit("get room");
        return socket.emit("chat message", "Room is full");
      }
    }

    socket.join(room);
    // setar a wallet do usuário na room
    io.emit("get room");
    io.sockets.adapter.rooms.get(room)!.add(wallet);
    io.to(room).emit("chat message", `${wallet} has joined the ${room} room`);
  });

  socket.on("get rooms", () => {
    // retornar todas as rooms
    const rooms = io.sockets.adapter.rooms;
    const roomsArray = Array.from(rooms.keys());

    io.emit("get rooms", roomsArray);
  });

  socket.on("get room users", rooms => {
    const roomsUsers = rooms.map((room: any) => {
      const data = Array.from(io.sockets.adapter.rooms.get(room)!.keys());

      const ids = data.filter(id => id.length > 12);
      const users = data.filter(id => id.length <= 12);
      return { room, ids, users };
    });

    io.emit("get room users", roomsUsers);
  });

  socket.on("conect room", (room, wallet) => {
    socket.join(room);
    // setar a wallet do usuário na room
    io.sockets.adapter.rooms.get(room)!.add(wallet);
    io.to(room).emit("chat message", `${wallet} has joined the ${room} room`);
  });

  socket.on("room message", (room, msg) => {
    if (io.sockets.adapter.rooms.get(room)!) {
      const arr = Array.from(io.sockets.adapter.rooms.get(room)!.keys()).filter(
        id => id.length <= 12,
      );

      if (arr.length > 2) {
        return socket.emit("chat message", "Room is full");
      }
    }

    io.to(room).emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    const rooms = io.sockets.adapter.rooms;
    const roomsArray = Array.from(rooms.keys());

    roomsArray.forEach(room => {
      if (io.sockets.adapter.rooms.get(room)!) {
        socket.wallet &&
          io.sockets.adapter.rooms.get(room)!.delete(socket.wallet);

        io.sockets.adapter.rooms.get(room)!.delete(socket.id);
      }
    });

    io.emit("chat message", `${socket.wallet} has left the room`);
    io.emit("get rooms");
  });

  socket.on("typing", msg => {
    io.emit("typing", msg);
  });

  socket.on("stop typing", msg => {
    io.emit("stop typing", msg);
  });
});

server.listen(PORT, () => {
  console.log(
    `Server listening on port ${PORT}. Access it at http://localhost:${PORT}`,
  );
});
