"use strict";


// Global is a first-class function (like a static class) that holds all global
// variables.
function G() {
	"use strict";
	// var privateVariable = 0;
	// this.publicVariable = 1;
}
G.global = 'This is a global variable accessible from everywhere via G.global';

G.getLevelCount = function() {
  return 3;
}

G.getMapPath = function(level) {
  if(level == 0)
    return G.getDataDir() + "minimal0.svg";
  else if(level == 1)
    return G.getDataDir() + "minimal1.svg";
  else if(level == 2)
    return G.getDataDir() + "minimal2.svg";
  else
    return null
}

G.getXmlFilename = function() {
  return "minimal-data.xml";
}

G.getXmlPath = function() {
  return G.getDataDir() + G.getXmlFilename();
}

//internally used only
G.getDataDir = function() {
  return "data/";
}

/*
Appends for each map defined by G.getLevelCount() and G.getMapPath() an embedded element to div#map_container
*/
G.loadMaps = function(createScaleButton) {
  for (var i=0;i<G.getLevelCount();i++)
  {
    var newmap = document.createElement("embed");
    newmap.setAttribute("src",G.getMapPath(i));
    newmap.setAttribute("id","map"+i);
    newmap.setAttribute("type","image/svg+xml");
    newmap.setAttribute("class","svg_container");
    newmap.style.width = "45%";
    newmap.style.height= "auto";
    
    
    document.getElementById("map_container").appendChild(newmap);
    
    if(createScaleButton)
    {
      var scalebutton = document.createElement("button");
      scalebutton.setAttribute("id","map"+i+"_rescale");
      scalebutton.setAttribute("onclick","MZP.rescale("+i+");");
      var content = document.createTextNode("Rescale");
      scalebutton.appendChild(content);
      document.getElementById("map_container").appendChild(scalebutton);
    }
  }
}

/*
Appends for each map defined by G.getLevelCount() and G.getMapPath() an input radio element to div#svgselection for selecting the according SVG
*/
G.loadMapSelectors = function() {
  for (var i=0;i<G.getLevelCount();i++)
  {
    var selector = document.createElement("input");
    selector.setAttribute("type","radio");
    selector.setAttribute("src",G.getMapPath(i));
    selector.setAttribute("id","select_map"+i);
    selector.setAttribute("name","svgid");
    selector.setAttribute("value",i);
    selector.setAttribute("onchange","client_selectsvg(" + i + ")");
    if(i==0)
      selector.setAttribute("checked","checked");
      
    document.getElementById("svgselection").appendChild(selector);
    
    var content = document.createTextNode("Level " + i);
    selector.parentNode.appendChild(content);
    var br = document.createElement("br");
    selector.parentNode.appendChild(br);
    
   }
}

G.init = function(func) {
	"use strict";
	// G.log('init start');
	document.getElementById('noscript').style.display = 'none';

	if (null == (window.BlobBuilder || window.WebKitBlobBuilder
			|| window.MozBlobBuilder || window.MSBlobBuilder || Blob)) {
		var warning = "Warning! This browser does not support BlobBuilder. You will NOT be able to export and save your changes!";
		document.getElementById('noscript').style.display = 'block';
		document.getElementById('noscript').innerHTML = warning;
		document.getElementById('noscript').style.color = "red";
		// alert(warning);
	}

	G.svg_init = new Array();
	G.svg_parent = new Array();
	G.svg_document = new Array();
	G.svg_element = new Array();
	G.svg_unit_tuhh = new Array();
	G.svg_unit_vertex = new Array();
	G.svg_unit_edge = new Array();
	G.svg_unit_stepmarker = new Array();
	G.svg_unit_borderpoint = new Array();
	G.svg_unit_borderline = new Array();
	G.svg_unit_dijkstra = new Array();
	G.svg_unit_affiliation_area = new Array();
	G.svg_unit_gpsmarker = new Array();

   var embed = document.getElementsByTagName('embed');

	for ( var i = 0; i < embed.length; i++) {
		G.install_init_hook(embed[i], i, embed.length, func);
	}

   
};

