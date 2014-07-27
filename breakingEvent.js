
_vents = function() {
  var module = {},
    idCounter = 0,
    uniqueId = function(prefix) {
      var id = ++idCounter + "";
      return prefix ? prefix + id : id
    },
    keys = Object.keys || function(obj) {
      if (obj !== Object(obj))
        throw new TypeError("Invalid object");
      var keys = [];
      for (var key in obj)
        if (hasOwnProperty.call(obj, key))
          keys.push(key);
      return keys
    },
    eventSplitter = /\s+/,
    eventsApi = function(obj, action, name, rest) {
      if (!name)
        return true;
      if (typeof name === "object") {
        for (var key in name) {
          obj[action].apply(obj, [key, name[key]].concat(rest))
        }
        return false
      }
      if (eventSplitter.test(name)) {
        var names = name.split(eventSplitter);
        for (var i = 0, l = names.length; i < l; i++) {
          obj[action].apply(obj, [names[i]].concat(rest))
        }
        return false
      }
      return true
    },
    triggerEvents = function(events, args) {
      var ev, i = -1,
        l = events.length,
        a1 = args[0],
        a2 = args[1],
        a3 = args[2];
      switch (args.length) {
        case 0:
          while (++i < l)
            (ev = events[i]).callback.call(ev.ctx);
          return;
        case 1:
          while (++i < l)
            (ev = events[i]).callback.call(ev.ctx, a1);
          return;
        case 2:
          while (++i < l)
            (ev = events[i]).callback.call(ev.ctx, a1, a2);
          return;
        case 3:
          while (++i < l)
            (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
          return;
        default:
          while (++i < l)
            (ev = events[i]).callback.apply(ev.ctx, args)
      }
    },
    listenMethods = {
      listenTo: "on",
      listenToOnce: "once"
    };
  module.initialize = function(options) {
    $.each(listenMethods, function(method, implementation) {
      module[method] = function(obj, name, callback) {
        var listeners = this._listeners || (this._listeners = {});
        var id = obj._listenerId || (obj._listenerId = uniqueId("l"));
        listeners[id] = obj;
        if (typeof name === "object")
          callback = this;
        obj[implementation](name, callback, this);
        return this
      }
    });
    $.extend(module, {
      on: function(name, callback, context) {
        if (!eventsApi(this, "on", name, [callback, context]) || !callback)
          return this;
        this._events || (this._events = {});
        var events = this._events[name] || (this._events[name] = []);
        events.push({
          callback: callback,
          context: context,
          ctx: context || this
        });
        return this
      },
      once: function(name, callback, context) {
        if (!eventsApi(this, "once", name, [callback, context]) || !callback)
          return this;
        var self = this;
        var once = $.once(function() {
          self.off(name, once);
          callback.apply(this, arguments)
        });
        once._callback = callback;
        return this.on(name, once, context)
      },
      off: function(name, callback, context) {
        var retain, ev, events, names, i, l, j, k;
        if (!this._events || !eventsApi(this, "off", name, [callback, context]))
          return this;
        if (!name && !callback && !context) {
          this._events = {};
          return this
        }
        names = name ? [name] : keys(this._events);
        for (i = 0, l = names.length; i < l; i++) {
          name = names[i];
          if (events = this._events[name]) {
            this._events[name] = retain = [];
            if (callback || context) {
              for (j = 0, k = events.length; j < k; j++) {
                ev = events[j];
                if (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) {
                  retain.push(ev)
                }
              }
            }
            if (!retain.length)
              delete this._events[name]
          }
        }
        return this
      },
      trigger: function(name) {
        if (!this._events)
          return this;
        var args = Array.prototype.slice.call(arguments, 1);
        if (!eventsApi(this, "trigger", name, args))
          return this;
        var events = this._events[name];
        var allEvents = this._events.all;
        if (events)
          triggerEvents(events, args);
        if (allEvents)
          triggerEvents(allEvents, arguments);
        return this
      },
      stopListening: function(obj, name, callback) {
        var listeners = this._listeners;
        if (!listeners)
          return this;
        var deleteListener = !name && !callback;
        if (typeof name === "object")
          callback = this;
        if (obj)
          (listeners = {})[obj._listenerId] = obj;
        for (var id in listeners) {
          listeners[id].off(name, callback, this);
          if (deleteListener)
            delete this._listeners[id]
        }
        return this
      }
    })
  };
  module.initialize();
  return module
}();


var RWDLibs = (function($, options) {
  var defaults = {
    "breakpoint": {
      "mobile": 640,
      "tablet": 1024,
      "desktop": 1280
    }
  };

  var o = $.extend({}, defaults, options);

  var module = {};

  function checkBreakpoint(curBP){
    var winWidth = $(window).width(),
        bp = "none";
    if(!curBP){
      curBP = "undefined";
    }
    $.each(o.breakpoint, function(key, val){
      if(winWidth <= val){
        bp = key;
      }
    });
    if(bp==="none"){
      bp = "wide";
    }
    if(bp != curBP){
      curBP = bp;
      _vents.trigger('RWDLibs.breakpoint', {
        "breakpoint": bp,
        "size": $(window).width()
      });
    }

    return curBP;
  }


  var currentBreakpoint = checkBreakpoint(currentBreakpoint);
  var init = function() {
    $(window).resize(function(){
      currentBreakpoint = checkBreakpoint();
    });
    return module;
  };

  return init();
})(jQuery, {
  "breakpoint": {
    "mobile": 640,
    "tablet": 1024,
    "desktop": 1280
  }
});

