module.exports = function (CSS) {
  var doc = document;

  var buildList = (function () {
    function buildListItem(tag, idx, query, isFirstSecondaryMatch) {
      var li = doc.createElement("li");
      if (isFirstSecondaryMatch) {
        isFirstSecondaryMatch && (li.className = CSS.class.firstSecondaryItem);
      }
      else {
        li.className = CSS.class.primaryItem;
      }
      li.innerHTML = tag.replace(new RegExp("("+query+")", "i"), "<span class=\""+CSS.class.matchingSegment+"\">$1</span>");
      li.setAttribute(CSS.attr.itemValue, escape(tag));
      li.setAttribute(CSS.attr.itemIndex, idx);
      return li;
    }
    return function buildList(list, hits, query) {
      var hitsCount = 0;
      try { hits && (hitsCount = hits.top.length+hits.other.length); }
      catch(err) { return 0; }
      if (0 == hitsCount) { return 0; }
      var topHitsCount = hits.top.length;
      // TODO: Xbrowser Array#forEach
      hits.top.forEach(function (tag, idx) {
        list.appendChild(buildListItem(tag, idx, query));
      });
      hits.other.forEach(function (tag, idx) {
        list.appendChild(buildListItem(tag, topHitsCount+idx, query, 0==idx));
      });
      return hitsCount;
    };
  }());

  function scrollIntoViewIfNeeded(item) {
    var parent = item.parentNode;
    if (!item.previousSibling) { return parent.scrollTop = 0; }
    if (!item.nextSibling) { return parent.scrollTop = parent.clientHeight - parent.scrollTop; }
    var y0 = parent.scrollTop, y1 = y0 + parent.clientHeight
      , itemTop = item.offsetTop, itemBottom = itemTop + item.clientHeight;
    if (itemTop < y0) { parent.scrollTop -= y0-itemTop; }
    else if (itemBottom > y1) { parent.scrollTop += itemBottom - y1; }
  }

  function Ui(widgetId, input) {
    var instance = this;
    instance.input = input;
    instance.widgetId = widgetId;
    input.setAttribute(CSS.attr.widgetId, instance.widgetId);
    input.setAttribute("autocomplete", "off");
    var list = instance.list = doc.createElement("ul");
    list.setAttribute(CSS.attr.widgetId, instance.widgetId);
    list.className = CSS.class.widget;
  }

  Ui.prototype = {
    "constructor": Ui
    , "attach": function () {
        var instance = this;
        instance.input.parentNode.appendChild(instance.list);
      }
    , "getQuery": function () {
        return this.input.value.replace(/^\s+(.+)$/, "$1").replace(/^(\S+)\s+$/, "$1");
      }
    , "focus": function () {
        // TODO: Xbrowser querySelector
        var firstItem = this.list.querySelector("li");
        firstItem && firstItem.focus();
      }
    , "focusIdx": function (idx) {
        var elems = this.list.querySelectorAll("li")
          , lastIdx = elems.length-1;
        if (0 > idx) {idx = lastIdx; }
        else if (idx > lastIdx) { idx = 0; }
        var alreadyFocused = this.list.querySelector("li."+CSS.class.itemSelected);
        if (alreadyFocused) {
          alreadyFocused.className = alreadyFocused.className.replace(new RegExp("\\b"+CSS.class.itemSelected+"\\b"), "");
        }
        var item = elems[idx];
        item.className += " "+CSS.class.itemSelected;
        scrollIntoViewIfNeeded(item);
        return idx;
      }
    , "itemAt": function (idx) {
        return this.list.querySelectorAll("li")[idx];
      }
    , "focusInput": function () {
        this.input.focus();
      }
    , "setText": function (text) {
        var instance = this;
        instance.input.value = text;
        instance.input.select();
      }
    , "render": function (hits, query) {
        var instance = this;
        instance.list.innerHTML = "";
        var nrOfItemsRendered = buildList(instance.list, hits, query)
          , matches = 0 < nrOfItemsRendered;
        instance.list.setAttribute(CSS.attr.noMatches, !matches);
        matches && instance.focusIdx(0);
        return matches;
      }
  };

  return Ui;

};