// Installiert Event Listener, der init_svg() aufruft, sobald SVG element
// geladen ist.
G.install_init_hook = function(element, id, count, func) {
	G.svg_init[id] = false;
  element
			.addEventListener(
					'load',
					function(evt) {
						switch (G.svg_init[id]) {
						case false:
							G.init_svg(element, id);

							if (func != null && func != undefined) {
								// call only func, if everything is init'ed
								for ( var i = 0; i < count; i++) {
									if (G.svg_init[i] != true)
										return;
								}
								func();
							}
							break;
						case true:
							G.svg_parent[id] = element;
							G.svg_document[id] = G.svg_parent[id]
									.getSVGDocument();
							G.svg_element[id] = G.svg_document[id]
									.getElementsByTagName('svg')[0];
							G.svg_element[id].appendChild(G.svg_unit_tuhh[id]);
							MZP.init(id);

							// renew vertex events, so that chrome gets them
							for ( var i = 0, v = Vertex_container.getAll()[i]; i < Vertex_container
									.getAll().length; v = Vertex_container
									.getAll()[++i]) {
								if (v.getSvgid() == id)
									v.refreshChrome();
							}
							// renew positionpoint animation also, so that
							// chrome starts
							// it
							if (currPositionPoint != null
									&& currPositionPoint.getSvgid() == id) {
								currPositionPoint.refreshChrome();
							}
							break;
						default:
							console.log('invalid entry ' + G.svg_init[id]
									+ ' in G.svg_init[' + id + ']');
							break;
						}
					});
};

