const { Server } = require("socket.io");
const redisAdapter = require('socket.io-redis');

let _io;
const IO = (server) => {
  _io = new Server(server, {
    cors: {
      origins: '*',
      credentials: true
    },
    transports: ["websocket"],
  });
  _io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
  return _io;
}
const getIO = () => _io;
module.exports = {
  getIO,
  IO
}