/**
 * Find-It-Fast Autocomplete Search with Accessibility
 *
 * Generates an accessible form and autocomplete list
 *
 * Options:
 * - defaults
 * 		- dataConfig (string)
 * 			- type (string - json, array or url)
 * 			- src (json, array or url of data)
 * 			- valueName (string - name of 'key' in JSON response to be displayed)
 * 			- maxItems (number - maximum number of items allowed in autocomplete)
 * 			- timer (number - ms delay after typing stops before data retrieval)
 * 		- initClass (string - class name attached to HTML tag for reference)
 */
(function($) {
	'use strict';

	$.fn.findItFast = function(options){
		/*****************************************/
		/* DEFAULT CONFIGS */
		/*****************************************/
		var defaults = {
            dataConfig: {
                type: 'json', /* 'json' object, single 'array', or ajax 'url' */
                src: null,
                valueName: null,
				valueHref: null,
				maxItems: null,
	            timer: 500
            },
            initClass: 'findItFast-js',
            templates: {
				form: {
	                default: {
						method: 'get',
		                action: '',
		                name: 'findItFast-form',
		                label: 'Search',
		                placeholder: '',
		                inputName: 'q',
						inputClass: 'findItFast-input',
		                clearSearchText: 'Clear search'
					},
					custom: null /*pass function to generate dom object*/
	            },
				listItems: {
					type: 'json', /* 'json', 'array', 'custom' */
					includeLinks: false,
					className: 'findItFast-item',
					custom: null /*pass function to generate dom array*/
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

	                    if (list.length > 0) {
	                        list.show()
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
	                              builders.generateListContainer(dataMethods.processList(e.target.value), obj)
							  }, opts.dataConfig.timer)
                        }
					}
				},
				cancel: {
					onObjClick: function(e, obj){
						autocomplete.cancel(obj)
					},
					onObjFocus: function(e, obj){
						autocomplete.cancel(obj)
					},
					onObjBlur: function(e, obj){}
				},
				// list: {
				// 	onObjFocus: function(e, obj){},
				// 	onObjBlur: function(e, obj){
				// 		autocomplete.cancel(obj)
				// 	}
				// },
				listItems: {
					onObjClick: function(e, obj){
						autocomplete.populateValue(e, obj)
						autocomplete.cancel(obj)
					},
					onObjFocus: function(e, obj){
						autocomplete.populateValue(e, obj)
					},
					onObjBlur: function(e, obj){},
					onObjKeydown: function(e, obj){
						switch (e.which) {
						case keyCodes.ESCAPE:
							obj.find('.' + opts.templates.form.default.inputClass).focus()
							return autocomplete.cancel(obj)
						case keyCodes.UP:
						case keyCodes.DOWN:
							return autocomplete.changeSelection(obj, e.which === keyCodes.UP ? -1 : 1)
						case keyCodes.ENTER:
							$(this).trigger('click')
							obj.find('.' + opts.templates.form.default.inputClass).focus()
							return autocomplete.cancel(obj)
						default:
							return false
						}
					}
				},
				form: {
					onObjSubmit: function(e, obj){
						e.preventDefault()
					},
					onObjClick: function(e, obj){},
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

        var keyCodes = {
            ENTER: 13,
            UP: 38,
            DOWN: 40,
            ESCAPE: 27,
            TAB: 9
        }

		var logging = {
			noData: 'No data available'
		}

		/*****************************************/
		/* PRIVATE FUNCTIONS */
		/*****************************************/
		var CONSTANTS = {
			itemList: 'findItFast-list',
			inputClass: 'findItFast-input'
		}

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
				default: function(obj, index){
					var form = $('<form></form>').attr({
		                'name': opts.templates.form.default.name,
		                'id': opts.templates.form.default.name,
		                'action': opts.templates.form.default.action,
		                'method': opts.templates.form.default.method
		            })

		            var label = $('<label></label>').text(opts.templates.form.default.label)

		            var input = $('<input />')
		            .attr({
		                'type': 'search',
		                'id': opts.templates.form.default.inputName + index,
		                'name': opts.templates.form.default.inputName,
						'class': CONSTANTS.inputClass,
		                'role': 'combobox',
		                'autocomplete': 'off',
		                'aria-autocomplete': 'list',
		                'aria-owns': CONSTANTS.itemList + index,
		                'aria-expanded': false,
		                'aria-activedescendant': 'false',
		                'placeholder': opts.templates.form.default.placeholder
		            })
					.addClass(opts.templates.form.default.inputClass)

		            var inputSpan = $('<span></span>')
		            .addClass('findItFast-input-span')
		            .append(input)

		            var clearSpan = $('<span></span>')
		            .addClass(opts.ariaConfig.srHiddenClass)
		            .text(opts.templates.form.clearSearchText)

		            var clearBtn = $('<button></button>')
		            .attr('type', 'reset')
		            .addClass('findItFast-clear')
		            .text('X')
		            .append(clearSpan)

		            inputSpan.append(clearBtn)

		            label.append(inputSpan)

		            form.append(label)

		            var submitBtn = $('<button></button>')
		            .attr('type', 'submit')
		            .text('Submit')

		            form.append(submitBtn)

		            var listContainer = $('<div></div>')
		            .attr('id', CONSTANTS.itemList + index)
		            .addClass(CONSTANTS.itemList)

		            form.append(listContainer)

					return form
				},
				custom: opts.templates.form.custom,
				attachEvents: {
					form: function(obj) {
						var formToAttach = obj.find('form')

						formToAttach.on('submit', function(e, obj){
							opts.eventConfig.form.onObjSubmit(e, obj)
						})
					},
					input: function(obj){
						var inputToAttach = obj.find('.' + opts.templates.form.default.inputClass)

						inputToAttach.on('keydown', function(e){
							opts.eventConfig.input.onObjKeydown(e, obj)
		                })
		                .on('focus', function(e){
							opts.eventConfig.input.onObjFocus(e, obj)
		                })
					},
					cancel: function(obj){
						var cancelToAttach = obj.find('button[type="reset"]')

						cancelToAttach.on('click', function(e){
							opts.eventConfig.cancel.onObjClick(e, obj)
		                })
						.on('focus', function(e){
		                    opts.eventConfig.cancel.onObjFocus(e, obj)
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
						return '<li><a href="{2}" id="'+ opts.templates.listItems.className +'{1}" class="'+ opts.templates.listItems.className +'" role="option" aria-selected="false">{0}</a></li>'
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
				},
				processCustom: opts.templates.listItems.custom
			}
		}

		var builders = {
			generateForm: function(obj, index){
				if(templates.form.custom !== null) {
					return templates.form.custom
				} else {
					return templates.form.default(obj, index)
				}
			},
			generateList: function(list, obj){
				var listUL = $('<ul></ul>')

	            if(list.length === 0) {
	                listUL.append('<li>'+ opts.ariaConfig.liveMsg.none +'</li>')
	            } else {
					switch(opts.templates.listItems.type){
						case 'json':
							listUL.append(templates.listItems.processJson(list, obj))
							break;
						case 'array':
							listUL.append(templates.listItems.processArray(list, obj))
							break;
						case 'custom':
							listUL.append(templates.listItems.processCustom())
							break;
						default:
							return []
					}

					// listUL.on('focus', function(e, obj){
					// 	opts.eventConfig.list.onObjFocus(e, obj)
					// })
					// .on('blur', function(e, obj){
					// 	opts.eventConfig.list.onObjBlur(e, obj)
					// })
	            }

	            return listUL
			},
			generateListContainer:  function(list, obj){
				var listContainer = obj.find('.' + CONSTANTS.itemList)
	            listContainer.find('ul').remove().hide()

	            if(list !== undefined) {
	                ariaRoles.updateRegion(list)

	                listContainer.append(builders.generateList(list, obj))
	                listContainer.show()
	            }
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
				url: function(query){
					//TODO $.ajax
				}
			},
			processList: function(query){
				if(query.length && opts.dataConfig.src) {
					var finalResults

					switch(opts.dataConfig.type){
					   case 'url':
						   finalResults = dataMethods.getData.url(query)
						   break;
					   case 'array':
						   finalResults = dataMethods.getData.array(query)
						   break;
					   case 'json':
						   finalResults = dataMethods.getData.json(query)
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
					console.log(logging.noData)
				}
			}
		}

		var ariaRoles = {
			createRegion: function(){
				if(opts.ariaConfig.includeLiveRegion && $('#findItFast-live-region').length === 0) {
		            var liveRegion = $('<div></div>')
		            .attr({
		                'id': 'findItFast-live-region',
		                'aria-live': 'polite'
		            })
		            .addClass(opts.ariaConfig.srHiddenClass)
		            .append('<span></span>')

		            $('body').prepend(liveRegion)
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
                var input = obj.find('.' + opts.templates.form.default.inputClass)

                list.hide()
                input.attr({'aria-expanded': 'false'})
            },
            changeSelection: function(obj, direction){
                var list = obj.find('.' + CONSTANTS.itemList)

                if(list.length) {
                    var current = list.find('.current')
                    var listItems = list.find('ul li')
                    var input = obj.find('.' + opts.templates.form.default.inputClass)

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
				var $input = $(obj).find('.' + opts.templates.form.default.inputClass)

				$input.val($listItem.text())
			}
        }

		function init(findItTargets){
			ariaRoles.createRegion()

			$('html').addClass(opts.initClass)

			$('.'+opts.initClass).on('click', function(e){
				var $target = $(e.target)

				if(!$target.hasClass(CONSTANTS.itemList) && !$target.parents().hasClass(CONSTANTS.itemList) && !$target.is('[id*="'+opts.templates.form.default.inputName+'"]') && !$target.parents().is('[id*="'+opts.templates.form.default.inputName+'"]')){
					$('.' + CONSTANTS.itemList).hide()
				}

				// var $target = $(e.target)
				// var parentList = $target.parents('.'+CONSTANTS.itemList)
				// var currentInput = parentList.find('.' + opts.templates.form.default.inputClass)
				//
				// if(!$target.hasClass(CONSTANTS.itemList) && !$target.parents().hasClass(CONSTANTS.itemList) && !$target.is(currentInput) && !$target.parents().is(parentList)){
				// 	$('.'+CONSTANTS.itemList).hide()
				// }
			})



			return findItTargets.each(function(index, ele) {
				var findItTarget = $(ele)

				findItTarget.append(builders.generateForm(findItTarget, index))

				templates.listItems.attachEvents(findItTarget, opts.templates.listItems.className)
				templates.form.attachEvents.form(findItTarget)
				templates.form.attachEvents.input(findItTarget)
				templates.form.attachEvents.cancel(findItTarget)
			})
		}

		return init(this)
	}
})(jQuery);
