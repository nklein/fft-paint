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

var modes;

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
		curMode = modes[ _id ];
	    }
	    else {
		ctrl.style.visibility = 'hidden';
		button.src = 'false.png';
	    }
	}
    }

    return success;
}

function __clampPixel( _rr, _ii ) {
    var vv = Math.round( 255.0 * Math.sqrt( _rr*_rr + _ii*_ii ) );
    if ( vv > 255 ) {
	vv = 255;
    }
    return vv;
}

function __nextPowerOfTwo( _nn ) {
    for ( var pp = 1; pp < _nn; pp += pp ) {
	/* do nothing */
    }
    return pp;
}

function __prepareImage( _imgId, _canvasId ) {
    var img = document.getElementById( _imgId );
    var canvas = document.getElementById( _canvasId );
    if ( !img || !canvas ) {
	return false;
    }

    if ( !img.complete ) {
	setTimeout("__prepareImage('"+ _imgId +"','"+ _canvasId +"');", 1000);
	return true;
    }

    var iw = img.naturalWidth;
    var ih = img.naturalHeight;

    if ( iw < 1 || ih < 1 ) {
	return false;
    }

    //
    // round the image width and height up to the next power of two
    // (after clamping to make sure our result is neither too small
    // nor too large)
    //
    var ww = __nextPowerOfTwo( Math.min( Math.max( iw, 128 ), 512 ) );
    var hh = __nextPowerOfTwo( Math.min( Math.max( ih, 128 ), 512 ) );

    canvas.width = ww;
    canvas.height = hh;

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    context.fillStyle = '#333';
    context.fillRect( 0, 0, ww, hh );

    //
    // if our image got bigger than we're letting our canvas get,
    // then we're going to scale the image down.
    //
    if ( iw > ww || ih > hh ) {
	var aspect = (iw * 1.0) / (ih * 1.0);
	if ( aspect * hh <= ww ) {
	    iw = aspect * hh;
	    ih = hh;
	}
	else {
	    iw = ww;
	    ih = ww / aspect;
	}
    }

    var ox = (ww - iw)/2;
    var oy = (hh - ih)/2;

    //
    // blit the image into the canvas
    //
    context.drawImage( img,  0,  0, img.naturalWidth, img.naturalHeight,
		            ox, oy, iw,               ih );

    return true;
}

function changeImage( _url ) {
    var img = document.getElementById( 'original_image' );
    fftData = false;
    img.src = _url;
    return __prepareImage( 'original_image', 'the_canvas' );
}

function copyCanvas( _canvasId ) {
    var canvas = document.getElementById( _canvasId );

    if ( ! canvas ) {
	return false;
    }

    window.open(
	canvas.toDataURL(),
        "_blank",
        "width=" + canvas.width + ",height=" + canvas.height
    );

    return true;
}

function __createFFTDataFromCanvas( _canvasId ) {
    var canvas = document.getElementById( _canvasId );

    if ( ! canvas ) {
	return false;
    }

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var ww = canvas.width;
    var hh = canvas.height;

    var real = new Array();
    var imag = new Array();

    real.length = ww * hh * 4;
    imag.length = ww * hh * 4;

    var rawResult = context.getImageData( 0, 0, ww, hh );
    var result = rawResult.data;

    for ( var pp=0; pp < result.length; ++pp ) {
	real[ pp ] = result[ pp ] / 255.0;
	imag[ pp ] = 0.0;
    }

    return {
	width: ww,
	height: hh,
	real: real,
	imag: imag,
	level: 1
   };
}

