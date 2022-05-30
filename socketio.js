const { Server } = require("socket.io");
const redis = require('redis')
const redisAdapter = require('socket.io-redis');
const host = '127.0.0.1';
const port = process.env.port || 8000;
const pub = redis.createClient(port, host);
const sub = redis.createClient(port, host, {detect_buffers: true});

let _io;
const IO = (server) => {
  _io = new Server(server, {
    cors: {
      origins: '*',
      credentials: true,
      methods: ["GET", "POST"],
    },
    adapter: redisAdapter({pubClient: pub, subClient: sub})
  });
  return _io 
}
const getIO = () => _io;
module.exports = {
  getIO,
  IO
}