G.init_svg = function(element, id) {
	"use strict";
//	 G.log('init_svg ' + id);

	// required for SVG embedded using <embed>
	// e.g. <embed id="map0" src="office_simple.svg" type="image/svg+xml"
	// onload="G.init();">
	G.svg_parent[id] = element;
	G.svg_document[id] = G.svg_parent[id].getSVGDocument();
	if (G.svg_document[id] == null) {
		G.log("G.init_svg() failed. SVG not loaded yet.1");
		return;
	}
	G.svg_element[id] = G.svg_document[id].getElementsByTagName('svg')[0];
	if (G.svg_element[id] == null) {
		G.log("G.init_svg() failed. SVG not loaded yet.2");
		return;
	}

	// initialise g-elements
	var unit_tuhh = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	unit_tuhh.setAttribute('id', 'unit_tuhh');
	G.svg_element[id].appendChild(unit_tuhh);
	G.svg_unit_tuhh[id] = G.svg_element[id].getElementById('unit_tuhh');

	var unit_vertex = document.createElementNS('http://www.w3.org/2000/svg',
			'g');
	unit_vertex.setAttribute('id', 'unit_vertex');
	G.svg_unit_tuhh[id].appendChild(unit_vertex);
	G.svg_unit_vertex[id] = G.svg_element[id].getElementById('unit_vertex');

	var unit_edge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	unit_edge.setAttribute('id', 'unit_edge');
	G.svg_unit_tuhh[id].appendChild(unit_edge);
	G.svg_unit_edge[id] = G.svg_element[id].getElementById('unit_edge');

	var unit_stepmarker = document.createElementNS(
			'http://www.w3.org/2000/svg', 'g');
	unit_stepmarker.setAttribute('id', 'unit_stepmarker');
	G.svg_unit_tuhh[id].appendChild(unit_stepmarker);
	G.svg_unit_stepmarker[id] = G.svg_element[id]
			.getElementById('unit_stepmarker');

	var unit_borderpoint = document.createElementNS(
			'http://www.w3.org/2000/svg', 'g');
	unit_borderpoint.setAttribute('id', 'unit_borderpoint');
	G.svg_unit_tuhh[id].appendChild(unit_borderpoint);
	G.svg_unit_borderpoint[id] = G.svg_element[id]
			.getElementById('unit_borderpoint');

	var unit_borderline = document.createElementNS(
			'http://www.w3.org/2000/svg', 'g');
	unit_borderline.setAttribute('id', 'unit_borderline');
	G.svg_unit_tuhh[id].appendChild(unit_borderline);
	G.svg_unit_borderline[id] = G.svg_element[id]
			.getElementById('unit_borderline');

	var unit_dijkstra = document.createElementNS('http://www.w3.org/2000/svg',
			'g');
	unit_dijkstra.setAttribute('id', 'unit_dijkstra');
	G.svg_unit_tuhh[id].appendChild(unit_dijkstra);
	G.svg_unit_dijkstra[id] = G.svg_element[id].getElementById('unit_dijkstra');

	var unit_gpsmarker = document.createElementNS('http://www.w3.org/2000/svg',
			'g');
	unit_gpsmarker.setAttribute('id', 'unit_gpsmarker');
	G.svg_unit_tuhh[id].appendChild(unit_gpsmarker);
	G.svg_unit_gpsmarker[id] = G.svg_element[id]
			.getElementById('unit_gpsmarker');

	// add title
	var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
	title.setAttribute('id', 'identifier');
	title.setAttribute('value', id);
	G.svg_unit_tuhh[id].appendChild(title);

	// add edge marker
	// <defs>
	// <marker id='Triangle'
	// viewBox='0 0 10 10' refX='0' refY='5'
	// markerUnits='strokeWidth'
	// markerWidth='4' markerHeight='3'
	// orient='auto'>
	// <path d='M 0 0 L 10 5 L 0 10 z' />
	// </marker>
	// </defs>

	// 1. start marker
	var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
	var marker_1 = document.createElementNS('http://www.w3.org/2000/svg',
			'marker');
	marker_1.setAttribute('id', 'Triangle-start');
	marker_1.setAttribute('viewBox', '0 0 8 8');
	marker_1.setAttribute('refX', '4');
	marker_1.setAttribute('refY', '4');
	marker_1.setAttribute('markerUnits', 'strokeWidth');
	// marker_1.setAttribute('markerUnits', 'userSpaceOnUse');
	marker_1.setAttribute('markerWidth', '4');
	marker_1.setAttribute('markerHeight', '4');
	marker_1.setAttribute('orient', 'auto');
	marker_1.setAttribute('fill', G.routingEdgeArrowColor);
	var path_1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path_1.setAttribute('d', 'M 0 4 L 8 8 L 8 0 z');
	marker_1.appendChild(path_1);
	defs.appendChild(marker_1);

	// 2. end marker
	var marker_2 = document.createElementNS('http://www.w3.org/2000/svg',
			'marker');
	marker_2.setAttribute('id', 'Triangle-end');
	marker_2.setAttribute('viewBox', '0 0 8 8');
	marker_2.setAttribute('refX', '4');
	marker_2.setAttribute('refY', '4');
	marker_2.setAttribute('markerUnits', 'strokeWidth');
	// marker_2.setAttribute('markerUnits', 'userSpaceOnUse');
	marker_2.setAttribute('markerWidth', '4');
	marker_2.setAttribute('markerHeight', '4');
	marker_2.setAttribute('orient', 'auto');
	marker_2.setAttribute('fill', G.routingEdgeArrowColor);
	var path_2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path_2.setAttribute('d', 'M 0 0 L 8 4 L 0 8 z');
	marker_2.appendChild(path_2);
	defs.appendChild(marker_2);

	// 3. switch marker
	var marker_3 = document.createElementNS('http://www.w3.org/2000/svg',
			'marker');
	marker_3.setAttribute('id', 'Triangle-switch');
	marker_3.setAttribute('viewBox', '0 0 8 8');
	marker_3.setAttribute('refX', '4');
	marker_3.setAttribute('refY', '4');
	marker_3.setAttribute('markerUnits', 'strokeWidth');
	// marker_3.setAttribute('markerUnits', 'userSpaceOnUse');
	marker_3.setAttribute('markerWidth', '4');
	marker_3.setAttribute('markerHeight', '4');
	marker_3.setAttribute('orient', 'auto');
	var path_3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path_3.setAttribute('d', 'M 0 4 L 4 0 L 8 4 L 4 8 z');
	path_3.setAttribute('fill', 'rgb(0,200,0)');
	path_3.setAttribute('style', 'stroke:rgb(0,0,0)');
	path_3.setAttribute('stroke-width', '0.9');
	marker_3.appendChild(path_3);
	defs.appendChild(marker_3);

	// append markers
	G.svg_unit_tuhh[id].appendChild(defs);

	MZP.init(id);

	G.svg_init[id] = true;

	// if (typeof (svgapp) != "undefined") {
	// // set size of svg images
	//
	// var ViewX = "0";
	// var ViewY = "0";
	// if (self.innerHeight) {
	// ViewX = self.innerWidth;
	// ViewY = self.innerHeight;
	// } else if (document.documentElement
	// && document.documentElement.clientHeight) {
	// ViewX = document.documentElement.clientWidth;
	// ViewY = document.documentElement.clientHeight;
	// } else if (document.body) {
	// ViewX = document.body.clientWidth;
	// ViewY = document.body.clientHeight;
	// } else {
	// alert('Can not estimate screen resolution!');
	// ViewX = null;
	// ViewY = null;
	// }
	//			
	//		
	// if (ViewX != null && ViewY != null) {
	// G.svg_parent[id].style.width = ViewX*97/100 + "px";
	// G.svg_parent[id].style.height = ViewY*97/100 + "px";
	// }
	// }
};

