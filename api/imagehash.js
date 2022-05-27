const { imageHash } = require('image-hash');
const fs = require("fs")
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const upload = multer()
const loadTf = require('tfjs-lambda')
const Jimp = require("jimp");
const vptree =  require('vptree');
const { default: axios } = require('axios');
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
  const hash = await createHash(root);
  try {
    res.json({
      status: 200,
      hash: hash
    })
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error')
  }
})

router.post('/upload-image', upload.single('file'), async (req, res) => {
  const fBuffer = req.file.buffer;
  const hash = await createHash(fBuffer);
  const tree = vptree.load()
  res.json({
    status: 200,
    hash: hash
  });
})

router.post('/get-tagging', upload.single('file'), async (req, res) => {
  const tf = await loadTf()
  const modelURL ='file://model/' + 'model.json';
  const metadataURL = '../model/' + 'metadata.json';

  const metadata = require(metadataURL)
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
  let img_tensor =  await tf.tidy(() => tf.tensor3d(arrays, outShape, 'float32'));
  img_tensor = img_tensor.expandDims(0);
  const labels = metadata.labels;
  const model = await tf.loadLayersModel(modelURL);
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
  res.json({
    status: 200,
    classify: classify
  });
})
module.exports = router;