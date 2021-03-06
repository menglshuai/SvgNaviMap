"use strict";

function MZP() { // map_zoom_pan
	"use strict";
}

/* Constants: */
MZP.leftArrow = 37; // left arrow key.
MZP.upArrow = 38; // up arrow key
MZP.rightArrow = 39; // right arrow key
MZP.downArrow = 40; // down arow key

/* Globals: */
MZP.SVGRoot = new Array();
MZP.isInit = false;
MZP.panRate = 10; // number of pixels to pan per key press.
MZP.zoomRate = 1.2; // should be greater than 1. Increase this value for faster
// MZP.zoomLevel = 1; // current zoom level
MZP.zoomLevel = new Array();

MZP.isMouseDown = false;
// MZP.isMousePosition = null;
MZP.isPanning = false;

MZP.backup_width = new Array();
MZP.backup_height = new Array();
MZP.backup_zoomLevel = new Array();

/**
 * 
 * @param evt
 */
MZP.processKeyPress = function(evt) {
	"use strict";
	var id = G.getSvgId(evt);

	var viewBox = MZP.SVGRoot[id].getAttribute('viewBox'); // Grab the object
	// representing the SVG
	// element's viewBox
	// attribute.
	var viewBoxValues = viewBox.split(' '); // Create an array and insert each
	// individual view box attribute
	// value (assume they're seperated
	// by a single whitespace
	// character).

	viewBoxValues[0] = parseFloat(viewBoxValues[0]); // Convert string
	// "numeric" values to
	// actual numeric
	// values.
	viewBoxValues[1] = parseFloat(viewBoxValues[1]);

	switch (evt.keyCode) {
	case MZP.leftArrow:
		viewBoxValues[0] -= MZP.panRate; // Increase the x-coordinate value
		// of the viewBox attribute to pan
		// right.
		break;
	case MZP.rightArrow:
		viewBoxValues[0] += MZP.panRate; // Decrease the x-coordinate value
		// of the viewBox attribute to pan
		// left.
		break;
	case MZP.upArrow:
		viewBoxValues[1] -= MZP.panRate; // Increase the y-coordinate value
		// of the viewBox attribute to pan
		// down.
		break;
	case MZP.downArrow:
		viewBoxValues[1] += MZP.panRate; // Decrease the y-coordinate value
		// of the viewBox attribute to pan
		// up.
		break;
	}
	MZP.SVGRoot[id].setAttribute('viewBox', viewBoxValues.join(' ')); // Convert

	// do not propagate this key press to avoid browser window scrolling.
	evt.preventDefault();

	// the
	// viewBoxValues
	// array into a
	// string with a
	// white space
	// character
	// between the
	// given values.
};

/*
 * scalePoint= Array which points to the point towards which is to be scaled.
 * I.e. if the image is scaled to to a single pixel, this pixel will be located
 * at scalePoint. scaledPoint is measured as fraction of the SVG container, i.e.
 * [0.5, 0.5] is the center.
 */
MZP.zoom = function(zoomType, scalePoint, id) {
	"use strict";
	var viewBox = MZP.SVGRoot[id].getAttribute('viewBox'); // Grab the object
	// representing the SVG
	// element's viewBox
	// attribute.
	var viewBoxValues = viewBox.split(' '); // Create an array and insert each
	// individual view box attribute
	// value (assume they're seperated
	// by a single whitespace
	// character).

	viewBoxValues[2] = parseFloat(viewBoxValues[2]); // Convert string
	// "numeric" values to
	// actual numeric
	// values.
	viewBoxValues[3] = parseFloat(viewBoxValues[3]);
	viewBoxValues[0] = parseFloat(viewBoxValues[0]);
	viewBoxValues[1] = parseFloat(viewBoxValues[1]);

	var oldWidth = viewBoxValues[2];
	var oldHeight = viewBoxValues[3];

	if (zoomType == 'zoomIn') {
		viewBoxValues[2] /= MZP.zoomRate; // Decrease the width and height
		// attributes of the viewBox
		// attribute to zoom in.
		viewBoxValues[3] /= MZP.zoomRate;
	} else if (zoomType == 'zoomOut') {
		viewBoxValues[2] *= MZP.zoomRate; // Increase the width and height
		// attributes of the viewBox
		// attribute to zoom out.
		viewBoxValues[3] *= MZP.zoomRate;
	}
	// G.svg_parent.clientWidth ~= 1600
	var fixedXportion = scalePoint[0];
	viewBoxValues[0] += (-viewBoxValues[2] + oldWidth) * fixedXportion;
	var fixedYportion = scalePoint[1];
	viewBoxValues[1] += (-viewBoxValues[3] + oldHeight) * fixedYportion;

	MZP.SVGRoot[id].setAttribute('viewBox', viewBoxValues.join(' ')); // Convert
	// the
	// viewBoxValues
	// array into a
	// string with a
	// white space
	// character
	// between the
	// given values.

	MZP.calcZoomLevel(id);
};