function __fillCanvasFromFFTData( _canvasId, _fftData ) {
    var canvas = document.getElementById( _canvasId );

    var ww = _fftData.width;
    var hh = _fftData.height;
    var real = _fftData.real;
    var imag = _fftData.imag;

    canvas.width = ww;
    canvas.height = hh;

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var rawResult = context.getImageData( 0, 0, ww, hh );
    var result = rawResult.data;

    //
    // then, we fill the canvas with the magnitude of
    // the complex FFT data
    //
    for ( var pp=0; pp < result.length; pp += 4 ) {
	//
	// here, we do the red, green, and blue, but just
	// hardcode the alpha
	//
	for ( var kk=0; kk < 3; ++kk ) {
	    var index = pp + kk;
	    result[ index ] = __clampPixel( real[ index ], imag[ index ] );
	}
	result[ pp + 3 ] = 255;
    }

    //
    // then, we blit our representation back to the canvas
    //
    context.putImageData( rawResult, 0, 0 );

    return true;
}

function doFFT( _canvasId, _inverse ) {
    if ( !fftData ) {
	fftData = __createFFTDataFromCanvas( _canvasId );
	if ( !fftData ) {
	    return false;
	}
    }

    var success;
    if ( _inverse ) {
	success = IFFT( fftData );
    }
    else {
	success = FFT( fftData );
    }

    if ( success ) {
	__fillCanvasFromFFTData( _canvasId, success );
	fftData = success;
    }

    return success;
}

function mousedown() {
    mouseDown = true;
    return curMode && curMode.handleMouseDown && curMode.handleMouseDown();
}

function mouseup() {
    mouseDown = false;
    return curMode && curMode.handleMouseUp && curMode.handleMouseUp();
}

function mousemove() {
    return curMode && ( ( mouseDown )
			?  ( curMode.handleMouseDrag
			     && curMode.handleMouseDrag() )
			:  ( curMode.handleMouseTrack
			     && curMode.handleMouseTrack() )
	              );
}

//
// paint controls
//
function __normalPaintMode( _real, _imag, _result, _offset, _r_offset,
			    _clr_r, _clr_i, _alpha ) {
    for ( var kk=0; kk < 3; ++kk ) {
	var index = _offset + kk;
	_real[index] = (1.0 - _alpha) * _real[index] + _alpha * _clr_r[kk];
	_imag[index] = (1.0 - _alpha) * _imag[index] + _alpha * _clr_i[kk];

	_result[ _r_offset + kk ] = __clampPixel( _real[index], _imag[index] );
    }
}

function __addPaintMode( _real, _imag, _result, _offset, _r_offset,
			    _clr_r, _clr_i, _alpha ) {
    for ( var kk=0; kk < 3; ++kk ) {
	var index = _offset + kk;
	_real[index] += _alpha * _clr_r[kk];
	_imag[index] += _alpha * _clr_i[kk];

	_result[ _r_offset + kk ] = __clampPixel( _real[index], _imag[index] );
    }
}

function __multiplyPaintMode( _real, _imag, _result, _offset, _r_offset,
			    _clr_r, _clr_i, _alpha ) {
    for ( var kk=0; kk < 3; ++kk ) {
	var index = _offset + kk;
	var rr = _real[index];
	var ii = _imag[index];

	_real[index] = (1.0 - _alpha) * rr
	    + _alpha * ( rr * _clr_r[kk] - ii * _clr_i[kk] );
	_imag[index] = (1.0 - _alpha) * ii
	    + _alpha * ( rr * _clr_i[kk] + ii * _clr_r[kk] );

	_result[ _r_offset + kk ] = __clampPixel( _real[index], _imag[index] );
    }
}

var paint_hsv_r = Array( 0.0, 0.0, 1.0 );
var paint_hsv_i = Array( 0.0, 0.0, 0.0 );

var paint_color_r = Array( 1.0, 0.0, 0.0 );
var paint_color_i = Array( 0.0, 0.0, 0.0 );
var paint_opacity = 0.2;
var paint_mode = __normalPaintMode;
var paint_brush = false;

var pi = 3.14159265358979323846264338327950288;

function selectPaintMode( _mode ) {
    if ( _mode == 'normal' ) {
	paint_mode = __normalPaintMode;
    }
    else if ( _mode == 'add' ) {
	paint_mode = __addPaintMode
    }
    else if ( _mode == 'multiply' ) {
	paint_mode = __multiplyPaintMode
    }
    else {
	return false;
    }
    return true;
}

