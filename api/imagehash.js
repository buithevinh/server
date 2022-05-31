const { imageHash } = require('image-hash');
const fs = require("fs")
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const upload = multer()
const loadTf = require('tfjs-lambda')
const Jimp = require("jimp");
const Redis = require("ioredis");
let client = new Redis("rediss://:f847c85142a94e13be0e8ab1c1a699ac@gusc1-valued-leech-30241.upstash.io:30241");
const { default: axios } = require('axios');
const modelURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'model.json';
const metadataURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'metadata.json';
const { queryCategory } = require('../sql/index');
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host:'syyxo9qotcdf.ap-southeast-2.psdb.cloud',
  user:  process.env.user,
  password: process.env.password,
  database: 'oppai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {}
})
const createHash = (fBuffer) => {
  return new Promise(res => {
    imageHash({ data: fBuffer }, 32, true, (error, data) => {
      if (error) throw error;
      res(data)
    });
  })
}
let tf = null;
router.get('/', async (req, res) => {
  const root = 'https://sun9-85.userapi.com/s/v1/ig2/45x4lTwMI9mDfblAf5fVlRHyiORowBhTC5M2ThQxf3Avq9spzMHnt4InVu-c-Zsgx73FXEXxu67NuYY83F6i7Pbh.jpg?size=1365x2048&quality=96&type=album';
  try {
    res.json({
      status: 200,
      hash: root
    })
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error')
  }
})


router.get('/get-classify', async (req, res) => {
  const time = req.query.time;
  const classify = await client.get(time);
  if (classify) {
    res.json({
      status: 200,
      classify: JSON.parse(classify),
      process: 'done'
    })
    await client.del(time)
  } else {
    res.json({
      status: 200,
      classify: null,
      process: 'wait'
    })
  }

});
router.post('/get-tagging', upload.single('file'), async (req, res) => {
  const time = new Date().getTime();
  res.json({
    status: 200,
    time: time
  });
  if (!tf) {
    tf = await loadTf();
  }
  const model = await tf.loadLayersModel(modelURL);
  const metadata = await axios.get(metadataURL);
  const fBuffer = req.file.buffer;
  const image = await Jimp.read(fBuffer);
  image.cover(224, 224, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  const NUM_OF_CHANNELS = 3;
  let arrays = new Float32Array(224 * 224 * NUM_OF_CHANNELS);
  let i = 0;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
    pixel.r = pixel.r / 127.0 - 1;
    pixel.g = pixel.g / 127.0 - 1;
    pixel.b = pixel.b / 127.0 - 1;
    pixel.a = pixel.a / 127.0 - 1;
    arrays[i * NUM_OF_CHANNELS + 0] = pixel.r;
    arrays[i * NUM_OF_CHANNELS + 1] = pixel.g;
    arrays[i * NUM_OF_CHANNELS + 2] = pixel.b;
    i++;
  });
  const outShape = [224, 224, NUM_OF_CHANNELS];
  let img_tensor = await tf.tidy(() => tf.tensor3d(arrays, outShape, 'float32'));
  img_tensor = img_tensor.expandDims(0);
  const labels = metadata.data.labels;

  let predictions = await model.predict(img_tensor).dataSync();

  const total = predictions.reduce((t, item) => {
    return t += item;
  }, 0)
  const classify = [];
  for (let i = 0; i < predictions.length; i++) {
    const label = labels[i];
    const probability = Math.round(predictions[i] * 100 / total);
    if (probability > 0) {
      classify.push({
        label: label,
        score: probability
      })
    }
  }

  client.set(time, JSON.stringify(classify));
})

router.get('/get-photos', async (req, res) => {
  const { category, score } = req.query;
  const connection = await pool.getConnection()
  const photos = await connection.query(queryCategory, [category, score - 10, score + 10])
  res.json({
    status: 200,
    photos: photos[0]
  })
})
module.exports = router;