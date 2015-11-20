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

function findWidgetForElement(elem) { return elem && elem != doc ? widgets[elem.getAttribute(CSS.attr.widgetId)] : null; }
function findWidget(onlyOpen, elem) {
  var active = elem || doc.activeElement;
  if (!active) { return null; }
  var tmp = active, attr;
  while (tmp && tmp.parentNode && !(attr = tmp.getAttribute(CSS.attr.widgetId))) {
    if (null != attr) { break; }
    tmp = tmp.parentNode;
  }
  var widget = findWidgetForElement(tmp);
  if (!widget) { return null; }
  if (onlyOpen) { return widget.open ? widget : null; }
  return widget;
}

var events = require("./events")(findWidget, doc, CSS, widgets)
  , Ui = require("./ui")(CSS)
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