function updatePaintColor( _hsv, _rgb, _patchId ) {
    var hh = _hsv[0];
    var ss = _hsv[1];
    var vv = _hsv[2];

    while ( hh < 0 ) {
	hh += 360;
    }

    var hi = Math.floor( hh / 60 ) % 6;
    var ff = hh / 60.0 - Math.floor( hh / 60 );

    var pp = vv * ( 1.0 - ss );
    var qq = vv * ( 1.0 - ff * ss );
    var tt = vv * ( 1.0 - (1.0 - ff) * ss);

    switch (hi) {
    case 0:  _rgb[0] = vv; _rgb[1] = tt; _rgb[2] = pp; break;
    case 1:  _rgb[0] = qq; _rgb[1] = vv; _rgb[2] = pp; break;
    case 2:  _rgb[0] = pp; _rgb[1] = vv; _rgb[2] = tt; break;
    case 3:  _rgb[0] = pp; _rgb[1] = qq; _rgb[2] = vv; break;
    case 4:  _rgb[0] = tt; _rgb[1] = pp; _rgb[2] = vv; break;
    case 5:  _rgb[0] = vv; _rgb[1] = pp; _rgb[2] = qq; break;
    }

    var rr = __clampPixel( _rgb[0], 0.0 );
    var gg = __clampPixel( _rgb[1], 0.0 );
    var bb = __clampPixel( _rgb[2], 0.0 );

    var patch = document.getElementById( _patchId );
    if ( !patch ) {
	return false;
    }
    var context = patch.getContext('2d');
    if ( ! context ) {
	return false;
    }
    context.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
    context.fillRect( 0, 0, patch.width, patch.height );

    return true;
}

function selectHueAndSaturation( _ctrl, _real ) {
    var xx = (event.clientX - _ctrl.x - _ctrl.width/2);
    var yy = (event.clientY - _ctrl.y  - _ctrl.height/2);

    var hh = Math.round( 180.0 * Math.atan2( yy, xx ) / pi );
    var rr = Math.sqrt( xx*xx + yy*yy ) / (_ctrl.width/2);
    var ss = Math.min( rr, 1.0 );

    if ( _real ) {
	paint_hsv_r[ 0 ] = hh;
	paint_hsv_r[ 1 ] = ss;
	updatePaintColor( paint_hsv_r, paint_color_r, 'real_color' );
    }
    else {
	paint_hsv_i[ 0 ] = hh;
	paint_hsv_i[ 1 ] = ss;
	updatePaintColor( paint_hsv_i, paint_color_i, 'imag_color' );
    }

    return true;
}

function selectLuminance( _ctrl, _real ) {
    var ll = _ctrl.value + 0.0;
    _ctrl.value = ll;
    if ( _real ) {
	paint_hsv_r[ 2 ] = ll;
	updatePaintColor( paint_hsv_r, paint_color_r, 'real_color' );
    }
    else {
	paint_hsv_i[ 2 ] = ll;
	updatePaintColor( paint_hsv_i, paint_color_i, 'imag_color' );
    }
    return true;
}

function selectOpacity( _ctrl ) {
    var oo = _ctrl.value + 0.0;
    _ctrl.value = oo;
    paint_opacity = oo;
    return true;
}

