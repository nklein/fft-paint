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

function __clampPixel( _rr, _ii ) {
    var vv = Math.round( 255.0 * Math.sqrt( _rr*_rr + _ii*_ii ) );
    if ( vv > 255 ) {
	vv = 255;
    }
    return vv;
}

var modes = { };
