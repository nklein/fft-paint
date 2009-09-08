
//
// The basic gist of a 2-D FFT is that you do a 1-D FFT on every
// row of pixels.  Then, you do a 1-D FFT on every column of the
// result.
//
// You could, if you wanted, do this with lots of buffer copying
// and filling and copyback stuff.  For the code below, I instead
// went with keeping the 2-D data in 1-D arrays.  The 1-D arrays
// have 4 channels per pixel (red, green, blue, alpha).  So, to
// get the pixel at position (ii,jj) in an image that is (ww,hh),
// I index like so:
//     array[ ( jj * ww + ii ) * 4 ]
//
// Of course, since I don't want to have to shuffle the buffer,
// and I want to use the same function to do both the horizontal
// and the vertical FFTs, I instead end up doing things like this:
//     array[ jj * _dy + ii * _dx ];
//
// When I am going horizontally, _dy is ww*4 and _dx is 4.
// When I am going vertically, _dy is 4 and _dx is ww*4.
//


//
// Technically, one can do a Fast(er) Fourier Transform when the
// width and height are any composite numbers.  However, it is all
// fastest if the width and height are both powers of two.  Further,
// we don't want to have to write fully general code here.  We only
// want to deal with the simplest case.
//
// Hence, when we get ready to go here, we slam the canvas so that
// it is a power of two on each edge.
//
function __getNextPowerOfTwo( nn ) {
    var pp = 1;
    while ( pp < nn ) {
	pp *= 2;
    }
    return pp;
}

//
// As mentioned above, we need the dimensions of our input image to be
// powers of two.  Here, we figure out what the next power of two is
// up from the width and height of the image.  Then, we make our canvas
// that size.  Here, we stretch the image to fit the canvas.  We could,
// instead, have centered the image in the canvas.  *shrug*
//
function prepImageForFFT( _imageId, _canvasId ) {
    var image = document.getElementById( _imageId );
    var canvas = document.getElementById( _canvasId );
    if ( !image || !canvas ) {
	return false;
    }

    var ww = __getNextPowerOfTwo( image.width );
    var hh = __getNextPowerOfTwo( image.height );

    canvas.width = ww;
    canvas.height = hh;

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    context.drawImage( image, 0, 0, ww, hh );
    return true;
}

//
// I'm not even going to try to explain this code.  There are many
// explanations online.  I worked from this one, mostly:
//     http://www.librow.com/articles/article-10
//
// The basic gist though is that you're starting with a 1-D array
// of pixels.  You do some fancy bit magic that gets them into the
// most convenient order for actually performing the FFT.
//
// This would be totally broken were it not for the fact that we're
// doing the power-of-two version of the FFT.
//
function __rearrangeSamples( _array, _offset, _ww, _stride ) {
    var target = 0;
    for ( var pos = 0; pos < _ww; ++pos ) {
	if ( target > pos ) {
	    for ( var kk = 0; kk < 4; ++kk ) {
		var tmp = _array[ target*_stride + kk + _offset ];
		_array[ target*_stride + kk + _offset ]
			= _array[ pos*_stride + kk + _offset ];
		_array[ pos*_stride + kk + _offset ] = tmp;
	    }
	}
	var mask = _ww;
	while ( ( target & ( mask >>= 1 ) ) ) {
	    target &= ~mask;
	}
	target |= mask;
    }
}

//
// The way the FFT algorithm operates here (based partly on the
// way that __rearrangeSamples() above works), the lowest frequencies
// are at the left and right of the buffer.  Typically, the FFT is
// displayed with the lowest frequencies in the center.  This function
// basically swaps the left and right half of the image to effect
// that.  Maybe, it should mirror each half, I haven't really thought
// it through.
//
function __shiftSamples( _samps, _base, _ww, _stride ) {
    var mid = _base + _ww * _stride / 2;

    for ( var ii=0; ii < _ww/2; ++ii ) {
	for ( var kk=0; kk < 3; ++kk ) {
	    var tmp = _samps[ _base + ii*_stride + kk ];
	    _samps[ _base + ii*_stride + kk ]
		= _samps[ mid + ii*_stride + kk ];
	    _samps[ mid + ii*_stride + kk ] = tmp;
	}
    }
}

//
// Most implementations only scale the data during IFFT.  We are going
// to scale it both times.  The ultimate result is:
//
//    Image = IFFT( FFT( Image ) ) / ( Image.width * Image.height );
//
// Hence, our square root here.
//
function __scaleSamples( _samps, _base, _ww, _stride ) {
    var scale = Math.sqrt( 1.0 * _ww );

    for ( var ii=0; ii < _ww; ++ii ) {
	for ( var kk=0; kk < 3; ++kk ) {
	    _samps[ _base + ii*_stride + kk ] /= scale;
	}
    }
}