/*
 * scalePoint= Array which points to the point towards which is to be scaled.
 * I.e. if the image is scaled to to a single pixel, this pixel will be located
 * at scalePoint. scaledPoint is measured as fraction of the SVG container, i.e.
 * [0.5, 0.5] is the center.
 */
MZP.scaledZoom = function(scale, scalePoint, id) {
	"use strict";
	var viewBox = MZP.SVGRoot[id].getAttribute('viewBox'); // Grab the object
	// representing the SVG
	// element's viewBox
	// attribute.
	var viewBoxValues = viewBox.split(' '); // Create an array and insert each
	// individual view box attribute
	// value (assume they're seperated
	// by a single whitespace
	// character).

	viewBoxValues[2] = parseFloat(viewBoxValues[2]); // Convert string
	// "numeric" values to
	// actual numeric
	// values.
	viewBoxValues[3] = parseFloat(viewBoxValues[3]);
	viewBoxValues[0] = parseFloat(viewBoxValues[0]);
	viewBoxValues[1] = parseFloat(viewBoxValues[1]);

	var oldWidth = viewBoxValues[2];
	var oldHeight = viewBoxValues[3];

	viewBoxValues[2] /= scale; // Increase/Decrease the width and height
	// attributes of the viewBox
	// attribute to zoom out.
	viewBoxValues[3] /= scale;

	// G.svg_parent.clientWidth ~= 1600
	var fixedXportion = scalePoint[0];
	viewBoxValues[0] += (-viewBoxValues[2] + oldWidth) * fixedXportion;
	var fixedYportion = scalePoint[1];
	viewBoxValues[1] += (-viewBoxValues[3] + oldHeight) * fixedYportion;

	MZP.SVGRoot[id].setAttribute('viewBox', viewBoxValues.join(' ')); // Convert
	// the
	// viewBoxValues
	// array into a
	// string with a
	// white space
	// character
	// between the
	// given values.

	MZP.calcZoomLevel(id);
};



MZP.calcZoomLevel = function(id) {
	"use strict";
	
	// for some reason the HTML document has to be changed in order to
	// calcZoomLevel() works correctly. This is what G.debug_append() does.
	G.debug_append(" ");
	
//	G.log("********** parentwidth: " + G.svg_parent[id].clientWidth + " ***** UNZOOMED: " + G.svg_element[id].widthUnzoomed)
//	G.log("********** parentheight: " + G.svg_parent[id].clientHeight + " ***** UNZOOMED: " + G.svg_element[id].heightUnzoomed)
	var zoomWidth = G.svg_parent[id].clientWidth / G.svg_element[id].widthUnzoomed;
	var zoomHeight = G.svg_parent[id].clientHeight / G.svg_element[id].heightUnzoomed;
	
	if(zoomWidth < zoomHeight)
		{
		var zoom = zoomWidth;
		var zoom2 = G.svg_element[id].viewBox.baseVal.width / G.svg_element[id].widthUnzoomed;
		}
	else
		{
		var zoom = zoomHeight;
		var zoom2 = G.svg_element[id].viewBox.baseVal.height / G.svg_element[id].heightUnzoomed;
		}
	
	
	
	var zoomLevelA = zoom / zoom2;
	
	MZP.zoomLevel[id] = zoomLevelA;
	
	
//	 G.log('zoom: ' + zoom + ' zoom2: ' + zoom2 + ' zoomLevelA: ' + zoomLevelA);
//	 
//	 G.log("G.svg_element[0].currentScale: " + G.svg_element[0].currentScale);
//	 
//	 G.log("innerWidth: " + window.innerWidth + "  innerHeight: " + window.innerHeight);
//	 
//	 //G.log("outerheight"  + screen.height / window.devicePixelRatio - window.screenTop);
//	 G.log(screen.height + " " + window.devicePixelRatio + " " + window.screenTop);
	 
//	 G.log("shownWidth (in px): " + window.innerWidth * window.devicePixelRatio * MZP.zoomLevel[id])
//	 G.log("shownHeight (in px): " + window.innerHeight * window.devicePixelRatio * MZP.zoomLevel[id])
	 
	 var xValue = ((window.pageXOffset || document.documentElement.scrollLeft)) - G.svg_parent[id].offsetLeft;
	 var yValue = ((window.pageYOffset || document.documentElement.scrollTop)) - G.svg_parent[id].offsetTop;
	 
	 var leftFirstPixel = xValue / zoomLevelA;
	 var topFirstPixel = yValue / zoomLevelA;

	 var zoomLevelB =document.documentElement.clientWidth / window.innerWidth;
//	 G.log("============ zoomlevelB =" +  zoomLevelB);
	 

	 
//	 G.log("window.pageXOffset: " + window.pageXOffset);
//	 G.log("document.documentElement.scrollLeft: " + document.documentElement.scrollLeft);
	 
//	G.log("first visible pixels: left: " + leftFirstPixel + " top: " + topFirstPixel);
	 
	
};

