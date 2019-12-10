#!/usr/bin/env nodejs

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const util = require('util');
const readFile = util.promisify(fs.readFile);

const UrlShortener = require('./url-shortener');

/** Top level routine: domain specifies domain for URL shortening service */
async function go(domain) {
  const shortener = new UrlShortener(domain);
  interact(shortener);
}

const PROMPT = '>> ';

function interact(shortener) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
    prompt: PROMPT,
  });
  rl.prompt();
  rl.on('line', (line) => doLine(shortener, rl, line));
}

const CMD_WIDTH = 12;
function help() {
  Object.entries(COMMANDS).
    forEach(([k, v]) => {
      const rands = v.length === 1 ? '' : ' ' + v.slice(1).join(' ');
      const opRand = `${k}${rands}`;
      const space = ' '.repeat(CMD_WIDTH - opRand.length);
      const msg = `${opRand}:${space}${v[0].name}${rands}`;
      console.error(msg);
    });
  return {}
}

const COMMANDS = {
  ['?']: [ UrlShortener.prototype.query, 'SHORT_URL' ],
  ['+']: [ UrlShortener.prototype.add, 'LONG_URL' ],
  ['-']: [ UrlShortener.prototype.remove, 'URL' ],
  ['#']: [ UrlShortener.prototype.count, 'URL' ],
  ['h']: [ help, ]
};

function doLine(shortener, rl, line) {
  const [cmdChar, restLine] = [line[0], line.slice(1).trim()];
  const cmdFn = COMMANDS[cmdChar] &&  COMMANDS[cmdChar][0];
  if (!cmdFn) {
    console.error(`bad input "${line}"`); help();
  }
  else {
    const result = cmdFn.call(shortener, restLine);
    if (result.error) {
      console.error(result.error);
    }
    else {
      console.log(result);
    }
  }
  rl.prompt();
}


//top-level code
if (process.argv.length < 3) {
  console.error('usage: %s SHORTENER_DOMAIN', path.basename(process.argv[1]));
  process.exit(1);
}

(async (args) => await go(process.argv[2]))();
