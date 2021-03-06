// Copyright (c) 2011 Romain Vallet <romain.vallet@gmail.com>
// Licensed under the MIT license, read license.txt

var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push({
    name:'ImageShack (a)',
    version:'0.3',
    prepareImgLinks:function (callback) {
        var res = [];
        hoverZoom.urlReplace(res,
            'a[href*="imageshack.us/my.php"], a[href*="imageshack.us/i/"',
            /img(\d+)\.imageshack\.us\/(?:i\/|my\.php\?image=)([\w\.]+).*$/,
            'desmond.imageshack.us/Himg$1/scaled.php?server=$1&filename=$2&res=medium'
        );
        hoverZoom.urlReplace(res,
            'a[href*="imageshack.us/photo/my-images"]',
            /imageshack\.us\/photo\/my-images\/(\d+)\/([^\/]+)\/$/,
            'desmond.imageshack.us/Himg$1/scaled.php?server=$1&filename=$2&res=medium'
        );
        hoverZoom.urlReplace(res,
            'a[href*="imageshack.us/f/"]',
            /imageshack\.us\/f\/(\d+)\/([^\/]+)\/$/,
            'desmond.imageshack.us/Himg$1/scaled.php?server=$1&filename=$2&res=medium'
        );
        callback($(res));
    }
});