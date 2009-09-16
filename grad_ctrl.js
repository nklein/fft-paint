
var GRAD_INSIDE = 1;
var GRAD_OUTSIDE = 2;
var GRAD_ANNULUS = 3;

var gradSelectMode = false;
var gradCircles = false;
var gradientPaintMode = false;

var gradInnerHSV_r = false;
var gradInnerHSV_i = false;
var gradInnerColor_r = false;
var gradInnerColor_i = false;
var gradInnerOpacity = false;

var gradOuterHSV_r = false;
var gradOuterHSV_i = false;
var gradOuterColor_r = false;
var gradOuterColor_i = false;
var gradOuterOpacity = false;

function __l0 ( _xx, _yy ) {
    return Math.max( Math.abs( _xx ), Math.abs( _yy ) );
}
function __drawL0( _context, _rr ) {
    _context.beginPath();
    _context.moveTo(  _rr,  _rr );
    _context.lineTo( -_rr,  _rr );
    _context.lineTo( -_rr, -_rr );
    _context.lineTo(  _rr, -_rr );
    _context.closePath();
    _context.stroke();
    return true;
}

function __l1 ( _xx, _yy ) {
    return Math.abs( _xx ) + Math.abs( _yy );
}
function __drawL1( _context, _rr ) {
    _context.beginPath();
    _context.moveTo( _rr, 0 );
    _context.lineTo( 0, _rr );
    _context.lineTo( -_rr, 0 );
    _context.lineTo( 0, -_rr );
    _context.closePath();
    _context.stroke();
    return true;
}

function __l2 ( _xx, _yy ) {
    return Math.sqrt( _xx*_xx + _yy*_yy );
}
function __drawL2( _context, _rr ) {
    _context.beginPath();
    _context.arc( 0, 0, _rr, 0, Math.PI * 2, false );
    _context.closePath();
    _context.stroke();
    return true;
}

var gradRadiusFunc = false;
var gradDrawFunc = false;

function gradientClearCircles() {
    gradCircles = new Array();
}

function gradSetSelectMode( _this, _mode ) {
    if ( _mode == GRAD_INSIDE
	 || _mode == GRAD_OUTSIDE
	 || _mode == GRAD_ANNULUS ) {
	gradSelectMode = _mode;
	if ( _this ) {
	    __highlightCurrent( _this );
	}
	return true;
    }
    else {
	return false;
    }
}

function gradSetMetric( _this, _metric ) {
    if ( _metric == 0 ) {
	gradRadiusFunc = __l0;
	gradDrawFunc = __drawL0;
    }
    else if ( _metric == 1 ) {
	gradRadiusFunc = __l1;
	gradDrawFunc = __drawL1;
    }
    else if ( _metric == 2 ) {
	gradRadiusFunc = __l2;
	gradDrawFunc = __drawL2;
    }
    else {
	return false;
    }

    if ( _this ) {
	__highlightCurrent( _this );
    }
	
    __drawAllCircles();
    return true;
}

function initGradientMode() {
    gradSetSelectMode( false, GRAD_INSIDE );
    gradSetMetric( false, 2 );

    gradientClearCircles();

    gradInnerHSV_r = new Array( 0.0, 0.0, 1.0 );
    gradInnerHSV_i = new Array( 0.0, 0.0, 0.0 );
    gradInnerColor_r = new Array();
    gradInnerColor_i = new Array();
    gradInnerOpacity = 1.0;

    gradOuterHSV_r = new Array( 0.0, 0.0, 1.0 );
    gradOuterHSV_i = new Array( 0.0, 0.0, 0.0 );
    gradOuterColor_r = new Array();
    gradOuterColor_i = new Array();
    gradOuterOpacity = 1.0;

    updatePaintColor( gradInnerHSV_r, gradInnerColor_r, 'in_real_color' );
    updatePaintColor( gradInnerHSV_i, gradInnerColor_i, 'in_imag_color' );
    updatePaintColor( gradOuterHSV_r, gradOuterColor_r, 'out_real_color' );
    updatePaintColor( gradOuterHSV_i, gradOuterColor_i, 'out_imag_color' );

    gradientPaintMode = __normalPaintMode;
}