MZP.zoomViaMouseWheel = function(mouseWheelEvent) {
	"use strict";
	var id = G.getSvgId(mouseWheelEvent);

	var rolled = 0;
	if ('wheelDelta' in mouseWheelEvent) {
		rolled = mouseWheelEvent.wheelDelta;
	} else { // Firefox
		// The measurement units of the detail and wheelDelta properties are
		// different.
		rolled = -40 * mouseWheelEvent.detail;
	}

	var cursorX = mouseWheelEvent.clientX / G.svg_parent[id].clientWidth;
	var cursorY = mouseWheelEvent.clientY / G.svg_parent[id].clientHeight;
	if (rolled > 0)
		MZP.zoom('zoomIn', [ cursorX, cursorY ], id);
	else
		MZP.zoom('zoomOut', [ cursorX, cursorY ], id);

	/*
	 * When the mouse is over the webpage, don't let the mouse wheel scroll the
	 * entire webpage:
	 */
	var mouseWheelEvent2;
	if (!mouseWheelEvent)
		mouseWheelEvent2 = window.event;
	else
		mouseWheelEvent2 = mouseWheelEvent;
	// Opera and Chrome:
	mouseWheelEvent2.returnValue = false;
	mouseWheelEvent2.cancelBubble = true;
	// Firefox:
	mouseWheelEvent2.stopPropagation();
	mouseWheelEvent2.preventDefault();
	mouseWheelEvent2.cancelBubble = false;

	return false;
};

MZP.mouseDown = function(e) {
	"use strict";

	var id = G.getSvgId(e);
	MZP.calcZoomLevel(id);

	// ignore right click (button==2)
	if (e.button == 2)
		return;

	MZP.isMouseDown = true;
	MZP.isPanning = false;
	MZP.oldPosition = [ e.clientX, e.clientY ];
};

MZP.setOldPosition = function(x, y) {
	MZP.oldPosition = [ x, y ];
};

MZP.mouseUp = function(e) {
	"use strict";
	MZP.isMouseDown = false;
};

MZP.click = function(e) {
	"use strict";
	// if panning, prevent further processing of this mouse event
	if (MZP.isPanning) {
		e.preventDefault();
		// e.preventBubble();
		e.stopPropagation();
		e.stopImmediatePropagation();
		MZP.isPanning = false;
		return false;
	}
	return true;
};

MZP.mouseMove = function(e) {
	"use strict";
	if (MZP.isMouseDown)
		MZP.move(e.clientX, e.clientY, G.getSvgId(e));
};

