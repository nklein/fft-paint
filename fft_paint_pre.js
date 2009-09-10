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

var modes = { };
