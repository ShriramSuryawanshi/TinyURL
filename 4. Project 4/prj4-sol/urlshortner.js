'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mustache = require('mustache');
const querystring = require('querystring');

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

function serve(port, base, model) {

  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  process.chdir(__dirname);
  app.use(base, express.static(STATIC_DIR));
  setupTemplates(app);
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

module.exports = serve;


function setupRoutes(app) {

  const base = app.locals.base;

  app.get(`${base}/url-info.html`, doInfo(app));
  app.get(`${base}/text-translate.html`, doAdd(app));
  app.post(`${base}/text-translate.html`, bodyParser.urlencoded({extended: false}), doAddContent(app));
  app.get(`${base}/url-deactivate.html`, doDisable(app));
  app.post(`${base}/url-deactivate.html`, bodyParser.urlencoded({extended: false}), doDisableContent(app));
  app.get(`${base}`, doHome(app));
}


function doHome(app){

 return async function(req, res) {

    res.redirect('homepage.html');
  };
}


function doAdd(app){

 return async function(req, res) {

       const model = { base: app.locals.base };
       const html = doMustache(app, 'add', model);
       res.send(html);
     };
}

function doAddContent(app) {

  return async function(req, res) {

       let model;

       if (req.body.text.toString().trim().length == 0) {
            model = { text: req.body.text.toString(), error: "Non-empty text must be provided for shortening"};
       }
       else {

            const data = {"text": req.body.text.toString().trim(), "isHtml":"true"};

            try {
                 const result = await app.locals.model.translateText(data);
                 model = { text: req.body.text.toString(), result: result.value};
            }
            catch (err) {
                 console.error(err);
                 model = { text: req.body.text.toString(), serror: err.message};
            }
       }

       const html = doMustache(app, 'add', model);
       res.setHeader("Cache-Control", "no-store");
       res.send(html);
  };
}


function doInfo(app){

 return async function(req, res) {

       let model;
       let validationInfo = false;
       const isSubmit = req.query.isSubmit;

       if (isSubmit) {

            const inURL = req.query.url.toString().trim();

            if (inURL.length == 0) {
                model = { url: inURL, error: "URL must not be empty"};
            }
            else {

                const split =  inURL.match(/(\w+:\/\/)([^/]+)(.*)/);                
                if (split === null || (split[1] !== "https://" && split[1] !== "http://"))          {   validationInfo = false;           model = { url: inURL, error: "URL must start with http:// or https://"}; }
                else                                                                                {   validationInfo = true;   }
            }
            if (validationInfo) {

                try {
                     const result = await app.locals.model.urlInfo(inURL);
                     model = { url: inURL, result: result};
                }
                catch (err) {
                     console.error(err);
                     if(err.message.includes("bad domain"))
                          model = { url: inURL, error: err.message};
                     else
                          model = { url: inURL, serror: err.message};
                }
            }
       }
       else {

            model = { base: app.locals.base };
       }

       const html = doMustache(app, 'info', model);
       res.send(html);
     };
}


function doDisable(app){

 return async function(req, res) {

       const model = { base: app.locals.base };
       const html = doMustache(app, 'disable', model);
       res.send(html);
     };
}


function doDisableContent(app) {

     return async function(req, res) {

          let model;
          const inURL = req.body.url.toString().trim();
          let validation = false;

          if (inURL.length == 0) {
               model = { url: inURL, error: "URL must not be empty"};
          }
          else {

               const split =  inURL.match(/(\w+:\/\/)([^/]+)(.*)/);
               if (split === null || (split[1] !== "https://" && split[1] !== "http://"))          {   validation = false;           model = { url: inURL, error: "URL must start with http:// or https://"}; }
               else                                                                                {   validation = true;   }
          }
          if (validation) {

               try {
                    const result = await app.locals.model.deleteURL(inURL);
                    model = { url: inURL, result: "URL " + inURL + " was deactivated."};
               }
               catch (err) {
                    console.error(err);
                    if(err.message.includes("bad domain"))
                         model = { url: inURL, error: err.message};
                    else
                         model = { url: inURL, serror: err.message};
               }
          }

          const html = doMustache(app, 'disable', model);
          res.send(html);
     };
}


function doRedirect(app){

 return async function(req, res) {

      console.log("redirect");

     };
}


function doMustache(app, templateId, view) {
  const templates = { footer: app.templates.footer };
  return mustache.render(app.templates[templateId], view, templates);
}


function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}