function setPaintBrush( _img ) {
    var brush = document.getElementById( 'paint_brush' );
    if ( !_img || !brush ) {
	return false;
    }

    var context = brush.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var ww = _img.naturalWidth;
    var hh = _img.naturalHeight;

    if ( ww < 1 || hh < 1 ) {
	return false;
    }

    if ( ww > brush.width || hh > brush.height ) {
	var aspect = 1.0 * ww / hh;
	if ( aspect * brush.height <= brush.width ) {
	    ww = aspect * brush.height;
	    hh = brush.height;
	}
	else {
	    ww = brush.width;
	    hh = brush.width / aspect;
	}
    }

    var ox = Math.round( (brush.width - ww)/2 );
    var oy = Math.round( (brush.height - hh)/2 );

    context.fillStyle = '#fff';
    context.fillRect( 0, 0, brush.width, brush.height );

    context.drawImage( _img, ox, oy, ww, hh );

    var rawData = context.getImageData( ox, oy, ww, hh );
    var pix = rawData.data;

    paint_brush = new Array();

    for ( var jj=0; jj < hh; ++jj ) {
	var row = new Array();
	for ( var ii=0; ii < ww; ++ii ) {
	    var index = ( jj * ww + ii ) * 4;
	    var rr = 1.0 - pix[ index + 0 ] / 255.0;
	    var gg = 1.0 - pix[ index + 1 ] / 255.0;
	    var bb = 1.0 - pix[ index + 2 ] / 255.0;
	    row[ii] = 0.30 * rr + 0.59 * gg + 0.11 * bb;
	}
	paint_brush[jj] = row;
    }

    return true;
}

function paintAtMouse() {
    var canvas = document.getElementById( 'the_canvas' );
    if ( !canvas ) {
	return false;
    }

    if ( !fftData ) {
	fftData = __createFFTDataFromCanvas( canvas.id );
	if ( !fftData ) {
	    return false;
	}
    }

    canvas = document.getElementById( 'the_canvas' );
    if ( !canvas ) {
	return false;
    }

    var context = canvas.getContext('2d');
    if ( !context ) {
	return false;
    }

    var bh = paint_brush.length;
    var bw = paint_brush[0].length;
    var mx = event.clientX - canvas.offsetLeft;
    var my = event.clientY - canvas.offsetTop;

    var bound_xx = Math.max( mx - Math.round(bw/2), 0 );
    var bound_ww = Math.min( mx + Math.round(bw/2), canvas.width ) - bound_xx;
    var bound_yy = Math.max( my - Math.round(bh/2), 0 );
    var bound_hh = Math.min( my + Math.round(bh/2), canvas.height ) - bound_yy;

    if ( bound_ww < 1 || bound_hh < 1 ) {
	return false;
    }
    var rawResult = context.getImageData(bound_xx,bound_yy,bound_ww,bound_hh);
    var result = rawResult.data;

    var real = fftData.real;
    var imag = fftData.imag;

    for ( var bj = 0, r_index = 0; bj < bh; ++bj ) {
	var yy = my + bj - Math.round(bh/2);
	if ( 0 <= yy && yy < canvas.height ) {
	    var yoff = yy * canvas.width * 4;

	    for ( var bi = 0; bi < bw; ++bi ) {
		var xx = mx + bi - Math.round(bw/2);
		if ( 0 <= xx && xx < canvas.width ) {
		    var index = yoff + xx * 4;
		    window.status = "(" + xx + "," + yy + ") = " + index;
		    paint_mode( real, imag, result, index, r_index,
				paint_color_r, paint_color_i,
				paint_opacity * paint_brush[bj][bi] );
		    r_index += 4;
		}
	    }
	}
    }

    context.putImageData( rawResult, bound_xx, bound_yy );
    return true;
}

//
// assign all of the mode handlers
//
function logMouseMove() {
    window.status = "Mouse move: ("+ event.clientX + "," + event.clientY +")";
}
modes = {
    paint_controls: {
	handleMouseDrag: paintAtMouse,
    },
}

//
// overall initialization
//
function initGUI() {
    return selectTool( tools[0] )
	&& __prepareImage( 'original_image', 'the_canvas' )
	&& setPaintBrush( document.getElementById('default_brush') )
	&& updatePaintColor( paint_hsv_r, paint_color_r, 'real_color' )
	&& updatePaintColor( paint_hsv_i, paint_color_i, 'imag_color' )
	;
}
