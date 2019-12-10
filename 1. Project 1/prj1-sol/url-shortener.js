'use strict';

let globalDomain;        // user input domain
let inScheme;            // scheme of the user input URL
let inDomain;            // domain of the user input URL
let longURL;             // long URL, not the tiny
let shortURL;            // tiny URL, not the long

let urlDBLong = {};      // { longURL: [ shortURL, count, removed flag ] }
let urlDBShort = {};     // { shortURL: longURL }


class UrlShortener {

  constructor(domain) {
    //@TODO

	globalDomain = domain;
  }


  add(longUrl) {

	let splitUrl = longUrl.match(/([A-Za-z]+:\/\/)([a-zA-Z0-9.]*)(.*)/);

	if (splitUrl === null || splitUrl[1].length < 7 || splitUrl[2].length === 0 ) {

          // return error on - empty or invalid URL OR scheme is not http/https OR empty domain
		return { error: { code: 'URL_SYNTAX', message: 'URL_SYNTAX: bad url ' + longUrl} };
	}
	else {
		inScheme = splitUrl[1].toLowerCase();
		longURL = splitUrl[2].toLowerCase() + splitUrl[3];

		if(urlDBLong[longURL] === undefined) {

               // longURL is not seen before
			while(true) {

                    // generate unique char sequence for shortURL
				shortURL = Math.abs(Math.floor(Math.random() * Math.floor(2**32) - 1)).toString(36);
				if(urlDBShort[shortURL] === undefined)
					break;
			}

               urlDBLong[longURL] = [];
			shortURL = "/" + shortURL;

			urlDBLong[longURL][0] = shortURL;         // tinyURL
			urlDBLong[longURL][1] = 0;                // count
			urlDBLong[longURL][2] = false;            // removed flag

			urlDBShort[shortURL] = longURL;

			return { value: inScheme + globalDomain + shortURL };

		}
		else {

               // longURL was seen before, update the removed flag, return the old value
			urlDBLong[longURL][2] = false;
			return { value: inScheme + globalDomain + urlDBLong[longURL][0] };
		}
	}
  }


  query(shortUrl) {

	let splitUrl = shortUrl.match(/([A-Za-z]+:\/\/)([a-zA-Z0-9.]*)(.*)/);

	if (splitUrl === null || splitUrl[1].length < 7) {

          // return error on - empty or invalid url or scheme is invalid
		return { error: { code: 'URL_SYNTAX', message: 'URL_SYNTAX: bad url ' + shortUrl} };
	}
	else  if (splitUrl[2].toLowerCase() !== globalDomain.toLowerCase()) {

          // return error on - domain doesn't match the shortner domain
		return { error: { code: 'DOMAIN', message: 'DOMAIN: domain of url ' + shortUrl + ' not equal to ' + globalDomain } };
	}
	else {

		inScheme = splitUrl[1].toLowerCase();
		inDomain = splitUrl[2].toLowerCase();
		shortURL = splitUrl[3];

		if(urlDBShort[shortURL] === undefined || urlDBLong[urlDBShort[shortURL]][2] === true) {

               // return error on - shortURL is never seen before OR shortURL is marked as removed
			return { error: { code: 'NOT_FOUND', message: 'NOT_FOUND: ' + shortUrl + ' not found' } };
		}
		else {

               // shortURL is valid, not marked as removed, return the long URL, increase view count
			urlDBLong[urlDBShort[shortURL]][1] += 1;
			return { value: inScheme + urlDBShort[shortURL] };
		}
	}
  }


  count(url) {

     let splitUrl = url.match(/([A-Za-z]+:\/\/)([a-zA-Z0-9.]*)(.*)/);

 	if (splitUrl === null || splitUrl[1].length < 7 || splitUrl[2].length === 0 ) {

          // return error on - empty or invalid URL OR scheme is not http/https OR empty domain
 		return { error: { code: 'URL_SYNTAX', message: 'URL_SYNTAX: bad url ' + url} };
 	}
 	else {
 		inScheme = splitUrl[1].toLowerCase();
 		longURL = splitUrl[2].toLowerCase() + splitUrl[3];

 		if(urlDBLong[longURL] === undefined) {

               // retrun error on - no URL mapping found
               return { error: { code: 'NOT_FOUND', message: 'NOT_FOUND: ' + url + ' not found' } };
          }
          else {

               // mapping found - return the count
               return { value: urlDBLong[longURL][1] };
          }
     }
  }


  remove(url) {

     let splitUrl = url.match(/([A-Za-z]+:\/\/)([a-zA-Z0-9.]*)(.*)/);

     if (splitUrl === null || splitUrl[1].length < 7 || splitUrl[2].length === 0 ) {

           // return error on - empty or invalid URL OR scheme is not http/https OR empty domain
           return { error: { code: 'URL_SYNTAX', message: 'URL_SYNTAX: bad url ' + url} };
      }
      else {
           inScheme = splitUrl[1].toLowerCase();
           longURL = splitUrl[2].toLowerCase() + splitUrl[3];

           if(urlDBLong[longURL] === undefined) {

                // retrun error on - no URL mapping found
                return { error: { code: 'NOT_FOUND', message: 'NOT_FOUND: ' + url + ' not found' } };
           }
           else {

                // mapping found - set removed flag to true
                urlDBLong[longURL][2] =  true;
                return { };
           }
      }
  }



  //@TODO add auxiliary methods here; prefix their names with _, to
  //indicate "private".

}

//UrlShortener class as only export
module.exports = UrlShortener

//@TODO Add auxiliary functions here which do not need access to a
//UrlShortener instance; they may be called from methods without
//needing to be prefixed with `this`.