MZP.move = function(newXpos, newYpos, svgid) {
	MZP.isPanning = true;
	var deltaX = (MZP.oldPosition[0] - newXpos) / MZP.zoomLevel[svgid];
	// G.log("MZP.oldPosition[0]:" + MZP.oldPosition[0] + " newXpos:" + newXpos
	// + " MZP.zoomLevel[svgid]:"
	// + MZP.zoomLevel[svgid]);
	var deltaY = (MZP.oldPosition[1] - newYpos) / MZP.zoomLevel[svgid];
	if (deltaX != 0 || deltaY != 0) {
		var viewBox = MZP.SVGRoot[svgid].getAttribute('viewBox'); // Grab the
		// object
		// representing the
		// SVG element's
		// viewBox
		// attribute.
		var viewBoxValues = viewBox.split(' '); // Create an array and
		// insert each individual
		// view box attribute value
		// (assume they're seperated
		// by a single whitespace
		// character).

		viewBoxValues[0] = parseFloat(viewBoxValues[0]); // Convert
		// string
		// "numeric"
		// values to
		// actual
		// numeric
		// values.
		viewBoxValues[1] = parseFloat(viewBoxValues[1]);

		viewBoxValues[0] += deltaX;
		viewBoxValues[1] += deltaY;

		MZP.SVGRoot[svgid].setAttribute('viewBox', viewBoxValues.join(' ')); // Convert
		// the
		// viewBoxValues
		// array
		// into
		// a
		// string
		// with
		// a
		// white
		// space
		// character
		// between
		// the
		// given
		// values.

		MZP.oldPosition = [ newXpos, newYpos ];
	}
};

MZP.set = function(newXpos, newYpos, svgid) {
	var viewBox = MZP.SVGRoot[svgid].getAttribute('viewBox');
	var viewBoxValues = viewBox.split(' ');

	var posX = (newXpos) - viewBoxValues[2] / 2;
	var posY = (newYpos) - viewBoxValues[3] / 2;

	viewBoxValues[0] = posX;
	viewBoxValues[1] = posY;
	
	Interface.levelset(svgid);
	
	MZP.SVGRoot[svgid].setAttribute('viewBox', viewBoxValues.join(' '));

	MZP.oldPosition = [ newXpos, newYpos ];
	MZP.calcZoomLevel(svgid);
};

MZP.show_position = function(xPos, yPos, svgid) {
	
	MZP.calcZoomLevel(svgid);
	
	var viewBox = MZP.SVGRoot[svgid].getAttribute('viewBox');
	var viewBoxValues = viewBox.split(' ');
	
	
	//G.log("window.innerHeight: " + window.innerHeight);
	
	var bb = MZP.SVGRoot[svgid].getBBox();
	var box = bb.x + " " + bb.y + " " + bb.width+ " " + bb.height;
	//G.log(".getBBox():"+ box);
	
	//if svgapp is defined this is android webview
	if (typeof svgapp === 'undefined') 
		var browser = true; //as opposed to android webview
	else
		var browser = false;
	
	if(browser)
	{
		var xValue= viewBoxValues[0];
		var yValue= viewBoxValues[1];
		var widthValue= viewBoxValues[2];
		var heightValue= viewBoxValues[3];
	}
	else
	{
//		G.log("shownWidth (in px): " + window.innerWidth * window.devicePixelRatio * MZP.zoomLevel[id])
//		 G.log("shownHeight (in px): " + window.innerHeight * window.devicePixelRatio * MZP.zoomLevel[id])
		 
		 var xValue2 = ((window.pageXOffset || document.documentElement.scrollLeft)) - G.svg_parent[svgid].offsetLeft;
		 var yValue2 = ((window.pageYOffset || document.documentElement.scrollTop)) - G.svg_parent[svgid].offsetTop;
		 
		 var leftFirstPixel = xValue2 / MZP.zoomLevel[svgid];
		 var topFirstPixel = yValue2 / MZP.zoomLevel[svgid];
		 
		 
		var xValue = leftFirstPixel;
		var yValue = topFirstPixel;
		var widthValue= window.innerWidth * window.devicePixelRatio * MZP.zoomLevel[svgid];
		var heightValue= window.innerHeight * window.devicePixelRatio * MZP.zoomLevel[svgid];
		
//		G.log('viewBox_left window.pageXOffset: ' + window.pageXOffset);
//		G.log('viewBox_left document.documentElement.scrollLeft: ' + document.documentElement.scrollLeft);
//		G.log('viewBox_left G.svg_parent[svgid].offsetLeft: ' + G.svg_parent[svgid].offsetLeft);
//		
//		G.log('viewBox_right document.documentElement.scrollWidth: ' + document.documentElement.scrollWidth);
//		G.log('viewBox_right G.svg_parent[svgid].offsetWidth: ' + G.svg_parent[svgid].offsetWidth);
//		
//		G.log('viewBox widthValue: ' + widthValue);
//		G.log('viewBox window.devicePixelRatio: ' +  window.devicePixelRatio);
//		G.log('viewBox MZP.zoomLevel[svgid]: ' + MZP.zoomLevel[svgid]);
	}
	
	G.log('viewBox vorher: ' +[xValue, yValue, widthValue, heightValue].join(' '));
	
	
	var visibleLeft = parseInt(xValue);
	var visibleRight = parseInt(xValue) + parseInt(widthValue);
	var visibleTop = parseInt(yValue);
	var visibleBottom = parseInt(yValue) + parseInt(heightValue);
	
	var bothInside = true;
	if(xPos > visibleLeft && xPos < visibleRight)
	{
		G.log("xPos inside: " + xPos + ">"+ visibleLeft +"&&"+ xPos +"<" +visibleRight);
	}
	else
	{
		G.log("xPos outside: NOT: " + xPos + ">"+ visibleLeft +"&&"+ xPos +"<" +visibleRight);
		bothInside = false;
	}
	if(yPos > visibleTop && yPos < visibleBottom)
	{
		G.log("yPos inside: " + yPos + ">"+ visibleTop +"&&"+ yPos +"<" +visibleBottom);
	}	
	else
	{
		G.log("yPos outside: NOT: " + yPos + ">"+ visibleTop +"&&"+ yPos +"<" +visibleBottom);
		bothInside = false;
	}
	
	
	
	
	MZP.oldPosition = [ xValue, yValue ];
	
	
	//if 3/4 of available width contains xPos, set left to 0, else center
	if(widthValue * 0.75  > xPos)
		xValue = 0;
	else
		xValue = (xPos) - (widthValue / 2 );
	//if 3/4 of available height contains xPos, set left to 0, else center
	if(heightValue * 0.75 > yPos)
		yValue = 0;
	else
		yValue = (yPos) - (heightValue / 2);
	
	
	if(bothInside)
		return;
	
	//for browsers:
	if(browser)
	{
		MZP.SVGRoot[svgid].setAttribute('viewBox', [xValue, yValue, widthValue, heightValue].join(' '));
	}
	else
	{
		//for android:
		window.scrollTo(xValue*MZP.zoomLevel[svgid], yValue*MZP.zoomLevel[svgid]);
		G.log('scrollTo: ' + xValue + " " + yValue);
	}
	
	
	G.log('viewBox nacher: ' +[xValue, yValue, widthValue, heightValue].join(' '));
	
}

