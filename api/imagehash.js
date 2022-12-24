const { imageHash } = require("image-hash");
require("dotenv").config();
const fs = require("fs");
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const modelURL = "https://teachablemachine.withgoogle.com/models/xKlYuxUch/" +
  "model.json";
const { createClient } = require("@supabase/supabase-js");
const upload = multer();
const Jimp = require("jimp");
const Redis = require("ioredis");
let client = null;
const { default: axios } = require("axios");
const crypto = require("crypto");
const secret = "oppai-xKlYuxUch";
const os = require("os");
const metadataURL =
  "https://teachablemachine.withgoogle.com/models/xKlYuxUch/" + "metadata.json";
const {
  queryCategory,
  queryCategoryByScore,
  queryTotalCategory,
  queryTotalByScore,
  queryInstagramPhotos,
  sqlGetUserInstagrams,
  sqlGetUserByUserName,
  sqlGetPhotoInstagrams,
  sqlCountPhotoByUserName,
  sqlTotalInstagram,
  sqlGetUserByUserNames,
  sqlGetPhotobyUserNames,
  sqlVideoInstagram,
  sqlGetVideosUsername,
  sqlVideosDouyin,
  sqlGetUserNameDouyin,
  sqlGetVideosDouyinByUserName,
} = require("../sql/index");
const mysql = require("mysql2/promise");
// const loadTf = require('tfjs-lambda');
const loadTf = require("tfjs-node-lambda");
const { Readable } = require("stream");
let tf = null;
let readStream = null;
(async () => {
  const response = await axios.get(
    "https://github.com/jlarmstrongiv/tfjs-node-lambda/releases/download/v2.0.10/nodejs12.x-tf2.8.6.br",
    { responseType: "arraybuffer" },
  );

  readStream = Readable.from(response.data);
  tf = await loadTf(readStream);
})();

let model = null;
const supabase = createClient(
  process.env.URL_SUPABASE,
  process.env.TOKEN_SUPABASE,
);
const createPoolSQL = () => {
  return mysql.createPool({
    host: process.env.hostSQL,
    user: process.env.user,
    password: process.env.password,
    database: "oppai",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {},
  });
};

const createHash = (fBuffer) => {
  return new Promise((res) => {
    imageHash({ data: fBuffer }, 32, true, (error, data) => {
      if (error) throw error;
      res(data);
    });
  });
};

