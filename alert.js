var ajax = {};
var XCONF = {
    api : 'http://shopsheriff-s.herokuapp.com/api/product-view'   
};
function getDomain(url, subdomain) {
    subdomain = subdomain || false;

    url = url.replace(/(https?:\/\/)?(www.)?/i, '');

    if (!subdomain) {
        url = url.split('.');

        url = url.slice(url.length - 2).join('.');
    }

    if (url.indexOf('/') !== -1) {
        return url.split('/')[0];
    }

    return url;
}
ajax.x = function () {
    if (typeof XMLHttpRequest !== 'undefined') {
        return new XMLHttpRequest();
    }
    var versions = [
        "MSXML2.XmlHttp.6.0",
        "MSXML2.XmlHttp.5.0",
        "MSXML2.XmlHttp.4.0",
        "MSXML2.XmlHttp.3.0",
        "MSXML2.XmlHttp.2.0",
        "Microsoft.XmlHttp"
    ];

    var xhr;
    for (var i = 0; i < versions.length; i++) {
        try {
            xhr = new ActiveXObject(versions[i]);
            break;
        } catch (e) {
        }
    }
    return xhr;
};

ajax.send = function (url, callback, method, data, async) {
    if (async === undefined) {
        async = true;
    }
    var x = ajax.x();
    var status;
    var data;
    x.open(method, url, async);
    x.onreadystatechange = function () {
        if (x.readyState == 4) {
            status = x;
            callback(x.responseText);
        }
    };
    if (method == 'POST') {
        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    x.send(data)
};

ajax.get = function (url, data, callback, async) {
    var query = [];
    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, async)
};

ajax.post = function (url, data, callback, async) {
    var query = [];
    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    ajax.send(url, callback, 'POST', query.join('&'), async)
};


function onlyParseProducts(callback) {
    ajax.get(window.location.href + '.json', {}, function(res) {
        try {
            res = JSON.parse(res);
            return callback(res.product);
        } catch(e) {
            console.log('Not on product page');
        }
    });
}

function getUserType(callback) {
    var domain = getDomain(location.href, true);
    var proxyUrl = '//' + domain + '/apps/admin-check/test.php';
    console.log('Domain: ', domain);
    console.log('proxyUrl: ', proxyUrl);
    ajax.get(proxyUrl, {}, function(res) {
        try {
            var matches = res.match(/{[\s]*"shop-sheriff-user-type"[\s:{]*"type" : "(admin|user)"[\s]*}\s*}/);
            var type = matches[1]; // not the whole matched string, but the first matched selector in parenthesis
            console.log('Type: ', type);
            return callback(type);
        } catch(e) {
            console.log('Bad user type', e);
        }
    });
}

var isProductPage = window.location.href.indexOf('products') !== -1;
if(isProductPage) {
    getUserType(function(typeResponse) {
        onlyParseProducts(function(productResponse) {
            var input = {
                userType : typeResponse,
                product : productResponse
            };
            console.log('Posting data to view product endpoint: ', input);
            ajax.post(XCONF.api, input, function() { console.log('done'); }, true);
        });
    });
}
