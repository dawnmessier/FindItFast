/**
  * Find-It-Fast Autocomplete Search with built-in WAI-ARIA, version 1.0.X
  * (c) 2018 Dawn Messier
  * Licensed under the MIT License

 Generates an accessible form and autocomplete list

 Optional Configuration
 - defaults
	 - dataConfig
		 - type (string) -- `json`, `array`, or `url` (`url` assumes json response. Form is serialized and params are passed to ajax url)
		 - src (string) -- json object, array or url of data
		 - key (string) -- name of 'key' in JSON response to display listItem name
		 - href (string) -- name of 'key' in JSON response to display listItem href
		 - maxItems (number) -- maximum number of items allowed to display in autocomplete
		 - timer (number) -- millisecond delay after typing stops before data retrieval
	 - initClass (string) -- plugin class name attached to HTML tag for reference
	 - templates
		 - form
			 - method (string)
			 - action (string)
			 - name (string)
			 - label (string)
			 - hideLabelText (boolean)
			 - placeholder (string)
			 - inputName (string) -- use argument name for ajax request if selecting `url` for `dataConfig.type`
			 - inputClass (string)
			 - clearSearchHtml (string)
			 - clearSearchAriaText (string)
			 - includeSubmit (boolean) -- include a search button if the search can also redirect to a search results page. This will add a submit button with an onsubmit event (customized in eventConfig.form.onObjSubmit) and a form action (provide action in templates.form.action)
			 - action (string)
			 - submitType (string) -- `text` or `icon`, - choosing icon will render `submitAriaText`
			 - submitHtml (string) button text or icon html
			 - submitAriaText (string)
		 - listItems
			 - type (string) -- `json`, `array`
			 - includeLinks (boolean) -- uses `<a>` tags for listItems, provide `dataConfig.href`
			 - className (string) -- additional class name
			 - position (string) -- placement of autocomplete list (`bottom` or `top`)
	 - ariaConfig
		 - srHiddenClass (string)
		 - includeLiveRegion (boolean) -- should be a live region somewhere on page whether it is your own or this version (NOTE: only renders once if `true` is selected)
		 - liveMsg -- messages that the screen reader reads when search results are returned
			 - none (string) -- no results (NOTE: this message also appears in the autocomplete when no results are returned)
			 - one (string) -- one result
			 - multiple (string) -- more than one result
	 - eventConfig (callbacks) -- these are defaulted to plugin functionality, but can be replaced with your own
		 - input -- search field
			 - onObjClick
			 - onObjFocus
			 - onObjBlur
			 - onObjKeydown
		 - cancel -- search reset button
			 - onObjClick
			 - onObjFocus
			 - onObjBlur
			 - onObjKeydown
		 - listItems -- each search result
			 - onObjClick
			 - onObjFocus
			 - onObjBlur
			 - onObjKeydown
		 - form -- form actions
			 - onObjSubmit
 */
