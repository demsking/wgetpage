'use strict';

var fs = require('fs');
var path = require('path');
var request = require('request');
var mkdirp = require('mkdirp');
var Parser = require("jq-html-parser");

const EXT_BINARY = ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.mp4'];

var BASE_URL, PATH_DEST;

module.exports = {
    init: function(base, dest) {
        BASE_URL = base.search(/\.html/) > -1 ? path.dirname(base) : base;
        PATH_DEST = dest;
        
        if (BASE_URL[-1] != '/') {
            BASE_URL += '/';
        }
        
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
                
                done && done(body);
            } else {
                console.error('Failed to get ' + url + '. Error: ' + JSON.stringify(err, false, 4));
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
            hrefs: {
                selector: "*",
                attribute: "href",
                multiple: true,
            },
        });
        
        var result = parser.parse(body.toString());
        
        for (let image of result.images) {
            this.download(image);
        }
        
        var files = [];
        
        for (let href of result.hrefs) {
            if (href == '#') {
                continue;
            }
            
            if (files.indexOf(href) > -1) {
                continue;
            }
            
            if (href.search(/^http:\/\//) == 0) {
                continue;
            }
            
            files.push(href); // caching
            
            this.download(href);
        }
        
        done && done(body);
    },
};
