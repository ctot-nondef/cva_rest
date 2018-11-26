const fs = require('fs');
const axios = require('axios');
const objectPath = require('object-path');

const CONFIG =  require('../config.json');
const APICONFIG = {
  GND: {
    BASEURL: 'http://lobid.org/gnd/',
    ENDPOINTS: {
      BASE: '',
    },
    TIMEOUT: 15000,
    PARAMS: {
      format: 'json',
    },
    HEADERS: {},
  },
  GEO: {
    BASEURL: 'http://api.geonames.org/getJSON',
    ENDPOINTS: {
      BASE: '',
    },
    TIMEOUT: 15000,
    PARAMS: {
      formatted: 'true',
      username: 'oeaw_adlib'
    },
    HEADERS: {},
  },
  IC: {
    BASEURL: 'http://iconclass.org/json/',
    ENDPOINTS: {
      BASE: '',
    },
    TIMEOUT: 15000,
    PARAMS: {},
    HEADERS: {},
  },
};
const IMPORTCONFIG = {
  GND: {
    Person: {
      preferredName: "name",
      dateOfBirth: "beginOfExistence",
      dateOfDeath: "endOfExistence",
      biographicalOrHistoricalInformation: "description",
    },
    CorporateBody: {
      preferredName: "name",
      dateOfEstablishment: "beginOfExistence",
      dateOfTermination: "endOfExistence",
    },

  },
};
function buildFetchers(extconf) {
  // this.$info('Helpers', 'buildFetchers(extconf)', extconf);
  const fetchers = {};
  // let ep = [];
  if (extconf) Object.assign(APICONFIG, extconf);
  const c = Object.keys(APICONFIG);
  let idx = c.length - 1;
  while (idx + 1) {
    const d = Object.keys(APICONFIG[c[idx]].ENDPOINTS);
    let idy = d.length - 1;
    fetchers[c[idx]] = {};
    while (idy + 1) {
      fetchers[c[idx]][d[idy]] = axios.create({
        baseURL: APICONFIG[c[idx]].BASEURL + APICONFIG[c[idx]].ENDPOINTS[d[idy]],
        timeout: APICONFIG[c[idx]].TIMEOUT,
        params: APICONFIG[c[idx]].PARAMS,
        headers: APICONFIG[c[idx]].HEADERS,
      });
      idy -= 1;
    }
    idx -= 1;
  }
  return fetchers;
}
APIS = buildFetchers();




module.exports = {
  files: [],
  jobs: [],
  mappings: [],
  endpoints: APIS,
  mappings: IMPORTCONFIG,
  initImports() {

  },
  fetchJobList(importcol) {
    let fn = fs.readdirSync(CONFIG.import.dir);
    for (i = 0; i < fn.length; i++) {
      if(/.*\.json/.test(fn[i])){
        // let s = JSON.parse(fs.readFileSync(`${CONFIG.schemas.dir}/${fn[i]}`, 'utf8'));
        importcol.findOne({name: fn[i].split('.')[0]})
          .exec(function (err, imp) {
            if (err) {
              return err
            } else if (!imp) {
              return [];
            }
            this.jobs.push(imp)
          });
      }
    }
    return this.files;
  },
  fetchAuthRecs(ids, endpoint, queryparam, success, fail, entity) {
    return new Promise(function(resolve, reject){
      if(ids.length > 0) {
        let a = { params: {}};
        a.params[queryparam] = `${ids.shift()}`;
        endpoint.get(``, a).then((response) => {
          success.push({
            src: `${response.request.res.responseUrl}`,
            record: response.data,
          })
          console.log("success", response.request.res.responseUrl);
          this.fetchAuthRecs(ids, endpoint, queryparam, success, fail, entity).then(() => {
            resolve(array);
          });
        }, (error) => {
          fail.push(error.config.url);
          console.log("failure", error);
          this.fetchAuthRecs(ids, endpoint, queryparam,  success, fail, entity).then(() => {
            resolve(array);
          });
        });
      }
      else {
        fs.writeFileSync(`import/data/${entity}_authrecs.json`, JSON.stringify(success, null, 2));
        fs.writeFileSync(`import/data/${entity}_fail.json`, JSON.stringify(fail, null, 2));
        Promise.resolve(array);
      }
    }.bind(this));
  },
  fetchSources(keys, uris, paths) {
    return new Promise(function(resolve, reject){
      if(keys.length > 0) {
        axios.get(`${uris.shift()}`).then((res) => {
          const data = objectPath.get(res, paths.shift());
          fs.writeFileSync(`import/data/source_${keys.shift()}.json`, JSON.stringify(data, null, 2));
          console.log("Saving Resource URL", res.request.res.responseUrl);
          this.fetchSources(keys, uris, paths).then(() => {
            resolve();
          });
        }, (error) => {
          console.log("Failed to save Resource", error);
          keys.shift();
          paths.shift();
          this.fetchSources(keys, uris, paths).then(() => {
            resolve();
          });
        });
      }
      else {
        resolve();
      }
    }.bind(this));
  },
  /*
  maps imported Object from GND according to mapping in this.IMPORT
  returns mapped object for DB
  */
  mapGNDImport(type, obj) {
    let map = Object.keys(this.mappings.GND[type]);
    let idx = map.length - 1;
    let res = {};
    while(idx + 1) {
      res[this.mappings.GND[type][map[idx]]] = obj[map[idx]];
      idx -= 1;
    }
    res.identifier = [`GND:${obj.gndIdentifier}`];
    return res;
  },
  /*
  maps imported Object from IconClass
  returns mapped object for DB
  */
  mapICImport(obj) {
    let lang = Object.keys(obj.txt);
    let idx = lang.length - 1;
    let res = {labels: [], description: ''};
    res.name = obj.n;
    res.labels.push({
      lang: '0',
      label: obj.n,
    });
    res.identifier = [`IC:${obj.n}`];
    res.instanceOf = '5bf0fb820c193d09a92774a4';
    while(idx + 1) {
      res.labels.push({
        lang: lang[idx],
        label: obj.txt[lang[idx]],
      });
      if(obj.kw[lang[idx]]) res.description += obj.kw[lang[idx]].join(', ');
      idx -= 1;
    }

    return res;
  },
}
