const fetch = require("node-fetch");
const fs = require("fs");

const INPUT_FILE = process.argv[2] || "./translate_pl.json";
const TARGET_LANG = process.argv[3] || "de";

if (!process.env.GKEY) {
  console.log("process.env.GKEY must be set at this stage");
  console.log(
    "To get the token 1. install google sdk and run `gcloud auth application-default print-access-token` "
  );
  process.exit();
}

/**
 * Get json from local machine
 * @param {String} filename on local machine
 * @returns {Promise} resolved object is JSON
 */
const getJSON = filename => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        reject(err);
      }
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
  });
};

/**
 * Calls the translation.googleapis
 * @param {Object} term, term to be translated the shape of `{key:"", value:""}`, eg. `{key:"fullName", value:"Full name"}
 * @param {String} target language code eg `en` 
 * @param {String} key Google Api Key generated with `gcloud auth application-default print-access-token`
 * @returns {Promise} resolve object is in the same shape as input
 */
const getTranslation = (term, target, key) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // lets avoid throttle issue with googleapis request
      fetch("https://translation.googleapis.com/language/translate/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${key}`
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify({
          q: term.value,
          target: target
        })
      })
        .then(response => response.json()) // parses response to JSON
        .then(json =>
          json.error
            ? reject(json.error)
            : resolve({
                key: term.key,
                value: json.data.translations[0].translatedText
              })
        )
        .catch(error => reject(error));
    });
  }, 50);
};

/**
 * Saves object as JSON into file
 * @param {String} filename, name of file to be saved
 * @param {Object} obj to be saved as json
 * @returns {Promise}
 */
const writeToFile = (filename, obj) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(obj), err =>
      err ? reject(err) : resolve(filename)
    );
  });
};

/**
 * Proccess all the input array and calls `getTranslation` onEach row
 * @param {Array} arr, array of objects term to be translated in the shape of `{key:"", value:""}`, eg. `{key:"fullName", value:"Full name"}
 * @returns {Promise} resolved array is in the same shape as input
 */
const proc = (arr, target = "de", api_key = process.env.GKEY) => {
  return new Promise((resolve, reject) => {
    const convert = (arr, book = [], currentIndex = 0) => {
      if (currentIndex <= arr.length - 1) { // if currentIndex is not at the end of array  lets process the next row 
        getTranslation(arr[currentIndex], target, api_key)
          .then(obj => convert(arr, [...book, obj], currentIndex + 1)) // process next row 
          .catch(err => reject(err)); // return error is anything goes wrong 
      } else { // otherwise we have processed all row and it's time to return the final results 
        resolve(book);
      }
    };
    convert(arr);
  });
};

/**
 * Converts object to array
 * @param {Object} obj
 * @returns {Array}
 * @example
 * // returns [{key:"fullName", value:"Full name"}]
 * convertToArray({fullName:"Full Name"})
 */
const convertToArray = obj =>
  Object.keys(obj).map(key => ({ key, value: obj[key] }));

/**
 * Converts array to object
 * @param {Array} obj
 * @returns {Object}
 * @example
 * // returns {fullName:"Full Name"}
 * convertToObject([{key:"fullName", value:"Full name"}])
 */
const convertToObject = arr =>
  arr.reduce((acc = {}, curr) => ({ ...acc, [curr.key]: curr.value }), {});

/** Runs the application */

getJSON(INPUT_FILE) // get data from input file
  .then(input_vars => convertToArray(input_vars)) // convert data from object to array
  .then(input_arr => proc(input_arr, 'de', process.env.GKEY)) // process the whole array
  .then(transl_arr => convertToObject(transl_arr)) // convert data from array to object
  .then(
    output_vars => writeToFile(`translated_${TARGET_LANG}.json`, output_vars) // saves translated object into file
  )
  .then(filename => console.log(`translation succesfully saved in ${filename}`)) // outputs success
  .catch(err => console.error("Error", err)); // shows error in case of any of above fails
