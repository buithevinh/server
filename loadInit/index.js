const modelURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'model.json';
const metadataURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'metadata.json';
const loadTf = require('tfjs-lambda');
let model = null;

const setModel= async () => {
  const tf = await loadTf();
  model = await tf.loadLayersModel(modelURL);
  return model;
}

const getModel = () => model;

module.exports = {
  setModel,
  getModel
}
