const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const process = require('process');
const axios = require('axios');

const CONFIG =  require('./config.json');

// loading internal libs
const SCHEMA = require('./lib/schema.js');
const ASSETS = require('./lib/asset.js');
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

let assetrefs_fail = [];
assetrefs.find({}, function (err, docs) {
  let idx = docs.length - 1;
  let idy = docs.length;
  while (idx + 1) {
    ASSETS.makeImgThumb(`asset${docs[idx].path}`, {width: 220, height: 220}, 90, 'thumb')
    .then( res => {console.log('success', res)})
    .catch( err => {console.log('failure', err)});
    ASSETS.makeImgThumb(`asset${docs[idx].path}`, {width: 1500, height: 1500}, 90, 'preview')
    .then(res => {
      //update schema and write
      console.log('success', res);
      idy -= 1;
      if(!idy) {
        fs.writeFileSync(`assetrefs.json`, JSON.stringify(docs, null, 2));
        fs.writeFileSync(`assetrefs_fail.json`, JSON.stringify(assetrefs_fail, null, 2));
      }
    })
    .catch( err => {
      //delete record
      idy -= 1;
      if(!idy) {
        fs.writeFileSync(`assetrefs.json`, JSON.stringify(docs, null, 2));
        fs.writeFileSync(`assetrefs_fail.json`, JSON.stringify(assetrefs_fail, null, 2));
      }
    });
    idx -= 1;
  }
});