//
// This is the real meat and potatoes.  It does the actual 1-D FFT
// on the whole image.  It is called twice, once for the horizontal
// and once for the vertical with _ww, _hh, _dx, and _dy set
// as needed to fake it out as described at the top.
//
// The same method is used for both the FFT and the inverse FFT since
// they are nearly identical.  The major difference is the sign of
// the angles used and the IFFT is typically scaled.  I opted to do
// scaling on both the FFT and IFFT.
//
// Since JavaScript doesn't have native complex numbers (actually, I
// don't think I actually checked.. I just assumed it didn't), I have
// done the complex math explicitly here.  The _real and _imag are
// the real and imaginary components of the input image and the output
// results.  Variables like fac_r and fac_i come in pairs where
// fac_r is the real portion of the factor and fac_i is the imaginary
// portion.
//
function __performFFT( _real, _imag, _ww, _hh, _dx, _dy, _inverse ) {
    //
    // loop through each "row" of pixels.  I say "row" because this
    // is used for both horizontal rows and vertical rows depending
    // on _dx and _dy.
    //
    for ( var jj = 0; jj < _hh; ++jj ) {
	//
	// for the inverse, get rid of the prettification we did
	// before continuing
	//
	if ( _inverse ) {
	    __shiftSamples( _real, jj * _dy, _ww, _dx );
	    __shiftSamples( _imag, jj * _dy, _ww, _dx );
	}

	//
	// shuffle things to make the loop below work
	//
	__rearrangeSamples( _real, jj * _dy, _ww, _dx );
	__rearrangeSamples( _imag, jj * _dy, _ww, _dx );

	var pi = 3.14159265358979323846264338327950288;
	var angularScale = ( _inverse ) ? pi : -pi;

	//
	// Go through for each power of two below the image size
	//
	for ( var step = 1; step < _ww; step += step ) {
	    //
	    // prep some variables
	    //
	    var delta = angularScale / step;
	    var sine = Math.sin( delta / 2.0 );
	    var fac_r = 1.0;
	    var fac_i = 0.0;
	    var mul_r = -2.0 * sine * sine;
	    var mul_i = Math.sin( delta );

	    //
	    // Go through for each grouping of pixels within each
	    // power of two.
	    //
	    for ( var group = 0; group < step; ++group ) {
		//
		// Within each group, the pixels are paired together
		// for calculation.  Herein, the variable called
		// "pair" is overloaded.  It identifies the pair
		// by giving the index of the first member of the
		// pair.  The "match" variable is the second member
		// of the pair.
		//
		for ( var pair = group; pair < _ww; pair += step * 2 ) {
		    var match = pair + step;
		    //
		    // Here, we loop through the red, green, and blue
		    // (but skip over the alpha)
		    // 
		    for ( var kk = 0; kk < 3; ++kk ) {
			//
			// calculate the indices for the two halves of
			// of the pair.
			//
			var p_index = jj * _dy + pair * _dx + kk;
			var m_index = jj * _dy + match * _dx + kk;

			var rr = _real[ m_index ];
			var ii = _imag[ m_index ];

			//
			// multiply the second element of the pair by
			// the current factor.
			//
			var prod_r = rr * fac_r - ii * fac_i;
			var prod_i = rr * fac_i + ii * fac_r;

			//
			// now, put the difference in the match side
			// and the sum in the pair side
			//
			_real[ m_index ] = _real[ p_index ] - prod_r;
			_imag[ m_index ] = _imag[ p_index ] - prod_i;
			_real[ p_index ] += prod_r;
			_imag[ p_index ] += prod_i;
		    }
		}

		//
		// increment the factor by the factor times the
		// multiplier
		//
		var inc_r = mul_r * fac_r - mul_i * fac_i;
		var inc_i = mul_r * fac_i + mul_i * fac_r;
		fac_r += inc_r;
		fac_i += inc_i;
	    }
	}

	__scaleSamples( _real, jj * _dy, _ww, _dx );
	__scaleSamples( _imag, jj * _dy, _ww, _dx );

	//
	// for the FFT, shift the row so the low-order frequencies
	// are in the center
	//
	if ( !_inverse ) {
	    __shiftSamples( _real, jj * _dy, _ww, _dx );
	    __shiftSamples( _imag, jj * _dy, _ww, _dx );
	}
    }

    return true;
}

//
// Here, we take both an FFT data structure and a Canvas Id.
// If we have not yet run an FFT here, then the FFT data structure
// will not be set (actually, it won't be a data structure at all,
// it will be the constant "false").  In that case, we allocate
// real and imaginary buffers and copy the image from the canvas
// into the real buffer.  If the FFT data structure is set up,
// then we use the data that's already in it rather than copying
// from the canvas.  In this way, we can run multiple FFTs in a
// row, and IFFT our way back through all of them even though
// the image in the canvas after we're done with an FFT is just
// a representation of the magnitude of the actual complex data.
//
function FFT( _fftData ) {
    if ( ! _fftData ) {
	return false;
    }

    var ww = _fftData.width;
    var hh = _fftData.height;
    var real = _fftData.real;
    var imag = _fftData.imag;

    //
    // now, we do the FFT horizontally, then vertically
    //
    __performFFT( real, imag, ww, hh, 4, ww*4, false );
    __performFFT( real, imag, hh, ww, ww*4, 4, false );

    //
    // and, we return our complex buffers so that we can use
    // them instead of our representation
    //
    return {
	width: ww,
	height: hh,
	real: real,
	imag: imag,
        level: ((_fftData) ? (_fftData.level + 1) : 1)
   };
}

//
// The IFFT depends on the FFT Data structure returned by the FFT
// above to work properly.  It needs a canvas into which to blit
// the result, but it doesn't need to copy data out of the canvas.
//
function IFFT( _fftData ) {
    if ( !_fftData ) {
	return false;
    }

    var ww = _fftData.width;
    var hh = _fftData.height;

    var real = _fftData.real;
    var imag = _fftData.imag;

    //
    // do the inverse FFT in the vertical, then the horizontal direction.
    //
    __performFFT( real, imag, hh, ww, ww*4, 4, true );
    __performFFT( real, imag, ww, hh, 4, ww*4, true );

    //
    // Return the resulting buffers so that we can use them
    // next time we need to do an FFT or IFFT.
    //
    return {
	width: ww,
	height: hh,
	real: real,
	imag: imag,
	level: (_fftData.level - 1)
   };
}

