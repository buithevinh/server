const express = require('express');
const app = express();
const hash = require('./api/imagehash')

const {IO} = require('./socketio')

const http = require('http');
const server = http.createServer(app);

app.use(express.json({ extended: false }));

const port = process.env.port || 8000;

const io = IO(server)
app.all('/', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  next();
});

const allowCORS = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  next();
};
app.use('/api/imagehash', allowCORS, hash)

server.listen(port);

app.get('/', async (req, res) => {
  res.json({ staus: 200, message: '11111' })
})