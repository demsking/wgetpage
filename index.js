var wget = require('./lib');

module.exports = function(url, dest, done) {
    wget.init(url, dest);
    wget.download(url, true, done);
};
