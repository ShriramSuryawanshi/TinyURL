'use strict';

const assert = require('assert');
const mongo = require('mongodb').MongoClient;

class UrlShortener {

     static async make(mongoDbUrl, shortenerBase) {

          let spliturl = mongoDbUrl.match(/([A-Za-z]+)(:\/\/)([a-zA-Z0-9.-]*)(:[0-9]+)?(.*)/);

          if (spliturl === null)                            return { error: { code: 'BAD_MONGO_URL', message: 'Bad URL ' + mongoDbUrl     } };
          if (spliturl[1].toLowerCase() !== "mongodb")      return { error: { code: 'BAD_MONGO_URL', message: 'Bad scheme ' + spliturl[1] + '; must be "mongodb"'  } };
          if (spliturl[2] !== "://")                        return { error: { code: 'BAD_MONGO_URL', message: 'Bad URL ' + mongoDbUrl     } };
          if (spliturl[3].length === 0)                     return { error: { code: 'BAD_MONGO_URL', message: 'Bad domain ' + mongoDbUrl + '; too short'     } };
          if (spliturl[3].length > 253)                     return { error: { code: 'BAD_MONGO_URL', message: 'Bad domain ' + spliturl[3] + '; too long'     } };
          if (spliturl[3].indexOf("-") !== -1) {
               let temp_domain = spliturl[3].split(".");
               for (let i = 0; i < temp_domain.length; i++)
                    if (temp_domain[i].indexOf("-") === 0 || temp_domain[i].indexOf("-") === (temp_domain[i].length - 1))
                                                            return { error: { code: 'BAD_MONGO_URL', message: 'Bad domain ' + spliturl[3] + '; a hyphen can only occur in the inside of a domain label'     } };
          }
          if (spliturl[4] !== undefined) {
               let port = spliturl[4].replace(":", "");
               if (port > 65535 || port < 1)                return { error: { code: 'BAD_MONGO_URL', message: 'Bad port ' + port + '; must be between 1 and 65535'     } };
          }


          let splitbase = shortenerBase.match(/([a-zA-Z0-9.-]*)(:[0-9]+)?(.*)/);

          if (splitbase[1] === null)                        return { error: { code: 'BAD_SHORTNER_BASE', message: 'Bad URL ' + shortenerBase     } };
          if (splitbase[1].length === 0)                    return { error: { code: 'BAD_SHORTNER_BASE', message: 'Bad domain ' + shortenerBase + '; too short'    } };
          if (splitbase[1].length > 253)                    return { error: { code: 'BAD_SHORTNER_BASE', message: 'Bad domain ' + splitbase[2] + '; too long'    } };
          if (splitbase[1].indexOf("-") !== -1) {
               let temp_domain = splitbase[1].split(".");
               for (let i = 0; i < temp_domain.length; i++)
                    if (temp_domain[i].indexOf("-") === 0 || temp_domain[i].indexOf("-") === (temp_domain[i].length - 1))
                                                            return { error: { code: 'BAD_SHORTNER_BASE', message: 'Bad domain ' + splitbase[1] + '; a hyphen can only occur in the inside of a domain label'     } };
          }
          if (splitbase[2] !== undefined) {
               let port = splitbase[2].replace(":", "");
               if (port > 65535 || port < 1)                return { error: { code: 'BAD_SHORTNER_BASE', message: 'Bad port ' + port + '; must be between 1 and 65535'     } };
          }


          const MONGO_URL = spliturl[1] + spliturl[2] + spliturl[3] + spliturl[4];
          const client = await mongo.connect(MONGO_URL, MONGO_OPTIONS);

          const DB_NAME = spliturl[5].replace("/", "");
          const db = client.db(DB_NAME);

          const base = shortenerBase.toLowerCase();

          return new UrlShortener(base, client, db);
     }


     constructor(base, client, db) {

          this.base = base;
          this.client = client;
          this.db = db;
     }


     async close() {

          await this.client.close();
     }


     async clear() {

          this.urlDBLong = this.db.collection('urlDBLong');
          this.urlDBShort = this.db.collection('urlDBShort');

          this.urlDBLong.deleteMany({});
          this.urlDBShort.deleteMany({});

          return { };
     }


