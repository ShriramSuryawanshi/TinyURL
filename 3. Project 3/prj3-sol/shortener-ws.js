const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

function serve(port, base, model) {
  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

module.exports = {
  serve: serve
}

function setupRoutes(app) {
  const base = app.locals.base;
  const XURL = '/x-url';
  const XTXT = '/x-text';

  app.use(cors());
  app.use(bodyParser.json());

  app.get(`${XURL}`, doQuery(app));
  app.get(`${base}/:id`, doRedirect(app));
  app.post(`${XURL}`, doCreate(app));
  app.delete(`${XURL}`, doDelete(app));
  app.post(`${XTXT}`, doReplace(app));

  //routes for specific urls:
  //@TODO: set up routes for specific urls

  //error route
  app.use(doErrors()); //must be last
}


//@TODO add handlers for routes set up above.  Typical handler
//will be wrapped using errorWrap() to ensure that errors
//don't slip past the seams of any try-catch blocks within the
//handlers.  So a typical handler may look like:
//function doSomething(app) {
//  return errorWrap(async function(req, res) {
//    //do something typically within a try-catch
//   });
//}


function doRedirect(app) {

  return errorWrap(async function(req, res) {
    const url = requestUrl(req);

    try {
      const results = await app.locals.model.query(url);
      res.redirect(results.value);
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


function doQuery(app) {

  return errorWrap(async function(req, res) {
    const q = req.query || {};

    try {
         if(q.url === undefined) {
              throw {
                    status: 400,
                    code: "URL_SYNTAX",
                    message: "bad URL "
              };
         }
         else {
             const results = await app.locals.model.info(q.url);
             res.json(results);
        }
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


function doCreate(app) {

  return errorWrap(async function(req, res) {
     const q = req.query || {};

    try {
         if(q.url === undefined) {
              throw {
                    status: 400,
                    code: "URL_SYNTAX",
                    message: "bad URL "
              };
         }
         else {
             const results = await app.locals.model.add(q.url);
             res.json(results);
        }
    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}



function doDelete(app) {

  return errorWrap(async function(req, res) {
     const q = req.query || {};

    try {
         if(q.url === undefined) {
              throw {
                    status: 400,
                    code: "URL_SYNTAX",
                    message: "bad URL "
              };
         }
         else {
             const results = await app.locals.model.deactivate(q.url);
             res.sendStatus(OK);
        }
    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


function doReplace(app) {

  return errorWrap(async function(req, res) {

     var q = req.body.text.toString();

    try {
         const urls = q.match(/(https?:\/\/[A-Za-z0-9\_\-\/\.\?\=\&\%\#\@\+]+)/g);
         new_urls = [];

         for(i = 0; i < urls.length; i++) {

             try {
                  const results = await app.locals.model.add(urls[i]);
                  new_urls[i] = results.value.toString();
             }
             catch(err) {
                 // const mapped = mapError(err);
                 // res.status(mapped.status).json(mapped);
             }
          }

          for(i = 0; i < urls.length; i++) {

               if(new_urls[i] !== undefined) {

                    var start = q.indexOf(urls[i]);
                    var end = urls[i].length;
                    var temp1 = q.slice(0, start);
                    var temp2 = q.slice(start + end);
                    q = temp1 + new_urls[i] + temp2;
               }
          }

          const obj = { value : q };
          res.json(obj);
    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

/*************************** Mapping Errors ****************************/

const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  console.error(err);
  return err.code
    ? { status: (ERROR_MAP[err.code] || BAD_REQUEST),
	code: err.code,
	message: err.message
      }
    : { status: SERVER_ERROR,
	code: 'INTERNAL',
	message: err.toString()
      };
}

/****************************** Utilities ******************************/

/** Return original URL for req */
function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}