(function($) {
	'use strict';

	$.fn.findItFast = function(options){
		var CONSTANTS = {
			itemList: 'findItFast-list',
			inputClass: 'findItFast-input',
			cancelClass: 'findItFast-clear',
			formClass: 'findItFast-form'
		}

		var keyCodes = {
			ENTER: 13,
			UP: 38,
			DOWN: 40,
			ESCAPE: 27,
			TAB: 9
		}

		/*****************************************/
		/* DEFAULT CONFIGS */
		/*****************************************/
		var defaults = {
            dataConfig: {
                type: 'json',
                src: null,
                key: null,
				href: null,
				maxItems: null,
	            timer: 500
            },
            initClass: 'findItFast-js',
            templates: {
				form: {
					method: 'get',
	                action: '',
	                name: 'findItFast-form',
	                label: 'Search',
					hideLabelText: false,
	                placeholder: '',
	                inputName: 'q',
					inputClass: '',
	                clearSearchHtml: '<span aria-hidden="true">X</span>',
					clearSearchAriaText: 'Clear search',
					includeSubmit: false,
					action: '',
					submitType: 'text',
					submitHtml: 'Submit',
					submitAriaText: 'Submit'
	            },
				listItems: {
					type: 'json',
					includeLinks: false,
					className: 'findItFast-item',
					position: 'bottom'
				}
            },
			ariaConfig: {
				srHiddenClass: 'sr-only',
	            includeLiveRegion: false,
	            liveMsg: {
	                none: 'No suggestions found.',
	                one: 'One suggestion found. Use up and down keys to navigate.',
	                multiple: 'Multiple suggestions found. Use up and down keys to navigate.'
	            }
			},
			eventConfig: {
				input: {
					onObjClick: function(e, obj){},
					onObjFocus: function(e, obj){
						var list = obj.find('.' + CONSTANTS.itemList)

						if(!list.is(':visible')){
							autocomplete.closeAllAutocompletes()
						}

	                    if (list.length > 0) {
	                        list.fadeIn('fast')
	                    }
					},
					onObjBlur: function(e, obj){},
					onObjKeydown: function(e, obj){
						switch (e.which) {
	                        case keyCodes.TAB:
	                            return autocomplete.cancel(obj)
	                        case keyCodes.ESCAPE:
	                            return autocomplete.cancel(obj)
	                        case keyCodes.UP:
	                        case keyCodes.DOWN:
								e.preventDefault()
								return autocomplete.changeSelection(obj, e.which === keyCodes.UP ? -1 : 1)
	                        case keyCodes.ENTER:
	                            return autocomplete.cancel(obj)
	                        default:
	                            delay(function(){
									if(opts.dataConfig.type === 'url'){
										dataMethods.getData.url(e.target.value, obj)
									} else {
										builders.generateListContainer(dataMethods.processList(e.target.value, obj), obj)
									}
							  }, opts.dataConfig.timer)
                        }
					}
				},
				cancel: {
					onObjClick: function(e, obj){
						autocomplete.cancel(obj)
						builders.clearListItems(obj)
					},
					onObjFocus: function(e, obj){
						autocomplete.cancel(obj)
					},
					onObjBlur: function(e, obj){},
					onObjKeydown: function(e, obj){}
				},
				listItems: {
					onObjClick: function(e, obj){
						if(!opts.templates.listItems.includeLinks) {
							autocomplete.populateValue(e, obj)
							autocomplete.cancel(obj)
						}
					},
					onObjFocus: function(e, obj){
						autocomplete.populateValue(e, obj)
					},
					onObjBlur: function(e, obj){},
					onObjKeydown: function(e, obj){
						var input = obj.find('.' + CONSTANTS.inputClass)

						switch (e.which) {
							case keyCodes.ESCAPE:
								input.focus()
								return autocomplete.cancel(obj)
							case keyCodes.UP:
							case keyCodes.DOWN:
								e.preventDefault();
								return autocomplete.changeSelection(obj, e.which === keyCodes.UP ? -1 : 1);
							case keyCodes.ENTER:
								if(opts.templates.listItems.includeLinks) {
									$(this)[0].click();
									return false;
								} else {
									e.preventDefault();
									input.focus();
									$(this).click();
									return autocomplete.cancel(obj);
								}
							case keyCodes.TAB:
								e.preventDefault()
								input.next().focus()
								return false;
							default:
								return false
						}
					}
				},
				form: {
					onObjSubmit: function(e, obj){}
				}
			}
		}

		/*****************************************/
		/* PRIVATE VARIABLES */
		/*****************************************/
		var logging = {
			missingArgs: 'Missing arguments',
			noResponse: 'Failed to load response'
		}
		var opts = $.extend(true, {}, defaults, options);

		/*****************************************/
		/* PRIVATE FUNCTIONS */
		/*****************************************/
		var delay = (function(){
          var timer = 0;
          return function(callback, ms){
            clearTimeout (timer)
            timer = setTimeout(callback, ms)
          };
        })();

		if (!String.format) {
		  String.format = function(format) {
		    var args = Array.prototype.slice.call(arguments, 1);
		    return format.replace(/{(\d+)}/g, function(match, number) {
		      return typeof args[number] != 'undefined'
		        ? args[number]
		        : match
		      ;
		    });
		  };
		}

		var templates = {
			form: {
				default: function(obj, identifier){
					var form = $('<form></form>', {
		                'name': opts.templates.form.name + '-' + identifier,
		                'id': opts.templates.form.name + '-' + identifier,
						'class': CONSTANTS.formClass,
		                'action': opts.templates.form.action,
		                'method': opts.templates.form.method
		            });

					if(opts.templates.form.action !== ''){
						form.attr('action', opts.templates.form.action);
					}

					$('<label></label>', {
						'for': opts.templates.form.inputName + '-' + identifier,
						'html': opts.templates.form.label,
						'class': (opts.templates.form.hideLabelText ?  opts.ariaConfig.srHiddenClass : '')
					}).appendTo(form);

		            var inputSpan = $('<span></span>', {
						'class': 'findItFast-input-span'
					}).appendTo(form);

					var input = $('<input />', {
						'type': 'search',
						'id': opts.templates.form.inputName + '-' + identifier,
						'name': opts.templates.form.inputName,
						'class': CONSTANTS.inputClass,
						'role': 'combobox',
						'autocomplete': 'off',
						'aria-autocomplete': 'list',
						'aria-owns': 'ul-'+CONSTANTS.itemList + '-' + identifier,
						'aria-expanded': false,
						'aria-activedescendant': 'false',
						'placeholder': opts.templates.form.placeholder
					});

					if(opts.templates.form.inputClass !== ''){
						input.addClass(opts.templates.form.inputClass); /* add optional class */
					}

					input.appendTo(inputSpan);

		            var clearBtn = $('<button></button>', {
						'type': 'reset',
						'class': CONSTANTS.cancelClass,
						'html': opts.templates.form.clearSearchHtml
					}).appendTo(inputSpan);

					$('<span></span>', {
						'class': opts.ariaConfig.srHiddenClass,
						'html': opts.templates.form.clearSearchAriaText
					}).appendTo(clearBtn);

					if(opts.templates.form.includeSubmit) {
			            $('<button></button>', {
							'type': 'submit',
							'html': opts.templates.form.submitHtml + (opts.templates.form.submitType === 'icon' ? '<span class="'+ opts.ariaConfig.srHiddenClass +'">'+ opts.templates.form.submitAriaText +'</span>' : '')
						}).appendTo(form);
					}

		            var listContainer = $('<div></div>', {
						'id': CONSTANTS.itemList + '-' + identifier,
						'class': CONSTANTS.itemList + ' ' + opts.templates.listItems.position
					}).appendTo(form);

					$('<ul></ul>', {
						'id': 'ul-' + CONSTANTS.itemList + '-' + identifier,
						'role': 'listbox'
					}).appendTo(listContainer);

					return form;
				}
			},
			listItems: {
				type: {
					list: function(){
						return '<li id="'+ opts.templates.listItems.className +'{1}" class="'+ opts.templates.listItems.className +'" role="option" aria-selected="false" tabindex="0">{0}</li>';
					},
					links: function(){
						return '<li class="link-based"><a href="{2}" id="'+ opts.templates.listItems.className +'{1}" class="'+ opts.templates.listItems.className +'" role="option" aria-selected="false">{0}</a></li>';
					}
				},
				processArray: function(list, obj){
					var finalList = []
					for(var i=0; i < list.length; i++){
						var listLI = $(String.format(templates.listItems.type.list(), list[i], i));

						finalList.push(listLI);
					}

					return finalList;
				},
				processJson: function(list, obj){
					var finalList = [];
					$.each(list, function(key, value){
						var listLI;

						if(opts.templates.listItems.includeLinks) {
							listLI = $(String.format(templates.listItems.type.links(), value[opts.dataConfig.key], key, value[opts.dataConfig.href]));
						} else {
							listLI = $(String.format(templates.listItems.type.list(), value[opts.dataConfig.key], key));
						}

						finalList.push(listLI);
					})

					return finalList;
				}
			}
		}

		var builders = {
			generateForm: function(obj, identifier){
				return templates.form.default(obj, identifier);
			},
			generateList: function(list, obj){
				var listUL = obj.find('.' + CONSTANTS.itemList + ' ul');

	            if(list.length === 0) {
	                listUL.append('<li>'+ opts.ariaConfig.liveMsg.none +'</li>');
	            } else {
					switch(opts.templates.listItems.type){
						case 'json' || 'url':
							listUL.append(templates.listItems.processJson(list, obj));
							break;
						case 'array':
							listUL.append(templates.listItems.processArray(list, obj));
							break;
						default:
							return [];
					}
	            }

	            return listUL;
			},
			generateListContainer:  function(list, obj){
				builders.clearListItems(obj);

				var listContainer = obj.find('.' + CONSTANTS.itemList);
	            listContainer.hide();

	            if(list !== undefined) {
	                ariaRoles.updateRegion(list);

	                listContainer.append(builders.generateList(list, obj));
	                listContainer.fadeIn('fast');
	            }
			},
			clearListItems: function(obj){
				var listContainer = obj.find('.' + CONSTANTS.itemList);
				listContainer.find('li').remove();
			},
			attachEvents: {
				form: function(obj) {
					var formToAttach = obj.find('form');

					formToAttach.on('submit', function(e, obj){
						opts.eventConfig.form.onObjSubmit(e, obj);
					})
				},
				input: function(obj){
					var inputToAttach = obj.find('.' + CONSTANTS.inputClass);

					inputToAttach.on('keydown', function(e){
						opts.eventConfig.input.onObjKeydown(e, obj);
					})
					.on('focus', function(e){
						opts.eventConfig.input.onObjFocus(e, obj);
					})
					.on('blur', function(e){
						opts.eventConfig.input.onObjBlur(e, obj);
					})
					.on('click', function(e){
						opts.eventConfig.input.onObjClick(e, obj);
					})
				},
				cancel: function(obj){
					var cancelToAttach = obj.find('.' + CONSTANTS.cancelClass);

					cancelToAttach.on('click', function(e){
						opts.eventConfig.cancel.onObjClick(e, obj);
					})
					.on('focus', function(e){
						opts.eventConfig.cancel.onObjFocus(e, obj);
					})
					.on('blur', function(e){
						opts.eventConfig.cancel.onObjBlur(e, obj);
					})
					.on('keydown', function(e){
						opts.eventConfig.cancel.onObjKeydown(e, obj);
					})
				},
				listItems: function(obj, className){
					var classToAttach = '.' + className;

					obj.on('click', classToAttach, function(e){
						opts.eventConfig.listItems.onObjClick(e, obj);
					})
					.on('focus', classToAttach, function(e){
						opts.eventConfig.listItems.onObjFocus(e, obj);
					})
					.on('blur', classToAttach, function(e){
						opts.eventConfig.listItems.onObjBlur(e, obj);
					})
					.on('keydown', classToAttach, function(e){
						opts.eventConfig.listItems.onObjKeydown(e, obj);
					})
				}
			}
		}

		var dataMethods = {
			getData: {
				json: function(query){
		             if(query !== ''){
				 	 	var data = opts.dataConfig.src;
						var dataValue = opts.dataConfig.key;

						 return data.filter(function(item) {
		                     return item[dataValue].toLowerCase().indexOf(query.toLowerCase()) > -1;
		                 });
		             }
				},
				array: function(query){
					if(query !== ''){
					   var data = opts.dataConfig.src;

						return data.filter(function(item) {
							return item.toLowerCase().indexOf(query.toLowerCase()) > -1;
						});
					}
				},
				url: function(query, obj){
					var form = obj.find('form');
					$.ajax({
						url: opts.dataConfig.src,
						data: form.serialize(),
						dataType: 'json',
						type: 'get'
					})
					.done(function(data) {
						if(data){
							builders.generateListContainer(data, obj)
						}
					})
					.fail(function() {
						console.log(logging.noResponse)
					})
					.always(function() {

					});
				}
			},
			processList: function(query, obj){
				if(query.length && opts.dataConfig.src) {
					var finalResults;

					switch(opts.dataConfig.type){
					   case 'array':
						   finalResults = dataMethods.getData.array(query, obj);
						   break;
					   case 'json':
						   finalResults = dataMethods.getData.json(query, obj);
						   break;
					   default:
						   finalResults = [];
				   }

					if(finalResults !== undefined) {
						//take the first number (maxItems) of items from the list
						if(opts.dataConfig.maxItems !== null && opts.dataConfig.maxItems > 0){
							finalResults.slice(0, opts.dataConfig.maxItems);
						}
					}

					return finalResults;

				} else {
					console.log(logging.missingArgs);
				}
			}
		}

		var ariaRoles = {
			createRegion: function(){
				if(opts.ariaConfig.includeLiveRegion && $('#findItFast-live-region').length === 0) {
		            $('<div></div>', {
		                'id': 'findItFast-live-region',
		                'aria-live': 'polite',
						'class': opts.ariaConfig.srHiddenClass,
						'html': '<span></span>'
		            }).prependTo('body');
		        }
			},
			updateRegion: function(list){
				var liveArea = $('body').find('#findItFast-live-region span');

                if(liveArea !== undefined){
                    liveArea.text('');
                    switch(list.length) {
                        case 0:
                          liveArea.text(opts.ariaConfig.liveMsg.none);
                          break;
                        case 1:
                          liveArea.text(opts.ariaConfig.liveMsg.one);
                          break;
                        default:
                          liveArea.text(opts.ariaConfig.liveMsg.multiple);
                    }
                }
			}
		}

        var autocomplete = {
            cancel: function(obj){
                var list = obj.find('.' + CONSTANTS.itemList);
                var input = obj.find('.' + CONSTANTS.inputClass);

                list.fadeOut()
                input.attr({'aria-expanded': 'false'})
            },
            changeSelection: function(obj, direction){
                var list = obj.find('.' + CONSTANTS.itemList);

                if(list.length) {
                    var current = list.find('.current');
                    var listItems = list.find('ul li');
                    var input = obj.find('.' + CONSTANTS.inputClass);

					if(opts.templates.listItems.includeLinks){
						listItems = listItems.find('a');
					}

                    $(listItems).attr('aria-selected', false);

                    input.attr('aria-activedescendant', '');

                    if(current.length === 0) {
						var first;
						if(opts.templates.listItems.position === 'top'){
							first = listItems.last();
						} else {
							first = listItems.first();
						}
                        $(first).addClass("current").attr("aria-selected", true).focus();
                        input.attr("aria-activedescendant", first.attr('id'));
                    } else {
						listItems.removeClass('current');

						if(direction === -1 && listItems.index(current) + 1 === 1) {
							input.focus();
						} else if(direction === 1 && listItems.index(current) + 1 === listItems.length){
							input.focus();
						} else {
							var next = listItems.eq(listItems.index(current) + direction);
	                        $(next).addClass("current").attr("aria-selected", true).focus();
	                        input.attr("aria-activedescendant", next.attr('id'));
						}
                    }
                }
            },
			populateValue: function(e, obj){
				var $listItem = $(e.target);
				var $input = $(obj).find('.' + CONSTANTS.inputClass);

				$input.val($listItem.text());
			},
			closeAllAutocompletes: function(){
				$('.findItFast-list').fadeOut('fast');
			}
        }

		function init(ele){
			ariaRoles.createRegion();

			$('html').addClass(opts.initClass);

			$('.'+opts.initClass).on('click', function(e){
				var $target = $(e.target);

				if(!$target.hasClass(CONSTANTS.itemList) && !$target.parents().hasClass(CONSTANTS.itemList) && !$target.is('[id*="'+opts.templates.form.inputName+'"]') && !$target.parents().is('[id*="'+opts.templates.form.inputName+'"]')){
					$('.' + CONSTANTS.itemList).fadeOut();
				}
			})

			var findItTarget = $(ele);
			var identifier = opts.templates.form.name;

			findItTarget.append(builders.generateForm(findItTarget, identifier));

			builders.attachEvents.listItems(findItTarget, opts.templates.listItems.className);
			builders.attachEvents.form(findItTarget);
			builders.attachEvents.input(findItTarget);
			builders.attachEvents.cancel(findItTarget);

			return findItTarget;
		}

		return init(this);
	}
})(jQuery);
