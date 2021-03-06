// Copyright (c) 2010 Romain Vallet
// Licensed under the MIT license, read license.txt

var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push( {
	name: 'Amazon',
	version: '0.2',
	prepareImgLinks: function(callback) {
		var res = [];
		hoverZoom.srcReplace(res, 
			'a img[src*=.images-amazon.com]:not([src*=g-ecx.images-amazon.com]), a img[src*=/img.amazon.]',
			/\._.*\./,
			'.'
		);		
		callback($(res));
	}
});