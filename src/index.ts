import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

import dotenv from "dotenv";
dotenv.config();

import router from "./routes";

const PORT = process.env.PORT || 3333;

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());
app.use(express.static("public"));
app.use("/", router);

io.on("connection", socket => {
  io.emit("chat message", `Hi ${socket.id}, welcome to the chat!`);

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
  
  socket.on("disconnect", () => {
    io.emit("chat message", `${socket.id} has left the chat`)
  });

  socket.on("typing", (msg) => {
    io.emit("typing", msg);
  })

  socket.on("stop typing", (msg) => {
    io.emit("stop typing", msg);
  })
});

server.listen(PORT, () => {
  console.log(
    `Server listening on port ${PORT}. Access it at http://localhost:${PORT}`,
  );
});
