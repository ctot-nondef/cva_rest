const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const process = require('process');
const axios = require('axios');
const jimp = require('jimp');

const CONFIG =  require('./config.json');

// loading internal libs
const SCHEMA = require('./lib/schema.js');
SCHEMA.initSchemas();

// init mongodb
mongoose.connect(`mongodb://${CONFIG.db.user}:${CONFIG.db.pass}@${CONFIG.db.server}/${CONFIG.db.db}?authSource=test`, function(error) {
  console.log(error);
});
var db = mongoose.connection;

let fensters = SCHEMA.mongooseModelByName('fenster');
let assetrefs = SCHEMA.mongooseModelByName('assetref');

fensters.find({}, function (err, docs) {
  fs.writeFileSync(`fenster.json`, JSON.stringify(docs, null, 2));
});

assetrefs.find({}, function (err, docs) {
  fs.writeFileSync(`assetrefs.json`, JSON.stringify(docs, null, 2));
});
