var tools = new Array(
    'file_controls',
    'fft_controls',
    'paint_controls',
    'gradient_controls',
    'blur_controls',
    'curve_controls'
);

var curMode = false;
var fftData = false;
var mouseDown = false;

var pi = 3.14159265358979323846264338327950288;

function __clampPixel( _rr, _ii ) {
    var vv = Math.round( 255.0 * Math.sqrt( _rr*_rr + _ii*_ii ) );
    if ( vv > 255 ) {
	vv = 255;
    }
    return vv;
}

function __clampPhase( _rr, _ii ) {
    var vv = ( _rr*_rr + _ii*_ii > 0.000001 )
	? Math.round( 128.0 * Math.atan2( _ii, _rr ) / pi ) + 128
	: 128;
    while ( vv < 0 ) {
	vv += 256;
    }
    while ( vv > 255 ) {
	vv -= 256;
    }
    return vv;
}

function __recursivelyGetClientOffset( _ctrl, _rect ) {
    if ( _ctrl ) {
	__recursivelyGetClientOffset( _ctrl.offsetParent, _rect );
	_rect.top += _ctrl.offsetTop;
	_rect.left += _ctrl.offsetLeft;
    }
}

function __getBoundingClientRect( _ctrl ) {
    if ( _ctrl.getBoundingClientRect ) {
	return _ctrl.getBoundingClientRect();
    }
    else {
	var rect = {};

	rect.left = 0;
	rect.top = 0;

	__recursivelyGetClientOffset( _ctrl, rect );

	rect.width = _ctrl.width;
	rect.height = _ctrl.height;
	rect.right = rect.left + _ctrl.width;
	rect.bottom = rect.top + _ctrl.height;

	return rect;
    }
}

var modes = { };
