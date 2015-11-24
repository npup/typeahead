var debounce = require("limiter").debounce;

module.exports = function (globals) {

var CSS = globals.CSS
  , widgets = globals.widgets
  , doc = globals.doc;

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


  function setText(widget, item) {
    widget.setText(unescape(item.getAttribute(CSS.attr.itemValue)));
  }

  var findListItem = (function () {
    var expr = new RegExp("\\b"+CSS.className.widget+"\\b");
    function isListItem(elem) { return elem && elem.parentNode && expr.test(elem.parentNode.className); }
    return function findListItem(elem) {
      if (isListItem(elem)) { return elem; }
      if (isListItem(elem = elem.parentNode)) { return elem; }
      return null;
    };
  }());

  var keyHandlers = (function () {

    var keys = {
      "27": function (widget) { // ESC
          widget.close();
          widget.focusInput();
          return true;
        }
      , "13": function (widget) { // ENTER
          var itemSelected = widget.getCurrentItem();
          itemSelected && setText(widget, itemSelected);
        }
      , "9": function (widget, event, isShift) { // TAB
          if (!widget.open) { return true; }
          if (isShift) { widget.close(); return true; }
          var itemSelected = widget.getCurrentItem();
          itemSelected && setText(widget, itemSelected);
        }
      , "38": function (widget) { // UP
          widget.focusItem(widget.selectedIndex-1);
        }
      , "40": function (widget) { // DOWN
          widget.focusItem(widget.selectedIndex+1);
        }
    };

    function normalKeys(keyCode, xhrEnabled) {
      // "special keys" are handled elsewhere
      if (keyCode in keys) { return; }
      var widget = findWidget();
      if (!widget || !!widget.options.searchUrl!=xhrEnabled) { return; }
      widget.update();
    }

    function specialKeys(e) {
      var widget = findWidget(true)
        , isShift = e.shiftKey, keyCode = e.keyCode;
      if (!(widget && "function"==typeof keys[keyCode])) { return; }
      if (!keys[keyCode](widget, e, isShift)) {
        if (e.preventDefault) { e.preventDefault(); }
        else { e.returnValue = false; }
      }
    }
    return {
      "special": specialKeys
      , "xhrEnabled": function (e) {
          normalKeys(e.keyCode, true);
        }
      , "xhrDisabled": function (e) {
          normalKeys(e.keyCode, false);
        }
    };

  }());

  var touchMove = false;

  var listen = (function () {
    var f;
    if ("addEventListener" in doc.body) {
      f = function (elem, eventName, handler) {
        elem.addEventListener(eventName, handler, false);
      };
    }
    else if ("attachEvent" in doc.body) {
      f = function (elem, eventName, handler) {
        elem.attachEvent("on"+eventName, handler);
      };
    }
    return f;
  }());

  return {
    "init": function () {
      listen(doc, "touchmove", function () { touchMove = true; });
      listen(doc, "touchend", function () { touchMove = false; });
      listen(doc, "mouseover", function (e) {
          if (globals.SCROLL_FLAG) {
            globals.SCROLL_FLAG = false;
            return;
          }
          var tmp = e.target || e.srcElement, itemIdx;
          while (tmp.parentNode) {
            if (itemIdx = tmp.getAttribute(CSS.attr.itemIndex)) { break; }
            tmp = tmp.parentNode;
          }
          if (!tmp || !tmp.parentNode) { return; }
          var widget = findWidget(true, tmp);
          widget && (widget.selectedIndex = widget.focusItem(parseInt(itemIdx, 10)));
        }
      );
      listen(doc, "keyup", debounce(keyHandlers.xhrEnabled, 700));
      listen(doc, "keyup", debounce(keyHandlers.xhrDisabled, 200));
      listen(doc, "keydown", keyHandlers.special);
      listen(doc, "click", function (e) {
          if (touchMove) { return false; }
          var elem = e.target || e.srcElement
            , targetWidget = findWidget(true, elem), widget;
          for (var widgetId in widgets) {
            widget = widgets[widgetId];
            targetWidget==widget || widget.close();
          }
          var listItem = findListItem(elem);
          if (targetWidget && listItem) {
            setText(targetWidget, listItem);
          }
        }
      );
    }

  };

};
