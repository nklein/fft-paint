
var GRAD_INSIDE = 1;
var GRAD_OUTSIDE = 2;
var GRAD_ANNULUS = 3;

var gradSelectMode = false;
var gradCircles = false;

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

function initGradientMode() {
    gradSelectMode = GRAD_INSIDE;
    gradCircles = new Array();
    gradRadiusFunc = __l1;
    gradDrawFunc = __drawL1;
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

function gradientMouseOut( _event ) {
    return __drawAllCircles();
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