/**
 * add event listeners and initialize objects when SVG object is loaded
 */
MZP.init = function(id) {
	"use strict";
	/* Add event listeners: */
	// window.addEventListener('keydown', MZP.processKeyPress, true); // let the
	// keydown
	// event
	// bubble.
	// Internet Explorer, Opera, Google Chrome and Safari
	// window.addEventListener('mousewheel', MZP.zoomViaMouseWheel, false); //
	// in
	// case
	// the user
	// rotates
	// the
	// mouse
	// wheel
	// outside
	// of
	// the
	// object
	// element's
	// "window".
	// Firefox //src: http://help.dottoro.com/ljrxdxdw.php
	// window.addEventListener('DOMMouseScroll', MZP.zoomViaMouseWheel, false);
	// get the SVG element when loaded
	MZP.SVGRoot[id] = G.svg_element[id];

	MZP.SVGRoot[id].addEventListener('keydown', MZP.processKeyPress, true);
	// This
	// is
	// required
	// in case
	// the user
	// presses
	// an arrow
	// key
	// inside of
	// the
	// object
	// element's
	// "window".
	// Internet Explorer, Opera, Google Chrome and Safari
	// G.svg_parent[id].addEventListener('mousewheel', MZP.zoomViaMouseWheel,
	// false);
	MZP.SVGRoot[id].addEventListener('mousewheel', MZP.zoomViaMouseWheel, false);

	// This
	// is
	// required
	// in
	// case
	// the
	// user
	// rotates
	// the
	// mouse
	// wheel
	// inside
	// of
	// the
	// object
	// element's
	// "window".
	// Firefox //src: http://help.dottoro.com/ljrxdxdw.php
	// G.svg_parent[id].addEventListener('DOMMouseScroll',
	// MZP.zoomViaMouseWheel,
	// false);
	MZP.SVGRoot[id].addEventListener('DOMMouseScroll', MZP.zoomViaMouseWheel, false);

	MZP.SVGRoot[id].addEventListener('mousedown', MZP.mouseDown);
	MZP.SVGRoot[id].addEventListener('mouseup', MZP.mouseUp);
	MZP.SVGRoot[id].addEventListener('mousemove', MZP.mouseMove);
	MZP.SVGRoot[id].addEventListener('click', MZP.click);

	// compensate for the view box in the original svg file
	var viewBox = MZP.SVGRoot[id].getAttribute('viewBox'); // Grab the object
	// representing the SVG
	// element's viewBox
	// attribute.
	if (viewBox == null) {
		MZP.SVGRoot[id].setAttribute('preserveAspectRatio', 'xMinYMin meet');
		MZP.backup_width[id] = MZP.SVGRoot[id].getAttribute('width');
		MZP.backup_height[id] = MZP.SVGRoot[id].getAttribute('height');
		MZP.SVGRoot[id].setAttribute('viewBox', '0 0 ' + MZP.SVGRoot[id].getAttribute('width') + ' '
				+ MZP.SVGRoot[id].getAttribute('height'));

		viewBox = MZP.SVGRoot[id].getAttribute('viewBox'); // Grab the object
		// representing the SVG
		// element's viewBox
		// attribute.

		if (navigator.userAgent.indexOf("Opera") != -1) // Opera does not
		// understand 100% for
		// <embed>
		{
			G.svg_parent[id].height = "700px";
		} else {
			G.svg_parent[id].height = "100%";
			G.svg_parent[id].width = "100%";
		}

		/*
		 * what is happening here ??? xZoom =
		 * G.svg_parent.getClientRects()["0"].width /
		 * MZP.SVGRoot.getAttribute('width'); yZoom =
		 * G.svg_parent.getClientRects()["0"].height /
		 * MZP.SVGRoot.getAttribute('height');
		 */
		
		G.svg_element[id].heightUnzoomed = G.svg_element[id].getAttribute("height");
		G.svg_element[id].widthUnzoomed = G.svg_element[id].getAttribute("width");
		G.svg_element[id].setAttribute("width", "100%");
		G.svg_element[id].setAttribute("height", "100%");

	} else {
		// in case viewBox is defined within SVG:
		G.svg_element[id].widthUnzoomed = G.svg_element[id].getBoundingClientRect().width;
		G.svg_element[id].heightUnzoomed = G.svg_element[id].getBoundingClientRect().height;
	}
	
		
	var viewBoxValues = viewBox.split(' '); // Create an array and insert each
	// individual view box attribute
	// value (assume they're seperated
	// by a single whitespace
	// character).

	viewBoxValues[0] = parseFloat(viewBoxValues[0]); // Convert string
	// "numeric" values to
	// actual numeric
	// values.
	viewBoxValues[1] = parseFloat(viewBoxValues[1]);

	MZP.calcZoomLevel(id);

	MZP.backup_zoomLevel[id] = MZP.zoomLevel[id];

	MZP.isInit = true;
};

/*
 * Takes a screen coordinates (relative to the SVG object) and converts it to a
 * SVG coordinate.
 */
MZP.translateX = function(evt) {
	"use strict";
	var x = evt.clientX;
	if (MZP.isInit == false)
		return x;

	var id = G.getSvgId(evt);
	return ((x / MZP.zoomLevel[id]) + G.svg_element[id].viewBox.baseVal.x);
};

/*
 * Takes a screen coordinates (relative to the SVG object) and converts it to a
 * SVG coordinate.
 */
MZP.translateY = function(evt) {
	"use strict";
	var y = evt.clientY;
	if (MZP.isInit == false)
		return y;

	var id = G.getSvgId(evt);
	return ((y / MZP.zoomLevel[id]) + G.svg_element[id].viewBox.baseVal.y);
};

MZP.rescale = function(id) {
	"use strict";
	// G.log(MZP.SVGRoot[id].getAttribute('viewBox'));
	// G.log('0 0 ' + MZP.backup_width[id] + ' ' + MZP.backup_height[id]);
	MZP.SVGRoot[id].setAttribute('viewBox', '0 0 ' + MZP.backup_width[id] + ' ' + MZP.backup_height[id]);
	MZP.calcZoomLevel(id);
};