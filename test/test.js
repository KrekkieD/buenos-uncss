'use strict';

var $buenosUncss = require('..');

$buenosUncss.glob('./test/**/*.html', './test/**/*.css')
    .then(function () {
        console.log('done');
    });
