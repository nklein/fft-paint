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

function initGUI() {
    var success = selectTool( tools[0] );
    success = success && __prepareImage( 'original_image', 'the_canvas' );
    return success;
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

var paint_color_r = Array( 1.0, 0.0, 0.0 );
var paint_color_i = Array( 0.0, 0.0, 0.0 );
var paint_opacity = 0.2;
var paint_mode = __normalPaintMode;
var brush = Array(
  Array( 0.1, 0.2, 0.5, 0.2, 0.1 ),
  Array( 0.2, 0.7, 0.9, 0.7, 0.2 ),
  Array( 0.5, 0.9, 1.0, 0.9, 0.5 ),
  Array( 0.2, 0.7, 0.9, 0.7, 0.2 ),
  Array( 0.1, 0.2, 0.5, 0.2, 0.1 )
);

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

    var bh = brush.length;
    var bw = brush[0].length;
    var mx = event.clientX - canvas.offsetLeft;
    var my = event.clientY - canvas.offsetTop;

    var bound_xx = Math.max( mx - (bw-1)/2, 0 );
    var bound_ww = Math.min( mx + (bw-1)/2, canvas.width ) - bound_xx;
    var bound_yy = Math.max( my - (bh-1)/2, 0 );
    var bound_hh = Math.min( my + (bh-1)/2, canvas.height ) - bound_yy;

    if ( bound_ww < 1 || bound_hh < 1 ) {
	return false;
    }
    var rawResult = context.getImageData(bound_xx,bound_yy,bound_ww,bound_hh);
    var result = rawResult.data;

    var real = fftData.real;
    var imag = fftData.imag;

    for ( var bj = 0, r_index = 0; bj < bh; ++bj ) {
	var yy = my + bj - (bh-1)/2;
	if ( 0 <= yy && yy < canvas.height ) {
	    var yoff = yy * canvas.width * 4;

	    for ( var bi = 0; bi < bw; ++bi ) {
		var xx = mx + bi - (bw-1)/2;
		if ( 0 <= xx && xx < canvas.width ) {
		    var index = yoff + xx * 4;
		    window.status = "(" + xx + "," + yy + ") = " + index;
		    paint_mode( real, imag, result, index, r_index,
				paint_color_r, paint_color_i,
				paint_opacity );
		    r_index += 4;
		}
	    }
	}
    }

    context.putImageData( rawResult, bound_xx, bound_yy );
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
	handleMouseTrack: logMouseMove,
    },
}
