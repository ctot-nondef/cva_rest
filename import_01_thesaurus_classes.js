const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const process = require('process');
const axios = require('axios');

const CONFIG =  require('./config.json');

// loading internal libs
const SCHEMA = require('./lib/schema.js');
SCHEMA.initSchemas();

// init mongodb
mongoose.connect(`mongodb://${CONFIG.db.user}:${CONFIG.db.pass}@${CONFIG.db.server}/${CONFIG.db.db}?authSource=test`, function(error) {
  console.log(error);
});
var db = mongoose.connection;

let descriptors = SCHEMA.mongooseModelByName('descriptor'); descriptors.remove({}, (err) => console.log(err));

let pc = JSON.parse(fs.readFileSync(`${CONFIG.import.dir}/people_classes.json`, 'utf8'));
let dc = JSON.parse(fs.readFileSync(`${CONFIG.import.dir}/thesau_classes.json`, 'utf8'));
descriptors.insertMany(dc, function(error, docs) {});
descriptors.insertMany(pc, function(error, docs) {});
