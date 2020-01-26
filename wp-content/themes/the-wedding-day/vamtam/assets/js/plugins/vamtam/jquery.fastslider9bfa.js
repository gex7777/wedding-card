(function($) {
	"use strict";

	// Constants
	var DIRECTION_NEXT      = "next",
		DIRECTION_PREV      = "prev",
		EVENT_PAUSE         = "pause.fastSlider",
		EVENT_RESUME        = "resume.fastSlider",
		EVENT_ENTER_GALLERY = "entergallery.fastSlider",
		EVENT_LEAVE_GALLERY = "leavegallery.fastSlider",
		EVENT_SLIDE_SHOWN   = "slideshown.fastSlider",
		CLASS_SLIDE_IMAGE   = "fast-slider-image";

	function FastSlider(container, slides, config)
	{
		var _pos          = -1,
			_galPos       = -1,
			_cicles       = 0,
			_direction    = config.direction,
			_curDirection = _direction,
			$_container   = $(container).addClass("fast-slider"),
			_slider       = this,
			_inGallery    = false,
			_isFullScreen = $_container.is("html, body") || $_container[0] === window,
			_isFirstTime  = true,
			_waitingTimeout;

		var UI = {
			caption    : getUIcontrol("caption"),
			description: getUIcontrol("description"),
			prev       : getUIcontrol("prev"),
			next       : getUIcontrol("next"),
			run        : getUIcontrol("run"),
			gall_next  : getUIcontrol("gal_next"),
			gall_prev  : getUIcontrol("gal_prev")
		};


		function setCaption(title, href) {
			if (UI.caption.length) {
				UI.caption.hide();
				if (title) {
					if (href) {
						title = '<a href="' + href + '">' + title + '</a>';
					}
					UI.caption.html(title).show();
				}
			}
		}

		function setDescription(description) {
			if (UI.description.length && description) {
				UI.description.find('.contents').html(description);
			}
		}

		function goToGalleryItem(dir) {
			var gall = slides[_pos].img;
			if ($.isArray(gall[0]) && gall.length > 1) {
				abort();
				//var msg = _galPos + " -> ";

				if (dir === "next") {
					_curDirection = DIRECTION_NEXT;
					if (++_galPos >= gall.length) {
						_galPos = 0;
					}
				}

				else if (dir === "prev") {
					_curDirection = DIRECTION_PREV;
					if (--_galPos < 0) {
						_galPos = gall.length - 1;
					}
				}

				else {
					return;
				}
				//console.log(msg + _galPos);
				loadImage(gall[_galPos][0], true);
			}
		}

		function abort() {
			if (_slider.isRunning()) {
				clearTimeout(_waitingTimeout);
				_waitingTimeout = null;
				return true;
			}
			return false;
		}

		function goTo(pos) {
			if (slides[pos]) {
				abort();
				_pos = pos;
				var src = slides[pos].img[0];
				if ($.isArray(src))
					src = src[0];
				loadImage(src);
			}
		}

		function resizeImages() {
			$("img." + CLASS_SLIDE_IMAGE, $_container).each(function() {
				var w  = this.offsetWidth,
					h  = this.offsetHeight,
					pw = $_container.width(),
					ph = $_container.height();

				if (w !== pw) {
					this.style.height = "auto";
					this.style.width  = "100%";
					w = pw;
					h = this.offsetHeight;
				}

				if (h < ph) {
					this.style.height = "100%";
					this.style.width  = "auto";
					w = this.offsetWidth;
					h = ph;
				}

				this.style.marginLeft = (w === pw) ? 0 : (pw - w) / 2 + "px";
			});
		}

		function showImage(src, fromGallery) {
			var headerHeight = $('.fixed-header-box').height();

			var _img = $('<img class="' + CLASS_SLIDE_IMAGE + '"/>')
				.css({
					opacity: 0,
					top: headerHeight
				})
				.appendTo($_container)
				.attr("src", src);
			resizeImages();
			_img.css(
				_isFirstTime ? { opacity : 0 } : fromGallery ?
				{ top : _img[0].offsetHeight * (_curDirection === DIRECTION_NEXT ? -1 : 1)} :
				{ left : _img[0].offsetWidth * (_curDirection === DIRECTION_NEXT ? -1 : 1)}
			);

			if (_isFirstTime) {
				_isFirstTime = false;
				$_container.addClass("started");
			}

			_img.animate({
				opacity: 1,
				left : 0,
				top : headerHeight,
				leaveTransforms: true
			}, config.animationTime, config.easing, function() {
				$("." + CLASS_SLIDE_IMAGE + ".ready", $_container).remove();
				$(this).addClass("ready");

				resizeImages();
				setCaption(slides[_pos].title, slides[_pos].href);
				setDescription(slides[_pos].description);
				$_container.trigger(EVENT_SLIDE_SHOWN);

				var gall = $.isArray(slides[_pos].img[0]);
				if (gall) {
					if (_inGallery !== _pos) {
						_inGallery = _pos;
						_galPos = 0;
						$_container.trigger(EVENT_ENTER_GALLERY);
					}
				}
				else {
					if (_inGallery !== false) {
						_inGallery = false;
						_galPos = 0;
						$_container.trigger(EVENT_LEAVE_GALLERY);
					}
				}

				if (config.autorun) {
					_slider.resume(true);
				}
			});
		}

		function loadImage(url, fromGallery) {
			var img = new Image();
			img.onload = img.onerror = function() {
				showImage(this.src, fromGallery);
			};
			img.src = url;
		}

		function getUIcontrol(type) {
			return $(
				config["sel_" + type],
				typeof config["sel_" + type] === "string" ? $_container : document
			);
		}

		// Public Methods
		// =================================================================
		this.isRunning = function() {
			return !!_waitingTimeout;
		};

		this.prev = function() {
			if (--_pos < 0) {
				_pos = slides.length - 1;
				if (++_cicles > config.loop) return;
			}
			_curDirection = DIRECTION_PREV;
			goTo(_pos);
		};

		this.next = function() {
			if (++_pos >= slides.length) {
				_pos = 0;
				if (++_cicles > config.loop) return;
			}
			_curDirection = DIRECTION_NEXT;
			goTo(_pos);
		};

		this.resume = function(silent) {
			abort();
			_waitingTimeout = setTimeout(function() {
				_slider[_curDirection === DIRECTION_NEXT ? "next":"prev"]();
			}, config.pauseTime);
			if (!silent) {
				$_container.trigger(EVENT_RESUME);
			}
		};

		this.pause = function() {
			if (abort()) {
				$_container.trigger(EVENT_PAUSE);
			}
		};

		this.toggle = function() {
			this[this.isRunning() ? "pause" : "resume"]();
		};

		this.goToNextGalleryItem = function() {
			goToGalleryItem("next");
		};

		this.goToPrevGalleryItem = function() {
			goToGalleryItem("prev");
		};

		// Initialise
		// =================================================================
		if ($_container.css("position") === "static") {
			$_container.css("position", "relative");
		}

		if (_isFullScreen) {
			$("html, body").css({
				width  : "100%",
				height : "100%",
				display: "block",
				overflow: "hidden"
			});
		}

		if (UI.prev.length)
			UI.prev.attr("title", "Previous").click(_slider.prev);
		if (UI.next.length)
			UI.next.attr("title", "Next").click(_slider.next);
		if (UI.run.length)
			UI.run.click(_slider.toggle);

		if (UI.gall_next.length) {
			$_container
			.bind(EVENT_ENTER_GALLERY, function() {
				UI.gall_next.css("opacity", 1);
			})
			.bind(EVENT_LEAVE_GALLERY, function() {
				UI.gall_next.css("opacity", 0);
			});
			UI.gall_next.attr("title", "Next Gallery Item").click(_slider.goToNextGalleryItem);
		}

		if (UI.gall_prev.length) {
			$_container
			.bind(EVENT_ENTER_GALLERY, function() {
				UI.gall_prev.css("opacity", 1);
			})
			.bind(EVENT_LEAVE_GALLERY, function() {
				UI.gall_prev.css("opacity", 0);
			});
			UI.gall_prev.attr("title", "Previous Gallery Item").click(_slider.goToPrevGalleryItem);
		}

		if (UI.description.length) {
			var toggle_desc = UI.description.find('.toggle-description');
			toggle_desc.click(function(e) {
				UI.description.find('> .contents').slideToggle();

				var alt = toggle_desc.text();
				toggle_desc.text(toggle_desc.attr('data-alternate')).attr('data-alternate', alt);

				e.preventDefault();
			});
		}

		if (config.resizeOnEvent) {
			$(window).bind(config.resizeOnEvent, resizeImages);
		}
		else {
			if (!isNaN(config.trackResize) && config.trackResize > -1) {
				var _lastWidth, _lastHeight, _c = $_container[0];
				var tick = function() {
					var w = _c.offsetWidth;
					var h = _c.offsetHeight;
					if (w !== _lastWidth || h !== _lastHeight) {
						_lastWidth  = w;
						_lastHeight = h;
						resizeImages();
					}
					setTimeout(tick, config.trackResize);
				};
			}
		}

		goTo(0);
	}

	$.fn.fastSlider = function(options, slides) {
		var cfg = $.extend({
			pauseTime      : 6000,
			animationTime  : 1000,
			easing         : "easeInOutQuart",
			direction      : DIRECTION_NEXT,
			loop           : Infinity, // How many times to rewind all slides
			sel_caption    : ".fast-slider-caption",
			sel_description: ".fast-slider-description",
			sel_prev       : ".fast-slider-prev",
			sel_next       : ".fast-slider-next",
			sel_run        : ".fast-slider-run",
			sel_gal_next   : ".fast-slider-gall-next",
			sel_gal_prev   : ".fast-slider-gall-prev",
			autorun        : false,
			trackResize    : -1,
			resizeOnEvent  : "resize.fastSlider switchlayout.fastSlider orientationchange.fastSlider"
		}, options);

		return this.each(function(i, conatainerElem) {
			var inst = $(conatainerElem).data("fastSlider");
			if (!inst) {
				inst = new FastSlider(conatainerElem, slides, cfg);
				$(conatainerElem).data("fastSlider", inst);
			}
		});
	};
})(jQuery);