     async add(longUrl) {

          let spliturl = longUrl.match(/([A-Za-z]+)(:\/\/)([a-zA-Z0-9.-]*)(:[0-9]+)?(.*)/);

          if (spliturl === null)                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + longUrl     } };
          if (spliturl[1].toLowerCase() !== "http" && spliturl[1].toLowerCase() !== "https")   return { error: { code: 'URL_SYNTAX', message: 'Bad scheme ' + spliturl[1] + '; must be "http" or "https"'  } };
          if (spliturl[2] !== "://")                                                           return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + longUrl     } };
          if (spliturl[3].length === 0)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + longUrl + '; too short'     } };
          if (spliturl[3].length > 253)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; too long'     } };
          if (spliturl[3].toLowerCase() === this.base.toLowerCase())                           return { error: { code: 'DOMAIN', message: 'Domain of url ' + longUrl + ' is equal to SHORTENER_DOMAIN: ' + this.base } };
          if (spliturl[3].indexOf("-") !== -1) {
               let temp_domain = spliturl[3].split(".");
               for (let i = 0; i < temp_domain.length; i++)
                    if (temp_domain[i].indexOf("-") === 0 || temp_domain[i].indexOf("-") === (temp_domain[i].length - 1))
                                                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; a hyphen can only occur in the inside of a domain label' } };
          }
          if (spliturl[4] !== undefined) {
               let port = spliturl[4].replace(":", "");
               if (port > 65535 || port < 1)                                                   return { error: { code: 'URL_SYNTAX', message: 'Bad port ' + port + '; must be between 1 and 65535'     } };
          }

          let inScheme = spliturl[1].toLowerCase();
          let longURL =  spliturl[4] === undefined ? spliturl[3].toLowerCase() + spliturl[5] : spliturl[3].toLowerCase() + spliturl[4] + spliturl[5];
          let shortURL;

          this.urlDBLong = this.db.collection('urlDBLong');
          this.urlDBShort = this.db.collection('urlDBShort');

          if(await this.urlDBLong.findOne({_id:this.base + " " + longURL}) === null) {

               while(true) {

				shortURL = this.base + "/" + Math.abs(Math.floor(Math.random() * Math.floor(2**32) - 1)).toString(36);
				if(await this.urlDBShort.findOne({_id:this.base + " " + shortURL}) === null)
					break;
			}

               await this.urlDBLong.insertOne({_id:this.base + " " + longURL, tiny:shortURL, count:0, flag:false});
               await this.urlDBShort.insertOne({_id:this.base + " " + shortURL, long:longURL});

               return { value: inScheme + spliturl[2] + shortURL };
          }
          else {

               await this.urlDBLong.updateOne({_id:this.base + " " + longURL}, {$set:{flag:false}});
               return { value: inScheme + spliturl[2] + (await this.urlDBLong.findOne({_id:this.base + " " + longURL})).tiny };
          }
     }


     async query(shortUrl) {

          let spliturl = shortUrl.match(/([A-Za-z]+)(:\/\/)([a-zA-Z0-9.-]*)(:[0-9]+)?(.*)/);

          if (spliturl === null)                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + shortUrl     } };
          if (spliturl[1].toLowerCase() !== "http" && spliturl[1].toLowerCase() !== "https")   return { error: { code: 'URL_SYNTAX', message: 'Bad scheme ' + spliturl[1] + '; must be "http" or "https"'  } };
          if (spliturl[2] !== "://")                                                           return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + shortUrl     } };
          if (spliturl[3].length === 0)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + shortUrl + '; too short'     } };
          if (spliturl[3].length > 253)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; too long'     } };
          if (spliturl[3].toLowerCase() !== this.base.toLowerCase())                           return { error: { code: 'DOMAIN', message: 'Domain of url ' + shortUrl + ' not equal to SHORTENER_DOMAIN: ' + this.base } };
          if (spliturl[3].indexOf("-") !== -1) {
               let temp_domain = spliturl[3].split(".");
               for (let i = 0; i < temp_domain.length; i++)
                    if (temp_domain[i].indexOf("-") === 0 || temp_domain[i].indexOf("-") === (temp_domain[i].length - 1))
                                                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; a hyphen can only occur in the inside of a domain label' } };
          }
          if (spliturl[4] !== undefined) {
               let port = spliturl[4].replace(":", "");
               if (port > 65535 || port < 1)                                                   return { error: { code: 'URL_SYNTAX', message: 'Bad port ' + port + '; must be between 1 and 65535'     } };
          }

          this.urlDBLong = this.db.collection('urlDBLong');
          this.urlDBShort = this.db.collection('urlDBShort');

          let inScheme = spliturl[1].toLowerCase();
		let inDomain = spliturl[3].toLowerCase();
		let shortURL = this.base + spliturl[5];

          if (await this.urlDBShort.findOne({_id:this.base + " " + shortURL}) === null || (await this.urlDBLong.findOne({_id: this.base + " " + (await this.urlDBShort.findOne({_id:this.base + " " + shortURL})).long})).flag === true) {

               return { error: { code: 'NOT_FOUND', message: shortUrl + ' not found' } };
          }
          else {

               let longURL = (await this.urlDBShort.findOne({_id:this.base + " " + shortURL})).long;
               let count1 = (await this.urlDBLong.findOne({_id:this.base + " " + longURL})).count + 1;
               await this.urlDBLong.updateOne({_id:this.base + " " + longURL}, {$set:{count:count1}});
               return { value: inScheme + spliturl[2] + longURL };
          }
     }


     async count(url) {

          let spliturl = url.match(/([A-Za-z]+)(:\/\/)([a-zA-Z0-9.-]*)(:[0-9]+)?(.*)/);

          if (spliturl === null)                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + url     } };
          if (spliturl[1].toLowerCase() !== "http" && spliturl[1].toLowerCase() !== "https")   return { error: { code: 'URL_SYNTAX', message: 'Bad scheme ' + spliturl[1] + '; must be "http" or "https"'  } };
          if (spliturl[2] !== "://")                                                           return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + url     } };
          if (spliturl[3].length === 0)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + url + '; too short'     } };
          if (spliturl[3].length > 253)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; too long'     } };
          if (spliturl[3].indexOf("-") !== -1) {
               let temp_domain = spliturl[3].split(".");
               for (let i = 0; i < temp_domain.length; i++)
                    if (temp_domain[i].indexOf("-") === 0 || temp_domain[i].indexOf("-") === (temp_domain[i].length - 1))
                                                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; a hyphen can only occur in the inside of a domain label' } };
          }
          if (spliturl[4] !== undefined) {
               let port = spliturl[4].replace(":", "");
               if (port > 65535 || port < 1)                                                   return { error: { code: 'URL_SYNTAX', message: 'Bad port ' + port + '; must be between 1 and 65535'     } };
          }

          let inScheme = spliturl[1].toLowerCase();
		let inDomain = spliturl[3].toLowerCase();
          let URL = spliturl[4] === undefined ? spliturl[3].toLowerCase() + spliturl[5] : spliturl[3].toLowerCase() + spliturl[4] + spliturl[5];

          this.urlDBLong = this.db.collection('urlDBLong');
          this.urlDBShort = this.db.collection('urlDBShort');

          if (await this.urlDBLong.findOne({_id:this.base + " " + URL}) === null) {

               if (await this.urlDBShort.findOne({_id:this.base + " " + URL}) === null)                      return { error: { code: 'NOT_FOUND', message: url + ' not found' } };
               else {
                    let longURL = (await this.urlDBShort.findOne({_id:this.base + " " + URL})).long;
                    let count1 = (await this.urlDBLong.findOne({_id:this.base + " " + longURL})).count;
                    return { value:  count1  };
               }
          }
          else {

               let count1 = (await this.urlDBLong.findOne({_id:this.base + " " + URL})).count;
               return { value:  count1  };
          }
     }


     async deactivate(url) {

          let spliturl = url.match(/([A-Za-z]+)(:\/\/)([a-zA-Z0-9.-]*)(:[0-9]+)?(.*)/);

          if (spliturl === null)                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + url     } };
          if (spliturl[1].toLowerCase() !== "http" && spliturl[1].toLowerCase() !== "https")   return { error: { code: 'URL_SYNTAX', message: 'Bad scheme ' + spliturl[1] + '; must be "http" or "https"'  } };
          if (spliturl[2] !== "://")                                                           return { error: { code: 'URL_SYNTAX', message: 'Bad URL ' + url     } };
          if (spliturl[3].length === 0)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + url + '; too short'     } };
          if (spliturl[3].length > 253)                                                        return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; too long'     } };
          if (spliturl[3].indexOf("-") !== -1) {
               let temp_domain = spliturl[3].split(".");
               for (let i = 0; i < temp_domain.length; i++)
                    if (temp_domain[i].indexOf("-") === 0 || temp_domain[i].indexOf("-") === (temp_domain[i].length - 1))
                                                                                               return { error: { code: 'URL_SYNTAX', message: 'Bad domain ' + spliturl[3] + '; a hyphen can only occur in the inside of a domain label' } };
          }
          if (spliturl[4] !== undefined) {
               let port = spliturl[4].replace(":", "");
               if (port > 65535 || port < 1)                                                   return { error: { code: 'URL_SYNTAX', message: 'Bad port ' + port + '; must be between 1 and 65535'     } };
          }

          let inScheme = spliturl[1].toLowerCase();
		let inDomain = spliturl[3].toLowerCase();
          let URL = spliturl[4] === undefined ? spliturl[3].toLowerCase() + spliturl[5] : spliturl[3].toLowerCase() + spliturl[4] + spliturl[5];

          this.urlDBLong = this.db.collection('urlDBLong');
          this.urlDBShort = this.db.collection('urlDBShort');

          if (await this.urlDBLong.findOne({_id:this.base + " " + URL}) === null) {

               if (await this.urlDBShort.findOne({_id:this.base + " " + URL}) === null)                       return { error: { code: 'NOT_FOUND', message: url + ' not found' } };
               else {
                    let longURL = (await this.urlDBShort.findOne({_id:this.base + " " + URL})).long;
                    await this.urlDBLong.updateOne({_id:this.base + " " + longURL}, {$set:{flag:true}});
                    return { };
               }
          }
          else {

               await this.urlDBLong.updateOne({_id:this.base + " " + URL}, {$set:{flag:true}});
               return { };
          }
     }
}

module.exports = UrlShortener

const MONGO_OPTIONS = {
     useNewUrlParser: true
};


function validateScheme(scheme, match) {


}
