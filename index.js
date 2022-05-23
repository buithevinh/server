const express = require('express');
const app = express();
const hash = require('./api/imagehash')
app.use(express.json({ extended: false }));

app.use('/api/imagehash', hash)
const port = process.env.port || 8000;

app.listen(port, () => console.log('server run port 8000'))
app.get('/', async(req, res) => {
  res.json({staus: 200, message: '111'})
})