router.get("/", async (req, res) => {
  const root =
    "https://sun9-85.userapi.com/s/v1/ig2/45x4lTwMI9mDfblAf5fVlRHyiORowBhTC5M2ThQxf3Avq9spzMHnt4InVu-c-Zsgx73FXEXxu67NuYY83F6i7Pbh.jpg?size=1365x2048&quality=96&type=album";
  try {
    res.json({
      status: 200,
      hash: root,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
});

router.get("/get-classify", async (req, res) => {
  const time = req.query.time;
  if (!client) {
    client = new Redis(process.env.redis);
  }
  const classify = await client.get(time);
  if (classify) {
    res.json({
      status: 200,
      classify: JSON.parse(classify),
      process: "done",
    });
    await client.del(time);
  } else {
    res.json({
      status: 200,
      classify: null,
      process: "wait",
    });
  }
});

router.post("/get-tagging", upload.single("file"), async (req, res) => {
  const time = new Date().getTime();
  res.json({
    status: 200,
    time: time,
  });

  tf = await loadTf(readStream);
  if (!model) {
    model = await tf.loadLayersModel(modelURL);
  }
  const metadata = await axios.get(metadataURL);
  const fBuffer = req.file.buffer;
  const image = await Jimp.read(fBuffer);
  image.cover(
    224,
    224,
    Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE,
  );
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
  let img_tensor = await tf.tidy(() =>
    tf.tensor3d(arrays, outShape, "float32")
  );
  img_tensor = img_tensor.expandDims(0);
  const labels = metadata.data.labels;

  let predictions = await model.predict(img_tensor).dataSync();

  const total = predictions.reduce((t, item) => {
    return t += item;
  }, 0);
  const classify = [];
  for (let i = 0; i < predictions.length; i++) {
    const label = labels[i];
    const probability = Math.round(predictions[i] * 100 / total);
    if (probability > 0) {
      classify.push({
        label: label,
        score: probability,
      });
    }
  }

  client.set(time, JSON.stringify(classify));
});

router.get("/get-photos", async (req, res) => {
  const { categories, score, total, offset } = req.query;
  const pool = createPoolSQL();
  const connection = await pool.getConnection();
  let count = total;
  let pageIndex = parseInt(offset);
  if (!total) {
    count = await connection.query(queryTotalByScore, [
      categories,
      score - 10,
      score + 10,
    ]);
    const size = Math.floor(count[0][0].total / 100);
    pageIndex = Math.floor(Math.random() * size);
  }
  const photos = await connection.query(queryCategoryByScore, [
    categories,
    score - 10,
    score + 10,
    pageIndex * 100,
  ]);
  res.json({
    status: 200,
    photos: photos[0],
    total: count[0][0].total,
    pageIndex: pageIndex,
  });
});
router.get("/category", async (req, res) => {
  const pool = createPoolSQL();
  const { category, total, offset } = req.query;
  const connection = await pool.getConnection();

  let pageIndex = parseInt(offset);
  if (!total) {
    count = await connection.query(queryTotalCategory, [category]);
    const size = Math.floor(count[0][0].total / 100);
    pageIndex = Math.floor(Math.random() * size);
  }
  const photos = await connection.query(queryCategory, [
    category,
    pageIndex * 100,
  ]);
  res.json({
    status: 200,
    photos: photos[0],
    total: count[0][0].total,
    pageIndex: pageIndex,
  });
});

router.get("/get-instagrams", async (req, res) => {
  const pool = createPoolSQL();
  const connection = await pool.getConnection();
  const { offset, album_ids } = req.query;
  let pageindex = parseInt(offset);
  if (!pageindex) {
    pageindex = Math.floor(Math.random() * 5000);
  }
  const photos = await connection.query(queryInstagramPhotos, [
    album_ids,
    pageindex,
  ]);
  res.json({
    status: 200,
    photos: photos[0],
    offset: pageindex,
  });
});
router.get("/get-user-instagrams", async (req, res) => {
  const pool = createPoolSQL();
  const connection = await pool.getConnection();
  const userIns = await connection.query(sqlGetUserInstagrams);
  res.json({
    status: 200,
    userIns: userIns[0],
  });
});
router.get("/get-user-instagram", async (req, res) => {
  const { user_name } = req.query;
  const pool = createPoolSQL();
  const connection = await pool.getConnection();
  const userInfor = await connection.query(sqlGetUserByUserName, [user_name]);
  res.json({
    status: 200,
    userInfor: userInfor[0][0],
  });
});

router.get("/get-photo-instagrams", async (req, res) => {
  const pool = createPoolSQL();
  const { user_name, offset } = req.query;
  const connection = await pool.getConnection();
  const userIns = await connection.query(sqlGetUserByUserName, [user_name]);
  const album_id = userIns[0][0].album_id;
  const pageIndex = parseInt(offset) || 0;
  const getPhotoInstagrams = connection.query(sqlGetPhotoInstagrams, [
    album_id,
    pageIndex,
  ]);
  const getVideoUsernames = connection.query(sqlGetVideosUsername, [
    user_name,
    pageIndex,
  ]);
  const promises = [getPhotoInstagrams, getVideoUsernames];
  const respones = await Promise.all(promises);
  const photos = respones[0];
  const videos = respones[1];
  res.json({
    status: 200,
    photos: photos[0],
    user: userIns[0][0],
    videos: videos[0],
  });
});
router.get("/get-users-face", async (req, res) => {
  const { hash } = req.query;
  if (!client) {
    client = new Redis(process.env.redis);
  }
  const pool = createPoolSQL();
  const data = await client.hget(hash, "users");
  const user_names = JSON.parse(data);
  const ids = user_names.map((item) => item.album_id);
  const connection = await pool.getConnection();
  const respones = await connection.query(sqlGetPhotobyUserNames, [ids]);
  res.json({
    status: 200,
    photos: respones[0],
    user_names: user_names,
  });
});
router.get("/get-face-id", async (req, res) => {
  const { descs } = req.query;
  const values = Object.values(JSON.parse(descs));
  const start_vector = values.slice(0, 64);
  const end_vector = values.slice(64, 128);
  const { data, error } = await supabase
    .rpc("get_face_id", {
      start_vector,
      end_vector,
    });
  const obj = {};
  for (let i = 0; i < data.length; i++) {
    obj[data[i].user_name] = data[i].user_name;
  }
  const pool = createPoolSQL();
  const user_names = Object.keys(obj);
  const connection = await pool.getConnection();

  const userInfors = await connection.query(sqlGetUserByUserNames, [
    user_names,
  ]);
  const ids = userInfors[0].map((item) => item.id).join();
  const hashValue = crypto.createHash("sha256", secret);
  const key = hashValue.update(ids).digest("hex");
  if (!client) {
    client = new Redis(process.env.redis);
  }
  const getUser = await client.hget(key, "users");
  if (!getUser) {
    client.hset(key, { "users": JSON.stringify(userInfors[0]) });
    client.expire(key, 86400);
  }
  res.json({
    status: 200,
    hash: key,
  });
});
router.post("/get-videos-instagram", upload.single(), async (req, res) => {
  const pool = createPoolSQL();
  const { ids } = req.body;
  const connection = await pool.getConnection();
  const respones = await connection.query(sqlVideoInstagram, [ids]);
  const obj = {};
  const data = respones[0];
  for (let i = 0; i < data.length; i++) {
    obj[data[i].user_name] = data[i].user_name;
  }
  const user_names = Object.keys(obj);
  const userInfors = await connection.query(sqlGetUserByUserNames, [
    user_names,
  ]);
  res.json({
    status: 200,
    videos: respones[0],
    users: userInfors[0],
  });
});

router.post("/get-videos-douyin", upload.single(), async (req, res) => {
  const pool = createPoolSQL();
  const { ids } = req.body;
  const connection = await pool.getConnection();
  const respones = await connection.query(sqlVideosDouyin, [ids]);
  const obj = {};
  const data = respones[0];
  for (let i = 0; i < data.length; i++) {
    obj[data[i].user_name] = data[i].user_name;
  }
  const user_names = Object.keys(obj);
  const userInfors = await connection.query(sqlGetUserNameDouyin, [user_names]);
  res.json({
    status: 200,
    videos: respones[0],
    users: userInfors[0],
  });
});
router.get("/get-videos-username", async (req, res) => {
  const { user_name } = req.query;
  const pool = createPoolSQL();
  const connection = await pool.getConnection();
  const respones = await connection.query(sqlGetVideosDouyinByUserName, [
    user_name,
  ]);
  res.json({
    status: 200,
    videos: respones[0],
  });
});
module.exports = router;
