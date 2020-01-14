# JavaScript Functional Google Translate API to translate JSON values.

Support repository for [medium article](https://medium.com/qunabu-interactive/javascript-functional-google-translate-api-to-translate-json-values-8f8f310dab7f)

In order to run the code 
1. install dependencies with `npm i` 
2. generate the token with `gcloud auth application-default print-access-token`
3. create enviromental variable  `export GKEY=XXX` where `XXX` is the token 
4. run the code `node index.js` 

You can use optiona parameters eg 

`node index.js ./translate_pl.json de` which translates terms from `./translate_pl.json` into german language. 