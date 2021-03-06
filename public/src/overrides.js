'use strict';


overrides = window.overrides || {};

if (typeof window !== 'undefined') {
	(function ($) {
		require(['translator'], function (translator) {
			$.fn.getCursorPosition = function () {
				var el = $(this).get(0);
				var pos = 0;
				if ('selectionStart' in el) {
					pos = el.selectionStart;
				} else if ('selection' in document) {
					el.focus();
					var Sel = document.selection.createRange();
					var SelLength = document.selection.createRange().text.length;
					Sel.moveStart('character', -el.value.length);
					pos = Sel.text.length - SelLength;
				}
				return pos;
			};

			$.fn.selectRange = function (start, end) {
				if (!end) {
					end = start;
				}
				return this.each(function () {
					if (this.setSelectionRange) {
						this.focus();
						this.setSelectionRange(start, end);
					} else if (this.createTextRange) {
						var range = this.createTextRange();
						range.collapse(true);
						range.moveEnd('character', end);
						range.moveStart('character', start);
						range.select();
					}
				});
			};

			// http://stackoverflow.com/questions/511088/use-javascript-to-place-cursor-at-end-of-text-in-text-input-element
			$.fn.putCursorAtEnd = function () {
				return this.each(function () {
					$(this).focus();

					if (this.setSelectionRange) {
						var len = $(this).val().length * 2;
						this.setSelectionRange(len, len);
					} else {
						$(this).val($(this).val());
					}
					this.scrollTop = 999999;
				});
			};

			$.fn.translateHtml = function (str) {
				return translate(this, 'html', str);
			};

			$.fn.translateText = function (str) {
				return translate(this, 'text', str);
			};

			$.fn.translateVal = function (str) {
				return translate(this, 'val', str);
			};

			$.fn.translateAttr = function (attr, str) {
				return this.each(function () {
					var el = $(this);
					translator.translate(str, function (translated) {
						el.attr(attr, translated);
					});
				});
			};

			function translate(elements, type, str) {
				return elements.each(function () {
					var el = $(this);
					translator.translate(str, function (translated) {
						el[type](translated);
					});
				});
			}
		});
	}(jQuery || { fn: {} }));

	(function () {
		// from http://stackoverflow.com/questions/15931962/bootstrap-dropdown-disappear-with-right-click-on-firefox
		// obtain a reference to the original handler
		var _clearMenus = $._data(document, 'events').click.filter(function (el) {
			return el.namespace === 'bs.data-api.dropdown' && el.selector === undefined;
		});

		if (_clearMenus.length) {
			_clearMenus = _clearMenus[0].handler;
		}

		// disable the old listener
		$(document)
			.off('click.data-api.dropdown', _clearMenus)
			.on('click.data-api.dropdown', function (e) {
				// call the handler only when not right-click
				if (e.button !== 2) {
					_clearMenus();
				}
			});
	}());
	var timeagoFn;
	overrides.overrideTimeago = function () {
		if (!timeagoFn) {
			timeagoFn = $.fn.timeago;
		}

		if (parseInt(config.timeagoCutoff, 10) === 0) {
			$.timeago.settings.cutoff = 1;
		} else if (parseInt(config.timeagoCutoff, 10) > 0) {
			$.timeago.settings.cutoff = 1000 * 60 * 60 * 24 * (parseInt(config.timeagoCutoff, 10) || 30);
		}

		$.timeago.settings.allowFuture = true;
		var userLang = config.userLang.replace('_', '-');
		var options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
		var formatFn;
		if (typeof Intl === 'undefined') {
			formatFn = function (date) {
				return date.toLocaleString(userLang, options);
			};
		} else {
			var dtFormat = new Intl.DateTimeFormat(userLang, options);
			formatFn = dtFormat.format;
		}

		var iso;
		var date;
		$.fn.timeago = function () {
			var els = $(this);
			// Convert "old" format to new format (#5108)
			els.each(function () {
				iso = this.getAttribute('title');
				if (!iso) {
					return;
				}
				this.setAttribute('datetime', iso);
				date = new Date(iso);
				if (!isNaN(date)) {
					this.textContent = formatFn(date);
				}
			});

			timeagoFn.apply(this, arguments);
		};
	};
}
