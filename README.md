# Find It Fast
A jQuery Search Autocomplete Plugin focused on WAI-ARIA (Accessibility)

## Features
- Meets WAI-ARIA requirements; built-in necessary form input HTML
- Handles JSON objects, arrays and AJAX urls
- Optionally customize callbacks
- Mobile-friendly

## Configuration
OPTIONAL, unless otherwise indicated
- dataConfig
    - type (string) -- `json`, `array`, or `url` (`url` assumes json response. Form is serialized and params are passed to ajax url)
    - src (string) -- json object, array or url of data
    - valueName (string) -- name of 'key' in JSON response to display listItem name
    - valueHref (string) -- name of 'key' in JSON response to display listItem href
    - maxItems (number) -- maximum number of items allowed to display in autocomplete
    - timer (number) -- millisecond delay after typing stops before data retrieval
- initClass (string) -- plugin class name attached to HTML tag for reference
- templates
    - form
        - method (string)
        - action (string)
        - **name (string) -- REQUIRED, unique**
        - label (string)
        - hideLabelText (boolean)
        - placeholder (string)
        - inputName (string) -- use argument name for ajax request if selecting `url` for `dataConfig.type`
        - inputClass (string)
        - clearSearchHtml (string)
        - clearSearchAriaText (string)
        - submitType (string) -- `text` or `icon`, - choosing icon will render `submitAriaText`
        - submitHtml (string) button text or icon html
        - submitAriaText (string)
    - listItems
        - type (string) -- `json`, `array`
        - includeLinks (boolean) -- uses `<a>` tags for listItems, provide `dataConfig.valueHref`
        - className (string) -- additional class name
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
