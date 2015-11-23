/**
* behaviour:
*
* X  on filtering, top item is selected
* X  arrow up/down/mouse-hover moves selection
* X  mouse hover sets selected item
* X  tab in textfield autocompletes+closes list (currently selected)
* X  enter in textfield autocompletes+closes list (currently selected)
* X  click on item autocompletes+closes list
* X  ESC closes any open list
* X  avoid the long-timed debounce strategy for non-xhr-ed widgets
* X  when selecting an item that is outside the viewport, scroll the viewport to make it visible
* X  support for fireing callback for when something is autocompleted
*
*
*/

var doc = document
  , widgets = {}
  , CSS = {
      "attr": {
          "widgetId": "data-typeahead--id"
          , "itemValue": "data-typeahead--value"
          , "itemIndex": "data-typeahead--index"
          , "noMatches": "data-typeahead--empty"
        }
      , "class": {
          "widget": "typeahead--list"
          , "firstSecondaryItem": "typeahead--first-nontop-item"
          , "primaryItem": "typeahead--top-item"
          , "matchingSegment": "typeahead--matching-segment"
          , "itemSelected": "typeahead--item-selected"
        }
    };

var globals = {
  "SCROLL_FLAG": false
  , "doc": doc
  , "CSS": CSS
  , "widgets": widgets
};

var events = require("./events")(globals)
  , Ui = require("./ui")(globals)
  , Typeahead = require("./typeahead")(Ui);

function init(widget) {
  widgets[widget.id] = widget;
  if (init.done) { return widget; }
  events.init();
  init.done = true;
  return widget;
}

module.exports = {
  "create": function (input, options) {
      var widget = new Typeahead(input, options);
      return init(widget);
    }
};
