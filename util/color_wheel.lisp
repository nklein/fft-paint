
(require 'asdf)
(asdf:operate 'asdf:load-op 'zpng)

(defun hsv-to-rgb (hh ss vv)
  (if (< hh 0.0)
      (hsv-to-rgb (+ hh pi pi) ss vv)
      (let ((angle (* hh 180 (/ pi))))
	(let ((ff (- (/ angle 60) (floor (/ angle 60)))))
	  (let ((pp (* vv (- 1 ss)))
		(qq (* vv (- 1 (* ff ss))))
		(tt (* vv (- 1 (* (- 1 ff) ss)))))
	    (case (mod (floor (/ angle 60)) 6)
	      (0 (values vv tt pp 1.0))
	      (1 (values qq vv pp 1.0))
	      (2 (values pp vv tt 1.0))
	      (3 (values pp qq vv 1.0))
	      (4 (values tt pp vv 1.0))
	      (5 (values vv pp qq 1.0))))))))

(defun calc-color (xx yy max-rr)
  (let ((rr (sqrt (+ (* xx xx) (* yy yy)))))
    (if (<= rr max-rr)
	(hsv-to-rgb (atan yy xx) (/ rr max-rr) 0.8)
	(values 0.5 0.5 0.5 0.0))))

(defun to-pixel-value (vv)
  (let ((nn (round (* vv 255))))
    (cond
      ((minusp nn) 0)
      ((> nn 255) 255)
      (t nn))))

(let ((rr 32))
  (let ((img (make-instance 'zpng:pixel-streamed-png
			    :color-type :truecolor-alpha
			    :width (* rr 2)
			    :height (* rr 2))))
    (with-open-file (output #P"../color_wheel.png"
			    :direction :output
			    :if-exists :supersede
			    :if-does-not-exist :create
			    :element-type '(unsigned-byte 8))
      (zpng:start-png img output)
      (dotimes (yy (* rr 2))
	(dotimes (xx (* rr 2))
	  (multiple-value-bind (rr gg bb aa)
	      (calc-color (- xx rr) (- yy rr) rr)
	    (zpng:write-pixel (list (to-pixel-value rr)
				     (to-pixel-value gg)
				     (to-pixel-value bb)
				     (to-pixel-value aa)) img))))
      (zpng:finish-png img))))

	
