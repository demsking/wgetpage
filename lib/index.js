'use strict';

var fs = require('fs');
var path = require('path');
var request = require('request');
var mkdirp = require('mkdirp');
var Parser = require("jq-html-parser");

const EXT_BINARY = ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.webm', '.mp4', 
                    '.ogg', '.ogv', '.mp3', '.ttf', '.otf', '.woff', '.woff2'];

var BASE_URL, PATH_DEST;
        
var files = [];

var Module = {
    init: function(base, dest) {
        BASE_URL = base.search(/\.html/) > -1 ? path.dirname(base) : base;
        PATH_DEST = dest;
        
        if (BASE_URL[-1] != '/') {
            BASE_URL += '/';
        }
        
        files = [];
        
        mkdirp.sync(PATH_DEST);
    },
    
    download: function(url, parse_html, done) {
        if (typeof parse_html == 'function') {
            done = parse_html;
            parse_html = false;
        }
        
        var file = url;
        
        if (url.search(/^https?:\/\//) > -1) {
            file = url.split(BASE_URL)[1];
            
            if (!file) {
                file = 'index.html';
            }
        } else {
            url = BASE_URL + url;
        }
        
        if (files.indexOf(file) > -1) {
            return;
        }
        
        files.push(file); // caching
        
        var options = {};
        var ext = path.extname(url);
        
        if (EXT_BINARY.indexOf(ext) > -1) {
            options.encoding = 'binary';
        }
        
        request(url, options, function(err, res, body) {
            if (!err && res.statusCode == 200) {
                if (parse_html) {
                    body = body.toString().replace(/("|')\/\//g, '$1http://');
                }
                
                var dest = path.join(PATH_DEST, file);
                
                mkdirp.sync(path.dirname(dest));
                
                fs.writeFileSync(dest, body, options.encoding);
                
                console.log(dest);
                
                if (parse_html) {
                    Module.parse(body, done);
                }
            } else {
                console.error('Failed to get ' + url);
                console.error(JSON.stringify(err, false, 4));
            }
        });
    },

    parse: function(body, done) {
        console.log('Parsing...');
        
        var parser = new Parser({
            images: {
                selector: "*",
                attribute: "src",
                multiple: true,
            },
            styles: {
                selector: "*",
                attribute: "style",
                regexp: "url\\(([\/A-z0-9_-]+\.(png|jpe?g|gif|svg))\\)",
                multiple: true,
            },
            hrefs: {
                selector: "*",
                attribute: "href",
                multiple: true,
            },
        });
        
        var matches = body.toString().match(/[\/A-z0-9_-]+\.(png|jpe?g|gif|mp4|mp3|ogg|ogv|webm|html|css|ttf|otf|woff2?|svg)/ig);
        
        var result = parser.parse(body.toString());
        var links = [].concat(matches, result.images, result.styles, result.hrefs);
        
        for (let file of links) {
            if (file[0] == '#') {
                continue;
            }
            
            if (file.search(/^https?:\/\//) == 0) {
                continue;
            }
            
            this.download(file);
        }
        
        done && done();
    },
};

module.exports = Module;
