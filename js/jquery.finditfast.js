/**
 Find-It-Fast Autocomplete Search with Accessibility

 Generates an accessible form and autocomplete list

 Options: OPTIONAL, unless otherwise indicated
 - defaults
 	- dataConfig (string)
 		- type (string) - json, array or url (assumes json response)
 		- src (json, array or url of data)
 		- valueName (string - name of 'key' in JSON response to be displayed)
 		- maxItems (number - maximum number of items allowed in autocomplete)
 		- timer (number - ms delay after typing stops before data retrieval)
	- initClass (string - class name attached to HTML tag for reference)
 	- templates
	 	-form
		 	- method (string)
		 	- action (string)
		 	- name (string) -- REQUIRED, unique
	 		- label (string)
	 		- hideLabelText (boolean)
	 		- placeholder (string)
	 		- inputName (string) -- use argument name for ajax if selecting url for dataConfig.type
		 	- inputClass (string)
		 	- clearSearchHtml (string)
		 	- clearSearchAriaText (string)
		 	- submitType (string) -- 'text' or 'icon' - choosing icon will render 'submitAriaText'
		 	- submitHtml (string) text or icon html
		 	- submitAriaText (string)
	 	- listItems
		 	- type: (string) 'json', 'array'
		 	- includeLinks (boolean) - uses <a> tags for listItems
		 	- className (string)
	- ariaConfig
			- srHiddenClass (string)
			- includeLiveRegion (boolean) -- should be a live region somewhere on page whether your or this version (NOTE: only renders once if 'true' is selected)
			- liveMsg -- messages that screen reader reads when search results are resurned
				- none (string)
				- one (string)
				- multiple (string)
	- eventConfig
			- input -- search field
				- onObjClick (callback)
				- onObjFocus (callback)
				- onObjBlur (callback)
				- onObjKeydown (callback)
			- cancel -- search reset button
				- onObjClick (callback)
				- onObjFocus (callback)
				- onObjBlur (callback)
			- listItems -- each search result
				- onObjClick (callback)
				- onObjFocus (callback)
				- onObjBlur (callback)
				- onObjKeydown (callback)
			- form -- form actions
				- onObjSubmit (callback)
				- onObjClick (callback)
				- onObjFocus (callback)
				- onObjBlur (callback)
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
                type: 'json', /* 'json' object, single 'array', or ajax 'url' - form is serialized and params are passed to ajax url */
                src: null,
                valueName: null,
				valueHref: null,
				maxItems: null,
	            timer: 500
            },
            initClass: 'findItFast-js',
            templates: {
				form: {
					method: 'get',
	                action: '',
	                name: '', /* required, unique */
	                label: 'Search',
					hideLabelText: false,
	                placeholder: '',
	                inputName: 'q',
					inputClass: '',
	                clearSearchHtml: 'X',
					clearSearchAriaText: 'Clear search',
					submitType: 'text', /* 'text' or 'icon' - icon will render 'submitAriaText' */
					submitHtml: 'Submit', /* text or icon html */
					submitAriaText: 'Submit'
	            },
				listItems: {
					type: 'json', /* 'json', 'array' */
					includeLinks: false,
					className: 'findItFast-item'
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
						autocomplete.closeAllAutocompletes()
						var list = obj.find('.' + CONSTANTS.itemList)

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
	                            return autocomplete.changeSelection(obj, e.which === keyCodes.UP ? -1 : 1)
	                        case keyCodes.ENTER:
	                            return autocomplete.cancel(obj)
	                        default:
	                            delay(function(){
								  builders.generateListContainer(dataMethods.processList(e.target.value, obj), obj)
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
					onObjBlur: function(e, obj){}
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
								return autocomplete.changeSelection(obj, e.which === keyCodes.UP ? -1 : 1)
							case keyCodes.ENTER:
								if(!opts.templates.listItems.includeLinks) {
									input.focus()
									$(this).click()
									return autocomplete.cancel(obj)
								} else {
									$(this)[0].click()
								}
							case keyCodes.TAB:
								e.preventDefault()
								input.next().focus()
							default:
								return false
						}
					}
				},
				form: {
					onObjSubmit: function(e, obj){
						e.preventDefault()
					},
					onObjFocus: function(e, obj){},
					onObjBlur: function(e, obj){}
				}
			}
		}

		/*****************************************/
		/* PRIVATE VARIABLES */
		/*****************************************/

		var opts = $.extend(true, {}, defaults, options)

		//var tagClassRE = /^[A-Za-z][-_A-Za-z0-9]+$/;

		// validate all options
		// $.each(opts, function validateOptions(key, val) {
		// 	if (key === 'wrapper' || key === 'caption') {
		// 		if (typeof val.tag !== 'string' || val.tag.match(tagClassRE) === null) {
		// 			opts[key]['tag'] = defaults[key]['tag'];
		// 		}
		// 		if (typeof val.class !== 'string' || val.class.match(tagClassRE) === null) {
		// 			opts[key]['class'] = defaults[key]['class'];
		// 		}
		// 	}
		// });

		var currentId = ''
		var logging = {
			missingArgs: 'Missing arguments',
			noResponse: 'Failed to load response'
		}

		/*****************************************/
		/* PRIVATE FUNCTIONS */
		/*****************************************/
		var delay = (function(){
          var timer = 0;
          return function(callback, ms){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
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
		            })

					$('<label></label>', {
						'for': opts.templates.form.inputName + '-' + identifier,
						'html': opts.templates.form.label,
						'class': (opts.templates.form.hideLabelText ?  opts.ariaConfig.srHiddenClass : '')
					}).appendTo(form)

		            var inputSpan = $('<span></span>', {
						'class': 'findItFast-input-span'
					}).appendTo(form)

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
					})

					if(opts.templates.form.inputClass !== ''){
						input.addClass(opts.templates.form.inputClass) /* add optional class */
					}

					input.appendTo(inputSpan)

		            var clearBtn = $('<button></button>', {
						'type': 'reset',
						'class': CONSTANTS.cancelClass,
						'html': opts.templates.form.clearSearchHtml
					}).appendTo(inputSpan)

					$('<span></span>', {
						'class': opts.ariaConfig.srHiddenClass,
						'html': opts.templates.form.clearSearchAriaText
					}).appendTo(clearBtn)

		            $('<button></button>', {
						'type': 'submit',
						'html': opts.templates.form.submitHtml + (opts.templates.form.submitType === 'icon' ? '<span class="'+ opts.ariaConfig.srHiddenClass +'">'+ opts.templates.form.submitAriaText +'</span>' : '')
					}).appendTo(form)

		            var listContainer = $('<div></div>', {
						'id': CONSTANTS.itemList + '-' + identifier,
						'class': CONSTANTS.itemList
					}).appendTo(form)

					$('<ul></ul>', {
						'id': 'ul-' + CONSTANTS.itemList + '-' + identifier,
						'role': 'listbox'
					}).appendTo(listContainer)

					return form
				},
				attachEvents: {
					form: function(obj) {
						var formToAttach = obj.find('form')

						formToAttach.on('submit', function(e, obj){
							opts.eventConfig.form.onObjSubmit(e, obj)
						})
						.on('focus', function(e, obj){
							opts.eventConfig.form.onObjFocus(e, obj)
						})
						.on('blur', function(e, obj){
							opts.eventConfig.form.onObjBlur(e, obj)
						})
					},
					input: function(obj){
						var inputToAttach = obj.find('.' + CONSTANTS.inputClass)

						inputToAttach.on('keydown', function(e){
							opts.eventConfig.input.onObjKeydown(e, obj)
		                })
		                .on('focus', function(e){
							opts.eventConfig.input.onObjFocus(e, obj)
		                })
						.on('blur', function(e){
							opts.eventConfig.input.onObjBlur(e, obj)
		                })
						.on('click', function(e){
							opts.eventConfig.input.onObjClick(e, obj)
		                })
					},
					cancel: function(obj){
						var cancelToAttach = obj.find('.' + CONSTANTS.cancelClass)

						cancelToAttach.on('click', function(e){
							opts.eventConfig.cancel.onObjClick(e, obj)
		                })
						.on('focus', function(e){
		                    opts.eventConfig.cancel.onObjFocus(e, obj)
		                })
						.on('blur', function(e){
		                    opts.eventConfig.cancel.onObjBlur(e, obj)
		                })
					}
				}
			},
			listItems: {
				type: {
					list: function(){
						return '<li id="'+ opts.templates.listItems.className +'{1}" class="'+ opts.templates.listItems.className +'" role="option" aria-selected="false" tabindex="0">{0}</li>'
					},
					links: function(){
						return '<li class="link-based"><a href="{2}" id="'+ opts.templates.listItems.className +'{1}" class="'+ opts.templates.listItems.className +'" role="option" aria-selected="false">{0}</a></li>'
					}
				},
				attachEvents: function(obj, className){
					var classToAttach = '.' + className

					obj.on('click', classToAttach, function(e){
						opts.eventConfig.listItems.onObjClick(e, obj)
					})
					.on('focus', classToAttach, function(e){
						opts.eventConfig.listItems.onObjFocus(e, obj)
					})
					.on('blur', classToAttach, function(e){
						opts.eventConfig.listItems.onObjBlur(e, obj)
					})
					.on('keydown', classToAttach, function(e){
						opts.eventConfig.listItems.onObjKeydown(e, obj)
					})
				},
				processArray: function(list, obj){
					var finalList = []
					for(var i=0; i < list.length; i++){
						var listLI = $(String.format(templates.listItems.type.list(), list[i], i))

						finalList.push(listLI)
					}

					return finalList
				},
				processJson: function(list, obj){
					var finalList = []
					$.each(list, function(key, value){
						var listLI

						if(opts.templates.listItems.includeLinks) {
							listLI = $(String.format(templates.listItems.type.links(), value[opts.dataConfig.valueName], key, value[opts.dataConfig.valueHref]))
						} else {
							listLI = $(String.format(templates.listItems.type.list(), value[opts.dataConfig.valueName], key))
						}

						finalList.push(listLI)
					})

					return finalList
				}
			}
		}

		var builders = {
			generateForm: function(obj, identifier){
				return templates.form.default(obj, identifier)
			},
			generateList: function(list, obj){
				var listUL = obj.find('.' + CONSTANTS.itemList + ' ul')

	            if(list.length === 0) {
	                listUL.append('<li>'+ opts.ariaConfig.liveMsg.none +'</li>')
	            } else {
					switch(opts.templates.listItems.type){
						case 'json' || 'url':
							listUL.append(templates.listItems.processJson(list, obj))
							break;
						case 'array':
							listUL.append(templates.listItems.processArray(list, obj))
							break;
						default:
							return []
					}
	            }

	            return listUL
			},
			generateListContainer:  function(list, obj){
				builders.clearListItems(obj)

				var listContainer = obj.find('.' + CONSTANTS.itemList)
	            listContainer.hide()

	            if(list !== undefined) {
	                ariaRoles.updateRegion(list)

	                listContainer.append(builders.generateList(list, obj))
	                listContainer.fadeIn('fast')
	            }
			},
			clearListItems: function(obj){
				var listContainer = obj.find('.' + CONSTANTS.itemList)
				listContainer.find('li').remove()
			}
		}

		var dataMethods = {
			getData: {
				json: function(query){
		             if(query !== ''){
				 	 	var data = opts.dataConfig.src
						var dataValue = opts.dataConfig.valueName

						 return data.filter(function(item) {
		                     return item[dataValue].toLowerCase().indexOf(query.toLowerCase()) > -1
		                 })
		             }
				},
				array: function(query){
					if(query !== ''){
					   var data = opts.dataConfig.src

						return data.filter(function(item) {
							return item.toLowerCase().indexOf(query.toLowerCase()) > -1
						})
					}
				},
				url: function(query, obj){
					var form = obj.find('form')
					$.ajax({
						url: opts.dataConfig.src,
						data: form.serialize(),
						dataType: 'json',
						type: 'get'
					})
					.done(function(data) {
						return data
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
					var finalResults

					switch(opts.dataConfig.type){
					   case 'url':
						   finalResults = dataMethods.getData.url(query, obj)
						   break;
					   case 'array':
						   finalResults = dataMethods.getData.array(query, obj)
						   break;
					   case 'json':
						   finalResults = dataMethods.getData.json(query, obj)
						   break;
					   default:
						   finalResults = []
				   }

					if(finalResults !== undefined) {
						//take the first number (maxItems) of items from the list
						if(opts.dataConfig.maxItems !== null && opts.dataConfig.maxItems > 0){
							finalResults.slice(0, opts.dataConfig.maxItems)
						}
					}

					return finalResults

				} else {
					console.log(logging.missingArgs)
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
		            }).prependTo('body')
		        }
			},
			updateRegion: function(list){
				var liveArea = $('body').find('#findItFast-live-region span')

                if(liveArea !== undefined){
                    liveArea.text('')
                    switch(list.length) {
                        case 0:
                          liveArea.text(opts.ariaConfig.liveMsg.none)
                          break;
                        case 1:
                          liveArea.text(opts.ariaConfig.liveMsg.one)
                          break;
                        default:
                          liveArea.text(opts.ariaConfig.liveMsg.multiple)
                    }
                }
			}
		}

        var autocomplete = {
            cancel: function(obj){
                var list = obj.find('.' + CONSTANTS.itemList)
                var input = obj.find('.' + CONSTANTS.inputClass)

                list.fadeOut()
                input.attr({'aria-expanded': 'false'})
            },
            changeSelection: function(obj, direction){
                var list = obj.find('.' + CONSTANTS.itemList)

                if(list.length) {
                    var current = list.find('.current')
                    var listItems = list.find('ul li')
                    var input = obj.find('.' + CONSTANTS.inputClass)

					if(opts.templates.listItems.includeLinks){
						listItems = listItems.find('a')
					}

                    $(listItems).attr('aria-selected', false)

                    input.attr('aria-activedescendant', '')

                    if(current.length === 0) {
                        var first = listItems.first()
                        $(first).addClass("current").attr("aria-selected", true).focus()
                        input.attr("aria-activedescendant", first.attr('id'))
                    } else {
						listItems.removeClass('current')
						if(direction === -1 && listItems.index(current) + 1 === 1) {
							input.focus()
						} else if(direction === 1 && listItems.index(current) + 1 === listItems.length){
							listItems.first().focus()
						} else {
							var next = listItems.eq(listItems.index(current) + direction)
	                        $(next).addClass("current").attr("aria-selected", true).focus()
	                        input.attr("aria-activedescendant", next.attr('id'))
						}
                    }
                }
            },
			populateValue: function(e, obj){
				var $listItem = $(e.target)
				var $input = $(obj).find('.' + CONSTANTS.inputClass)

				$input.val($listItem.text())
			},
			closeAllAutocompletes: function(){
				$('.findItFast-list').fadeOut('fast')
			}
        }

		function init(findItTargets){
			ariaRoles.createRegion()

			$('html').addClass(opts.initClass)

			$('.'+opts.initClass).on('click', function(e){
				var $target = $(e.target)

				if(!$target.hasClass(CONSTANTS.itemList) && !$target.parents().hasClass(CONSTANTS.itemList) && !$target.is('[id*="'+opts.templates.form.inputName+'"]') && !$target.parents().is('[id*="'+opts.templates.form.inputName+'"]')){
					$('.' + CONSTANTS.itemList).fadeOut()
				}

				// var $target = $(e.target)
				// var parentList = $target.parents('.'+CONSTANTS.itemList)
				// var currentInput = parentList.find('.' + CONSTANTS.inputClass)
				//
				// if(!$target.hasClass(CONSTANTS.itemList) && !$target.parents().hasClass(CONSTANTS.itemList) && !$target.is(currentInput) && !$target.parents().is(parentList)){
				// 	$('.'+CONSTANTS.itemList).fadeOut()
				// }
			})



			return findItTargets.each(function(index, ele) {
				var findItTarget = $(ele)
				var identifier = ''

				if(currentId === opts.templates.form.name){
					identifier = index
				} else {
					identifier = opts.templates.form.name
					currentId = opts.templates.form.name
				}

				findItTarget.append(builders.generateForm(findItTarget, identifier))

				templates.listItems.attachEvents(findItTarget, opts.templates.listItems.className)
				templates.form.attachEvents.form(findItTarget)
				templates.form.attachEvents.input(findItTarget)
				templates.form.attachEvents.cancel(findItTarget)
			})
		}

		return init(this)
	}
})(jQuery);
