const modelURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'model.json';
const metadataURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'metadata.json';
const loadTf = require('tfjs-lambda');
let model = null;
let tf = null;
const setTf = async () => {
  tf = await loadTf();
  return tf;
}
const getTf = () => tf;
const setModel= async () => {
  const tf = await setTf();
  model = await tf.loadLayersModel(modelURL);
  return model;
}

const getModel = () => model;

module.exports = {
  setModel,
  getModel,
  getTf,
  setTf
}
