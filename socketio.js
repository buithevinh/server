const { Server } = require("socket.io");
let _io;
const IO = (server) => {
  _io = new Server(server, {
    cors: {
      origins: '*',
      credentials: true
    }
  });
  return _io 
}
const getIO = () => _io;
module.exports = {
  getIO,
  IO
}