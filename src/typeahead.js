module.exports = function (Ui) {

  function getLocalHits(needle, widget) {
    if (!needle) {return [];}
    var stack = widget.options.tags
      , caseSensitive = widget.options.caseSensitive;
    needle = caseSensitive ? needle : needle.toLowerCase();
    return stack.filter(function (tag) { // TODO: Xbrowser Array#filter
      return needle && -1 < (caseSensitive?tag:tag.toLowerCase()).indexOf(needle);
    });
  }
  function getRemoteHits(query, instance, callback) {
    // TODO: Xbrowser xhr
    var xhr = new XMLHttpRequest;
    xhr.onreadystatechange = function () {
      if (!(4==xhr.readyState && 200==xhr.status)) { return; }
      var hits = [];
      try { hits = JSON.parse(xhr.responseText); }
      catch(err) { /**/ }
      callback(hits);
    };
    xhr.open("GET", instance.options.searchUrl+query, true);
    xhr.send(null);
  }

  var mergeToUniques = (function () {
    function sortAlpha(s0, s1) { return s0.localeCompare(s1); }
    function uniq(arr, found, query) {
      found || (found = {});
      var top = [], other = [], tag;
      for (var idx=0, len=arr.length; idx<len; ++idx) {
        tag = arr[idx];
        if (tag in found) { continue; }
        (0==tag.indexOf(query)?top:other).push(tag);
        found[tag] = true;
      }
      var turn = {"top": top, "other": other, "map": found};
      return turn;
    }
    return function (arr1, arr2, query) {
      var found = {}
        , top = [], other = [];
      // TODO: Xbrowser Array#forEach
      [arr1, arr2].forEach(function (arr) {
        var data = uniq(arr, found, query);
        for (var prop in data.found) { found[prop] = true; }
        top = top.concat(data.top);
        other = other.concat(data.other);
      });
      return {"top": top.sort(sortAlpha), "other": other.sort(sortAlpha)};
    };
  }());

  function source(query, instance, callback) {
    var localHits = getLocalHits(query, instance);
    if (!instance.options.searchUrl) {
      // serving local results
      return void callback(mergeToUniques(localHits, [], query), query);
    }
    // firing ajax call, serve results async
    getRemoteHits(query, instance, function (remoteHits) {
      var hits = mergeToUniques(localHits, remoteHits, query);
      callback(
        hits, query
      );
    });
  }

  function render(widget, query) {
    var matches = widget.ui.render(widget.hits, query);
    widget.open = matches;
    if (matches) { widget.selectedIndex = 0; }
  }

  function Typeahead(input, options) {
    var instance = this;
    instance.options = options;
    instance.id = "typeahead--"+(Math.floor(Math.random()*1e+9)).toString(32)+"-"+(+new Date).toString(32);
    instance.latestXhrTs = 0;
    instance.open = false;
    instance.ui = new Ui(instance.id, input);
    instance.hits = null;
    instance.ui.attach(instance);
    render(instance);
  }

  Typeahead.prototype = {
    "update": function () {
        var instance = this
          , str = instance.getQuery();
        source(str, instance, function (hits, query) {
          instance.hits = hits;
          render(instance, query);
        });
      }
    , "close": function () {
        var instance = this;
        instance.hits = null;
        render(instance);
      }
    , "getQuery": function () {
        return this.ui.getQuery();
      }
    , "focusInput": function () {
        this.ui.focusInput();
      }
    , "focusItem": function (idx) {
        var instance = this;
        return instance.selectedIndex = instance.ui.focusIdx(idx);
      }
    , "getCurrentItem": function () {
        var instance = this;
        return instance.ui.itemAt(instance.selectedIndex);
      }
    , "setText": function (text) {
        var instance = this;
        instance.ui.setText(text);
        instance.close();
      }
  };

  return Typeahead;

};
