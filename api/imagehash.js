const { imageHash } = require('image-hash');
const fs = require("fs")
const express = require('express');
const router = express.Router();
const path =  require('path');
const createHash = (uri) => {
  return new Promise(res => {
    // const fBuffer = fs.readFileSync(path);
    console.log(uri)
    imageHash(uri, 32, true, (error, data) => {
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

router.post('/upload-image', (req, res) => {
  console.log(req.body);
  res.json({
    status: 200,
    url: '111'
  })
})
module.exports = router;