G.getSvgId = function(event) {
	"use strict";
	var svg = null;

	switch (event.target.tagName) {
	case "svg":
		svg = event.target;
		break;
	case "EMBED":
		svg = event.target.getSVGDocument().getElementsByTagName('svg')[0];
		break;

	default:
		svg = event.target.ownerSVGElement;
		break;
	}

	return svg.getElementById('identifier').getAttribute('value');
};

G.debug = function(s) {
	"use strict";
	if (document.getElementById('debug') != null)
		document.getElementById('debug').innerHTML = s;
};

G.debug_append = function(s) {
	"use strict";
	if (document.getElementById('debug') != null)
		document.getElementById('debug').innerHTML += s;
};

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck
			&& getType.toString.call(functionToCheck) === '[object Function]';
}

G.log = function(s) {
	"use strict";

	if (console && isFunction(console.log))
		console.log(s);

	if (typeof (debug) != "undefined" && debug != null && debug != undefined
			&& isFunction(debug))
		debug(s);

	/*
	 * if (document.getElementById('debug') != null)
	 * document.getElementById('debug').innerHTML = s;
	 */
};

// defined by menu.js
G.menu_current = null;

G.svg_init = null;
G.svg_element = null;
G.svg_parent = null;
G.svg_document = null;
G.svg_unit_tuhh = null;
G.svg_unit_vertex = null;
G.svg_unit_edge = null;
G.svg_unit_stepmarker = null;
G.svg_unit_borderpoint = null;
G.svg_unit_borderline = null;
G.svg_unit_dijkstra = null;
G.svg_unit_gpsmarker = null;

// scaling variables
// edit only this one if vertexes and edges are to small or big for the svg
// image
G.scale = 2;
// do not edit the following ones
G.vertex_radius = G.scale * 2;
G.vertex_hereami_radius = G.scale * 4;
G.vertex_edging = G.scale * 0.5;
G.vertex_minDistance = G.scale * 5;
G.edge_lineWidth = G.scale * 1;
G.edge_vertexDistance = G.scale * 4.1;
G.edge_strokeColor = G.scale * 1.25;
G.edge_strokeNoColor = G.scale * 0.5;
G.edge_switchWeight = G.scale * 50;
G.stepmarker_length = G.scale * 3.5;
G.stepmarker_stroke = G.scale * 0.5;
G.border_radius = G.scale;
G.border_edging = G.scale * 0.5;
G.border_lineWidth = G.scale * 0.5;
G.border_lineDiff = G.scale * 1.3;
G.border_lineStyle = 'stroke:rgb(255,00,00)';
G.border_lineStyleActive = 'stroke:rgb(153,153,153)';

G.routingEdgeStyle = 'stroke:rgb(255,0,0)';
G.routingEdgeArrowColor = 'black';

G.positionpoint_radius_min = G.scale * 1;
G.positionpoint_radius_max = G.scale * 4;
G.positionpoint_duration = '2.5s';
G.positionpoint_radius_edging = G.scale * 0.5;
G.destinationmarker_dim = G.scale * 2;

// arrays and counter
var Vertex_container = new IDSet();
var Vertex_clickedID = null;
var Vertex_current = null;
var Vertex_hoover = null;
var Vertex_move_enabled = false;

var Edge_clickedID = null;
var Edge_current = null;
var Edge_firstvertex = null;
var Edge_container = new IDSet();

var Stepmarker_clickedID = null;
var Stepmarker_current = null;
var Stepmarker_container = new IDSet();

var Stepmarker_backup1_x = null;
var Stepmarker_backup1_y = null;
var Stepmarker_backup2_x = null;
var Stepmarker_backup2_y = null;

var Affiliation_currentPolygon = null;
var Affiliation_borderPointClickedID = null;

var Affiliation_borderpoint_container = new IDSet();
var Affiliation_borderline_container = new IDSet();

var currPositionPoint = null;
var currLocation = null;

var DijkstraArrows = new Array();
var Routing_destination = null;
var Routing_disabledAdapted = null;

var Client_event_clickRouting = false;

var Category_container = new IDSet();

var Gpsmarker_container = new IDSet();
var Gpsmarker_clickedID = null;
var Gpsmarker_current = null;
var Gpsmarker_move_enabled = false;

var LevelAltitude_min = new Array();
var LevelAltitude_max = new Array();