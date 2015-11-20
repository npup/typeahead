var debounce = require("limiter").debounce;

module.exports = function (findWidget, doc, CSS, widgets) {

  function setText(widget, item) {
    widget.setText(unescape(item.getAttribute(CSS.attr.itemValue)));
  }

  var findListItem = (function () {
    var expr = new RegExp("\\b"+CSS.class.widget+"\\b");
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
        e.preventDefault();
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

  return {
    "init": function () {
          // TODO: Xbrowser addEventListener
      doc.addEventListener("touchmove", function () { touchMove = true; }, false);
      doc.addEventListener("touchend", function () { touchMove = false; }, false);
      doc.addEventListener("mouseover", function (e) {
          var tmp = e.target, itemIdx;
          while (tmp.parentNode) {
            if (itemIdx = tmp.getAttribute(CSS.attr.itemIndex)) { break; }
            tmp = tmp.parentNode;
          }
          if (!tmp || !tmp.parentNode) { return; }
          var widget = findWidget(true, tmp);
          widget && (widget.selectedIndex = widget.focusItem(parseInt(itemIdx, 10)));
        }
        , false
      );
      doc.addEventListener("keyup", debounce(keyHandlers.xhrEnabled, 700), false);
      doc.addEventListener("keyup", debounce(keyHandlers.xhrDisabled, 200), false);
      doc.addEventListener("keydown", keyHandlers.special, false);
      doc.addEventListener("click", function (e) {
        if (touchMove) { return false; }
        var elem = e.target
          , targetWidget = findWidget(true, elem), widget;
        for (var widgetId in widgets) {
          widget = widgets[widgetId];
          targetWidget==widget || widget.close();
        }
        var listItem = findListItem(elem);
        if (targetWidget && listItem) {
          setText(targetWidget, listItem);
        }
      }, false);
    }

  };

};
