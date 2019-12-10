'use strict';

const axios = require('axios');

function UrlWs(baseUrl) {
  this.usersUrl = `${baseUrl}`;
}

module.exports = UrlWs;


UrlWs.prototype.translateText = async function(data) {
  try {
    const response = await axios.post(this.usersUrl + "/x-text", data);
    return response.data;
  }
  catch (err) {
    console.error(err);
    throw (err.response && err.response.data) ? err.response.data : err;
  }
};


UrlWs.prototype.deleteURL = async function(url) {
  try {
    const response = await axios.delete(this.usersUrl + "/x-url?url=" + url);
    return response.data;
  }
  catch (err) {
    console.error(err);
    throw (err.response && err.response.data) ? err.response.data : err;
  }
};


UrlWs.prototype.urlInfo = async function(url) {
  try {
    const response = await axios.get(this.usersUrl + "/x-url?url=" + url);
    return response.data;
  }
  catch (err) {
    console.error(err);
    throw (err.response && err.response.data) ? err.response.data : err;
  }
};
