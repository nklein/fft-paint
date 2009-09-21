function __clearOverlays() {
    var overlay_m = document.getElementById( 'canvas_m_o' );
    var overlay_p = document.getElementById( 'canvas_p_o' );
    if ( !overlay_m || !overlay_p ) {
	return false;
    }

    var context_m = overlay_m.getContext( '2d' );
    var context_p = overlay_p.getContext( '2d' );
    if ( !context_m || !context_p ) {
	return false;
    }

    context_m.clearRect( 0, 0, overlay_m.width, overlay_m.height );
    context_p.clearRect( 0, 0, overlay_m.width, overlay_m.height );

    return true;
}

//
// select a new control
//
function selectTool( _id ) {
    var success = true;

    for ( var ii=0; ii < tools.length; ++ii ) {
	var ctrl = document.getElementById( tools[ii] );
	var button = document.getElementById( tools[ii] + '_button' );
	success = success && ( ctrl && button );

	if ( ctrl && button ) {
	    if ( tools[ii] == _id ) {
		ctrl.style.visibility = 'visible';
		button.src = 'true.png';
		__clearOverlays();
		if ( curMode && curMode.leave ) {
		    curMode.leave();
		}
		curMode = modes[ _id ];
		if ( curMode && curMode.init ) {
		    curMode.init();
		}
	    }
	    else {
		ctrl.style.visibility = 'hidden';
		button.src = 'false.png';
	    }
	}
    }

    return success;
}

//
// handle mouse actions in the canvas if the current mode desires them
//
function mouseout( _event ) {
    var success = curMode && curMode.handleMouseOut
	                  && curMode.handleMouseOut(_event);
    return true;
}

function mousedown( _event ) {
    mouseDown = (_event.which == 1);
    var success = curMode && curMode.handleMouseDown
	                  && curMode.handleMouseDown(_event);
    return true;
}

function mouseup( _event ) {
    mouseDown = false;
    var success = curMode && curMode.handleMouseUp
	                  && curMode.handleMouseUp(_event);
    return true;
}

function mousemove( _event ) {
    var success = curMode && ( ( mouseDown )
			        ?  ( curMode.handleMouseDrag
				     && curMode.handleMouseDrag(_event) )
			       :  ( curMode.handleMouseTrack
				    && curMode.handleMouseTrack(_event) )
			     );
    return true;
}

//
// overall initialization
//
function initGUI() {
    return selectTool( tools[0] )
	&& __prepareImage( 'original_image', 'canvas_m', 'canvas_p' )
	&& setPaintBrush( document.getElementById('default_brush') )
	&& updatePaintColor( paint_hsv_r, paint_color_r, 'real_color' )
	&& updatePaintColor( paint_hsv_i, paint_color_i, 'imag_color' )
	&& reloadTransforms()
	&& initGradientMode()
	&& initBlurMode()
	;
}
