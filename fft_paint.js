var tools = new Array(
    'file_controls',
    'fft_controls',
    'paint_controls',
    'gradient_controls',
    'blur_controls',
    'curve_controls'
);

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
	    }
	    else {
		ctrl.style.visibility = 'hidden';
		button.src = 'false.png';
	    }
	}
    }

    return success;
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
    var hh = __nextPowerOfTwo( Math.min( Math.max( ih, 128 ), 256 ) );

    canvas.width = ww;
    canvas.height = hh;

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    context.fillStyle = '#000';
    context.fillRect( 0, 0, ww, hh );

    var ox = (ww - iw)/2;
    var oy = (hh - ih)/2;

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

    //
    // blit the image into the canvas
    //
    context.drawImage( img,  0,  0, img.naturalWidth, img.naturalHeight,
		            ox, oy, iw,               ih );

    return true;
}

function changeImage( _url ) {
    var img = document.getElementById( 'original_image' );
    img.src = _url;
    return __prepareImage( 'original_image', 'the_canvas' );
}

function initGUI() {
    var success = selectTool( tools[0] );
    success = success && __prepareImage( 'original_image', 'the_canvas' );
    setTimeout("changeImage('http://americansportsblog.files.wordpress.com/2009/07/logan-tom-15-and-her-teammates-on-the-us-womens-olympic-volleyball-team.jpg');", 5000);
    return success;
}
