﻿// Copyright (c) 2010 Romain Vallet
// Licensed under the MIT license, read license.txt

var hoverZoomPlugins = hoverZoomPlugins || [];
function hoverZoom() {

	var wnd = $(window);
	var hoverZoomImg = $('<div id="hoverZoomImg"></div>').appendTo(document.body);
	var imgFullSize = null;		
	var imgLoading = $('<img />').attr('src', chrome.extension.getURL('images/loading.gif'));
	
	var imgSrc = '';
	var currentLink = null;
	var mousePos = {};
	var loading = false;
	var bindLinksTimeout;
	var extensionEnabled = true;
	var bindLinksDelay = 500;
	
	function posImg(position) {
		if (!imgFullSize)
			return;
		position = position || {top:mousePos.top, left:mousePos.left};
		
		var offset = 20;
		
		if (loading) {
			position.left += offset;
			position.top -= 10;
		} else {
			var margin = 8;
			var padding = 6;
			
			imgFullSize.width('auto').height('auto');
			var naturalWidth = imgFullSize.width();
			var naturalHeight = imgFullSize.height();
			if (!naturalWidth || !naturalHeight)
				return;
			
			var displayOnRight = true;
			if (position.left - wnd.scrollLeft() < wnd.width() / 2) {
				position.left += offset;
				if (naturalWidth + padding > wnd.width() - position.left) {
					imgFullSize.width(wnd.width() - position.left - padding + wnd.scrollLeft());
				}
			} else {
				displayOnRight = false;
				position.left -= offset;
				if (naturalWidth + padding > position.left) {
					imgFullSize.width(position.left - padding - wnd.scrollLeft());
				}			
			}
			position.top -= hoverZoomImg.height() / 2;
			if (hoverZoomImg.height() > wnd.height())
				imgFullSize.height(wnd.height() - padding).width('auto');
			if (!displayOnRight) 
				position.left -= hoverZoomImg.width() + padding;
			if (position.top + hoverZoomImg.height() >= wnd.scrollTop() + wnd.height())
				position.top = wnd.scrollTop() + wnd.height() - hoverZoomImg.height() - padding;
			if (position.top < wnd.scrollTop())
				position.top = wnd.scrollTop();	
		}
		
		hoverZoomImg.css(position);
	}
	
	function hideHoverZoomImg() {
		if (imgFullSize != null) {
			$(imgFullSize).remove();
			imgFullSize = null;
		}
		hoverZoomImg.empty();
		hoverZoomImg.hide();
	}

	function documentMouseMove(event) {
		if (!extensionEnabled)
			return;
			
		mousePos = {top:event.pageY, left:event.pageX};
		var links = $(event.target).parents('.hoverZoomLink');
		if ($(event.target).hasClass('hoverZoomLink'))
			links = links.add($(event.target));
		if (links.length > 0) {
			if (links.data('hoverZoomSrc') && links.data('hoverZoomSrc') != 'undefined' && 
				links.data('hoverZoomSrc')[links.data('hoverZoomSrcIndex')] && 
				links.data('hoverZoomSrc')[links.data('hoverZoomSrcIndex')] != 'undefined') {
				// Happens when the mouse goes from an image to another without hovering the page background
				if (links.data('hoverZoomSrc')[links.data('hoverZoomSrcIndex')] != imgSrc) {
					hideHoverZoomImg();
				}				
				if (!imgFullSize) {
					currentLink = links;
					imgSrc = links.data('hoverZoomSrc')[links.data('hoverZoomSrcIndex')];
					loadFullSizeImage();
				} else {
					posImg();
				}
			} else {
				return;
			}			
		} else {
			hideHoverZoomImg();
		}
	}
	
	function loadFullSizeImage() {
		// If no image is currently displayed...
		if (!imgFullSize) {
			loading = true;
			imgLoading.appendTo(hoverZoomImg);
			hoverZoomImg.show();
			imgFullSize = $('<img />').attr('src', imgSrc).load(function() {
				// Only the last hovered link gets displayed
				if (imgSrc == $(this).attr('src')) {
					loading = false;
					hoverZoomImg.offset({top:-9000, left:-9000}); 	// hides the image while making it available for size calculations
					hoverZoomImg.empty();
					$(this).appendTo(hoverZoomImg);
					posImg();
					hoverZoomImg.show();
				}
			}).error(function() {
				if (imgSrc == $(this).attr('src')) {
					var hoverZoomSrcIndex = currentLink.data('hoverZoomSrcIndex');
					if (hoverZoomSrcIndex < currentLink.data('hoverZoomSrc').length - 1) {
						// If the link has several possible sources, we try to load the next one
						hoverZoomSrcIndex++;
						currentLink.data('hoverZoomSrcIndex', hoverZoomSrcIndex);
						imgSrc = currentLink.data('hoverZoomSrc')[hoverZoomSrcIndex];
						imgFullSize = null;
						window.setTimeout(loadFullSizeImage, 10);
					} else {
						hideHoverZoomImg();
						console.warn('HoverZoom: Failed to load image: ' + imgSrc);
					}
				}
			});
		}
		posImg();
	}
	
	function bindImgLinks() {
		for (i in hoverZoomPlugins) {
			hoverZoomPlugins[i].prepareImgLinks().each(function() {
				if (!$(this).data('hoverZoomSrc')) {
					bindImgLinksAsync();
				} else {
					$(this).addClass('hoverZoomLink');
					
					// Convert URL special characters
					var srcs = $(this).data('hoverZoomSrc');
					for (i in srcs) {
						srcs[i] = deepUnescape(srcs[i]);
					}
					$(this).data('hoverZoomSrc', srcs);
					
					$(this).data('hoverZoomSrcIndex', 0);
				}
			});
		}
	}
	
	function bindImgLinksAsync(resetDelay) {
		if (!extensionEnabled)
			return;
		if (resetDelay)
			bindLinksDelay = 500;
		window.clearTimeout(bindLinksTimeout);
		bindLinksTimeout = window.setTimeout(bindImgLinks, bindLinksDelay);
		bindLinksDelay *= 2;
	}
	
	function deepUnescape(url) {
		var ueUrl = unescape(encodeURIComponent(url));
		while (url != ueUrl) {
			url = ueUrl;
			ueUrl = unescape(url);
		}
		return url;
	}
	
	function applyEnabledState() {
		if (extensionEnabled) {
			init();
		} else {
			hideHoverZoomImg();
			$(document).unbind('mousemove', documentMouseMove);
		}
	}
	
	function init() {
	
		var excludedSites = ["photos.live.com"];
		var siteHost = document.location.href.split('/', 3)[2];
		for (i in excludedSites) {
			if (excludedSites[i].length <= siteHost.length)
				if (siteHost.substr(siteHost.length - excludedSites[i].length) == excludedSites[i])
					return;
		}
	
		bindImgLinks();		
		$(document).bind('mousemove', documentMouseMove);
		
		wnd.bind('DOMNodeInserted', function(event) {
			if (event.srcElement && (event.srcElement.nodeName == 'A' || $(event.srcElement).find('a').length || $(event.srcElement).parents('a').length)) {
				bindImgLinksAsync(true);
			}
		});
		
		wnd.load(function () {
			bindImgLinksAsync(true);
		});
	}

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		switch(request.action) {
			case 'extensionEnabledChanged':
				extensionEnabled = request.extensionEnabled;
				applyEnabledState();
				break;
		}
	});
	
	chrome.extension.sendRequest({action : 'isExtensionEnabled'}, function(enabled) {
		extensionEnabled = enabled;
		applyEnabledState();
	});
};

function jQueryOnLoad(data) {
	if (data != null) {
		eval(data);
		hoverZoom();
	} else {
		console.warn('HoverZoom: Failed to load jQuery');
	}
}

chrome.extension.sendRequest({action : 'loadJQuery'}, jQueryOnLoad);