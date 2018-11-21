const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const process = require('process');
const axios = require('axios');

const CONFIG =  require('./config.json');

// loading internal libs
const IMPORT = require('./lib/import.js');
const SCHEMA = require('./lib/schema.js');
SCHEMA.initSchemas();

// init mongodb
mongoose.connect(`mongodb://${CONFIG.db.user}:${CONFIG.db.pass}@${CONFIG.db.server}/${CONFIG.db.db}?authSource=test`, function(error) {
  console.log(error);
});
var db = mongoose.connection;



let descriptors = SCHEMA.mongooseModelByName('descriptor');
let ic = [];
let ids = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
var fc = 0;

function fetchICRecs(ids, endpoint, queryparam, success, fail, entity) {
  return new Promise(function(resolve, reject){
    if(ids.length > 0) {
      let a = { params: {}};
      a.params[queryparam] = `${ids.shift()}`;
      endpoint.get(``, a).then((res) => {
        if(res.data[0]) {
          success.push(IMPORT.mapICImport(res.data[0]));
          ids = ids.concat(res.data[0].c);
          console.log("success", success.length, res.data[0].n);
          console.log("left", ids.length);
        }
        if(success.length == 1000) {
          fs.writeFileSync(`import/${entity}_authrecs_${fc}.json`, JSON.stringify(success, null, 2));
          success = [];
          fc += 1;
        }
        fetchICRecs(ids, endpoint, queryparam, success, fail, entity).then(() => {
          Promise.resolve(array);
        });
      }, (error) => {
        fail.push(error.config.url);
        console.log("failure", error);
        if(success.length == 1000) {
          fs.writeFileSync(`import/${entity}_authrecs_${fc}.json`, JSON.stringify(success, null, 2));
          success = [];
          fc += 1;
        }
        fetchICRecs(ids, endpoint, queryparam,  success, fail, entity).then(() => {
          Promise.resolve(array);
        });
      });
    }
    else {
      fs.writeFileSync(`import/data/${entity}_authrecs.json`, JSON.stringify(success, null, 2));
      fs.writeFileSync(`import/data/${entity}_fail.json`, JSON.stringify(fail, null, 2));
      Promise.resolve(array);
    }
  }.bind(this));
};

let dc = JSON.parse(fs.readFileSync(`${CONFIG.import.dir}/thesau_classes.json`, 'utf8'));

// IMPORT.endpoints.IC.BASE.get('',{ params: {notation: '33B31' }})
// .then(res => {
//   let a = IMPORT.mapICImport(res.data[0]);
//   console.log(a);
// });

fetchICRecs(ids, IMPORT.endpoints.IC.BASE, 'notation', [], [], 'iconclass');






descriptors.insertMany(ic, function(error, docs) {});
