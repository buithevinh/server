const { imageHash } = require('image-hash');
require('dotenv').config()
const fs = require("fs")
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const upload = multer()
const Jimp = require("jimp");
const Redis = require("ioredis");
let client = null;
const { default: axios } = require('axios');
const metadataURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'metadata.json';
const { queryCategory, queryCategoryByScore, queryTotalCategory, queryTotalByScore } = require('../sql/index');
const mysql = require('mysql2/promise');
const loadTf = require('tfjs-lambda');
const { getModel, setModel } = require('../loadInit');
let tf = null;
let model  = null;
const pool = mysql.createPool({
  host: process.env.hostSQL,
  user:  process.env.user,
  password: process.env.password,
  database: 'oppai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {}
})

router.get('/init', async (req, res) => {
  if(!client) {
    client = new Redis(process.env.redis);
  }
  res.json({
    status: 200,
    init: true
  })
  if(!model) {
    await setModel();
  }
})
const createHash = (fBuffer) => {
  return new Promise(res => {
    imageHash({ data: fBuffer }, 32, true, (error, data) => {
      if (error) throw error;
      res(data)
    });
  })
}
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
  if(!client) {
    client = new Redis(process.env.redis);
  }
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
  if(!tf) {
    tf = await loadTf()
  }
  if(!model) {
    await setModel();
    model = await getModel();
  }
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
  const { category, score, total, offset } = req.query;
  const connection = await pool.getConnection()
  let count = total;
  let pageIndex = parseInt(offset);
  if(!total) {
    count = await connection.query(queryTotalByScore, [category, score - 10, score + 10]);
    const size =  Math.floor(count[0][0].total / 100)
    pageIndex = Math.floor(Math.random() * size); 
  }
  const photos = await connection.query(queryCategoryByScore, [category, score - 10, score + 10, pageIndex * 100]);
  res.json({
    status: 200,
    photos: photos[0],
    total: count[0][0].total,
    pageIndex: pageIndex
  })
})
router.get('/category', async(req, res) => {
  const { category, total, offset } = req.query;
  const connection = await pool.getConnection()
  let pageIndex = parseInt(offset);
  if(!total) {
    count = await connection.query(queryTotalCategory, [category]);
    const size =  Math.floor(count[0][0].total / 100)
    pageIndex = Math.floor(Math.random() * size); 
  }
  const photos = await connection.query(queryCategory, [category, pageIndex * 100]);
  res.json({
    status: 200,
    photos: photos[0],
    total: count[0][0].total,
    pageIndex: pageIndex
  })
})
module.exports = router;