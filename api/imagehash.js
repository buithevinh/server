const { imageHash } = require('image-hash');
const fs = require("fs")
const express = require('express');
const router = express.Router();
const path =  require('path');
const multer = require('multer');
const upload = multer()


const createHash = (fBuffer) => {
  return new Promise(res => {
    imageHash({ data: fBuffer}, 32, true, (error, data) => {
      if (error) throw error;
      res(data)
    });
  })
}

router.get('/', async (req, res) => {
  const root ='https://sun9-85.userapi.com/s/v1/ig2/45x4lTwMI9mDfblAf5fVlRHyiORowBhTC5M2ThQxf3Avq9spzMHnt4InVu-c-Zsgx73FXEXxu67NuYY83F6i7Pbh.jpg?size=1365x2048&quality=96&type=album';
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

router.post('/upload-image', upload.single('file'),async (req, res) => {
  const fBuffer = req.file.buffer;
  const hash = await createHash(fBuffer);
  res.json({
    status: 200,
    hash: hash
  });
})
module.exports = router;