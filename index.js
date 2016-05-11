var wget = require('./lib');

module.exports = function(url, dest) {
    wget.init(url, dest);

    wget.download(url, true, function(body) {
        wget.parse(body);
    });
};