function __drawAllCircles() {
    window.status = 'DrawAllCircles';
    var canvas_m = document.getElementById( 'canvas_m_o' );
    var canvas_p = document.getElementById( 'canvas_p_o' );

    if ( !canvas_m || !canvas_p ) {
	return false;
    }

    var context_m = canvas_m.getContext( '2d' );
    var context_p = canvas_p.getContext( '2d' );

    if ( !context_m || !context_p ) {
	return false;
    }

    context_m.clearRect( 0, 0, canvas_m.width, canvas_m.height );
    context_p.clearRect( 0, 0, canvas_p.width, canvas_p.height );

    context_m.save();
    context_p.save();

    context_m.translate( canvas_m.width/2, canvas_p.height/2 );
    context_p.translate( canvas_p.width/2, canvas_p.height/2 );

    context_m.strokeStyle = '#fff';
    context_p.strokeStyle = '#fff';

    context_m.lineWidth = 2;
    context_p.lineWidth = 2;

    var ret = true;

    for ( var ii=0; ii < gradCircles.length; ++ii ) {
	ret = ret && gradDrawFunc( context_m, gradCircles[ ii ] );
	ret = ret && gradDrawFunc( context_p, gradCircles[ ii ] );
    }

    context_p.restore();
    context_m.restore();

    return true;
}

function gradSelectHueSat( _ctrl, _real, _inside, _event ) {
    var rect = __getBoundingClientRect( _ctrl );
    var xx = Math.round(_event.clientX - rect.left - _ctrl.width/2);
    var yy = Math.round(_event.clientY - rect.top  - _ctrl.height/2);

    var hh = Math.round( 180.0 * Math.atan2( yy, xx ) / pi );
    var rr = Math.sqrt( xx*xx + yy*yy ) / (_ctrl.width/2);
    var ss = Math.min( rr, 1.0 );

    var hsv =	_inside
	? ( _real ? gradInnerHSV_r : gradInnerHSV_i )
	: ( _real ? gradOuterHSV_r : gradOuterHSV_i )
	;
    var rgb =	_inside
	? ( _real ? gradInnerColor_r : gradInnerColor_i )
	: ( _real ? gradOuterColor_r : gradOuterColor_i )
	;
    var patch = _inside
	? ( _real ? 'in_real_color'  : 'in_imag_color' )
	: ( _real ? 'out_real_color' : 'out_imag_color' )
	;

    hsv[0] = hh;
    hsv[1] = ss;

    updatePaintColor( hsv, rgb, patch );

    return true;
}

function gradSelectLum( _ctrl, _real, _inside ) {
    var ll = parseFloat( _ctrl.value ) + 0.0;
    _ctrl.value = ll;

    var hsv =	_inside
	? ( _real ? gradInnerHSV_r : gradInnerHSV_i )
	: ( _real ? gradOuterHSV_r : gradOuterHSV_i )
	;
    var rgb =	_inside
	? ( _real ? gradInnerColor_r : gradInnerColor_i )
	: ( _real ? gradOuterColor_r : gradOuterColor_i )
	;
    var patch = _inside
	? ( _real ? 'in_real_color'  : 'in_imag_color' )
	: ( _real ? 'out_real_color' : 'out_imag_color' )
	;

    hsv[2] = ll;

    updatePaintColor( hsv, rgb, patch );

    return true;
}

function gradSelectOpacity( _ctrl, _inner ) {
    var oo = parseFloat( _ctrl.value ) + 0.0;
    _ctrl.value = oo;
    if ( _inner ) {
	gradInnerOpacity = oo;
    }
    else {
	gradOuterOpacity = oo;
    }
    return true;
}

function __highlightCurrent( _this ) {
    if ( !_this ) {
	return false;
    }

    var parent = _this.parentNode;
    if ( ! parent ) {
	return false;
    }

    var sibs = parent.children;
    for ( var ii = 0; ii < sibs.length; ++ii ) {
	var sib = sibs[ ii ];
	if ( sib.tagName == "IMG" ) {
	    if ( sib == _this ) {
		sib.style.border = 'solid blue 2px';
	    }
	    else {
		sib.style.border = 'solid black 2px';
	    }
	}
    }
}

function gradSelectPaintMode( _mode ) {
    if ( _mode == 'normal' ) {
	gradientPaintMode = __normalPaintMode;
    }
    else if ( _mode == 'add' ) {
	gradientPaintMode = __addPaintMode
    }
    else if ( _mode == 'multiply' ) {
	gradientPaintMode = __multiplyPaintMode
    }
    else {
	return false;
    }

    return true;
}

function gradientMouseOut( _event ) {
    return __drawAllCircles();
}

