module.exports = function (globals) {
  var doc = globals.doc
    , CSS = globals.CSS;

  function setScrollFlag(state) {
    globals.SCROLL_FLAG = 0==arguments.length || !!state;
  }

  var buildList = (function () {
    function buildListItem(tag, idx, query, isFirstSecondaryMatch) {
      var li = doc.createElement("li");
      if (isFirstSecondaryMatch) {
        isFirstSecondaryMatch && (li.className = CSS.className.firstSecondaryItem);
      }
      else {
        li.className = CSS.className.primaryItem;
      }
      li.innerHTML = tag.replace(new RegExp("("+query+")", "i"), "<span class=\""+CSS.className.matchingSegment+"\">$1</span>");
      li.setAttribute(CSS.attr.itemValue, escape(tag));
      li.setAttribute(CSS.attr.itemIndex, idx);
      return li;
    }
    return function buildList(list, hits, query) {
      var hitsCount = 0;
      try { hits && (hitsCount = hits.top.length+hits.other.length); }
      catch(err) { return 0; }
      if (0 == hitsCount) { return 0; }
      var topHitsCount = hits.top.length, tag, idx, len;
      for (idx=0, len=hits.top.length; idx<len; ++idx) {
        tag = hits.top[idx];
        list.appendChild(buildListItem(tag, idx, query));
      }
      for (idx=0, len=hits.other.length; idx<len; ++idx) {
        tag = hits.other[idx];
        list.appendChild(buildListItem(tag, topHitsCount+idx, query, 0==idx));
      }
      return hitsCount;
    };
  }());

  function scrollIntoViewIfNeeded(item) {
    var itemRect = item.getBoundingClientRect(), vpHeight = doc.documentElement.clientHeight
      , outOfBounds = Math.ceil(itemRect.bottom) - vpHeight
      , scrollVp = 0;
    if (0 < outOfBounds) {
      scrollVp = outOfBounds;
    }
    else {
      outOfBounds = Math.ceil(itemRect.top);
      if (0 > outOfBounds) {
        scrollVp = outOfBounds;
      }
    }
    if (scrollVp) {
      setScrollFlag();
      window.scrollBy(0, scrollVp);
    }
    var parent = item.parentNode;
    if (!item.previousSibling) {
      setScrollFlag();
      return parent.scrollTop = 0;
    }
    if (!item.nextSibling) {
      setScrollFlag();
      return parent.scrollTop = parent.clientHeight - parent.scrollTop;
    }
    var y0 = parent.scrollTop, y1 = y0 + parent.clientHeight
      , itemTop = item.offsetTop, itemBottom = itemTop + item.clientHeight;
    if (itemTop < y0) {
      setScrollFlag();
      parent.scrollTop -= y0-itemTop;
    }
    else if (itemBottom > y1) {
      setScrollFlag();
      parent.scrollTop += itemBottom - y1;
    }

  }

  var selectedCSSExpr = new RegExp("\\b"+CSS.className.itemSelected+"\\b");
  function findFocused(list) {
    var items = list.childNodes, item;
    for (var idx=0, len=items.length; idx<len; ++idx) {
      item = items[idx];
      if (selectedCSSExpr.test(item.className)) { return item; }
    }
  }

  function Ui(widgetId, input) {
    var instance = this;
    instance.input = input;
    instance.widgetId = widgetId;
    input.setAttribute(CSS.attr.widgetId, instance.widgetId);
    input.setAttribute("autocomplete", "off");
    var list = instance.list = doc.createElement("ul");
    list.setAttribute(CSS.attr.widgetId, instance.widgetId);
    list.className = CSS.className.widget;
  }

  Ui.prototype = {
    "constructor": Ui
    , "attach": function () {
        var instance = this
          , input = instance.input, list = instance.list
          , parent = input.parentNode;
        if (input.nextElementSibling) {
          parent.insertBefore(list, input.nextElementSibling);
        }
        else {
          parent.appendChild(list);
        }
      }
    , "getQuery": function () {
        return this.input.value.replace(/^\s+(.+)$/, "$1").replace(/^(\S+)\s+$/, "$1");
      }
    , "focus": function () {
        var firstItem = this.list.firstChild;
        firstItem && firstItem.focus();
      }
    , "focusIdx": function (idx) {
        var elems = this.list.childNodes
          , lastIdx = elems.length-1;
        if (0 > idx) {idx = lastIdx; }
        else if (idx > lastIdx) { idx = 0; }
        var alreadyFocused = findFocused(this.list);
        if (alreadyFocused) {
          alreadyFocused.className = alreadyFocused.className.replace(selectedCSSExpr, "");
        }
        var item = elems[idx];
        item.className += " "+CSS.className.itemSelected;
        scrollIntoViewIfNeeded(item);
        return idx;
      }
    , "itemAt": function (idx) {
        return this.list.childNodes[idx];
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
        if (matches) {
          instance.list.style.display = "block";
          instance.focusIdx(0);
        }
        else { instance.list.style.display = ""; }
        return matches;
      }
  };

  return Ui;

};
