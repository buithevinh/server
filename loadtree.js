const fs = require("fs")
const vptree = require('vptree');
const { join } = require('path');
const hashTree = fs.readFileSync(join(__dirname, 'hashtree.json'), 'utf8');
const hashJson = JSON.parse(hashTree);

var one_bits = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
var hammingDistance = function (hash1, hash2) {
  var d = 0;
  var i;
  for (i = 0; i < hash1.length; i++) {
    var n1 = parseInt(hash1[i], 16);
    var n2 = parseInt(hash2[i], 16);
    d += one_bits[n1 ^ n2];
  }
  return d;
};
let tree = {};
const initTree = async () => {
  tree =  vptree.build(hashJson, hammingDistance);
  return tree;
}

const getTree = () => tree;

module.exports = {
  initTree,
  getTree
}