function __radiusCmp( a, b ) {
    return ( a < b ) ? -1 : ( a == b ) ? 0 : 1;
}

function __gradientFill( _min, _max ) {
    var canvas_m = document.getElementById( 'canvas_m' );
    var canvas_p = document.getElementById( 'canvas_p' );
    if ( !canvas_m || !canvas_p ) {
	return false;
    }

    if ( !fftData ) {
	fftData = __createFFTDataFromCanvas( canvas_m.id, canvas_p.id );
	if ( !fftData ) {
	    return false;
	}
    }

    var real = fftData.real;
    var imag = fftData.imag;
    var ww = fftData.width;
    var hh = fftData.height;

    var context_m = canvas_m.getContext('2d');
    var context_p = canvas_p.getContext('2d');

    var raw_m = context_m.getImageData( 0, 0, ww, hh );
    var result_m = raw_m.data;
    var raw_p = context_p.getImageData( 0, 0, ww, hh );
    var result_p = raw_p.data;

    var dr = _max - _min;
    var cr = new Array( 0.0, 0.0, 0.0 );
    var ci = new Array( 0.0, 0.0, 0.0 );

    for ( var jj=0; jj < hh; ++jj ) {
	for ( var ii=0; ii < ww; ++ii ) {
	    var rr = gradRadiusFunc( ii - ww/2, jj - hh/2 );
	    if ( _min <= rr && rr <= _max ) {
		var tt = ( dr == 0 ) ? 1 : ( rr - _min ) / dr;
		for ( var kk=0; kk < 3; ++kk ) {
		    cr[kk] = (1.0 - tt) * gradInnerColor_r[kk]
			+ tt * gradOuterColor_r[kk];
		    ci[kk] = (1.0 - tt) * gradInnerColor_i[kk]
			+ tt * gradOuterColor_i[kk];
		}
		var opacity = (1.0 - tt) * gradInnerOpacity
		    + tt * gradOuterOpacity;
		var index = ( jj * ww + ii ) * 4;
		gradientPaintMode( real, imag, result_m, result_p,
				   index, index, cr, ci, opacity );
	    }
	}
    }

    context_m.putImageData( raw_m, 0, 0 );
    context_p.putImageData( raw_p, 0, 0 );

    return true;
}

function gradientMouseUp( _event ) {
    var canvas = _event.target;
    var rect = __getBoundingClientRect( canvas );

    var mx = Math.round(_event.clientX - rect.left);
    var my = Math.round(_event.clientY - rect.top);

    var mx2 = mx - canvas.width/2;
    var my2 = my - canvas.height/2;

    var rr = gradRadiusFunc( mx2, my2 );

    if ( gradSelectMode != GRAD_ANNULUS
	 || gradCircles.length == 2 ) {
	gradCircles.length = 0;
    }
    gradCircles.push( rr );

    var circlesNeeded = ( gradSelectMode == GRAD_ANNULUS ) ? 2 : 1;
    if ( gradCircles.length >= circlesNeeded ) {
	var rmin;
	var rmax;

	if ( gradSelectMode == GRAD_INSIDE ) {
	    rmin = 0;
	    rmax = gradCircles[0];
	}
	else if ( gradSelectMode == GRAD_OUTSIDE ) {
	    rmin = gradCircles[0];
	    rmax = gradRadiusFunc( canvas.width/2, canvas.height/2 );
	}
	else {
	    gradCircles.sort( __radiusCmp );
	    rmin = gradCircles[0];
	    rmax = gradCircles[1];
	}

	__gradientFill( rmin, rmax );

	gradCircles.length = 0;
    }

    return __drawAllCircles();
}

function gradientMouseMove( _event ) {
    var canvas = _event.target;
    var rect = __getBoundingClientRect( canvas );

    var mx = Math.round(_event.clientX - rect.left);
    var my = Math.round(_event.clientY - rect.top);

    var mx2 = mx - canvas.width/2;
    var my2 = my - canvas.height/2;

    var rr = gradRadiusFunc( mx2, my2 );

    gradCircles.push( rr );
    var ret = __drawAllCircles();
    gradCircles.pop( rr );

    return ret;
}


//
// set up gradient-mode event handlers
//
modes.gradient_controls = {
    init: gradientClearCircles,
    handleMouseOut: gradientMouseOut,
    handleMouseUp: gradientMouseUp,
    handleMouseDrag: gradientMouseMove,
    handleMouseTrack: gradientMouseMove,
};
