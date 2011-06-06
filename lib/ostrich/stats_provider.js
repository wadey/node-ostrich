"use strict";

var StatsProvider = module.exports = function StatsProvider() {}

StatsProvider.prototype = {
  time: function(name, callback) {
    var self = this
      , start = Date.now()
    return function() {
      self.addTiming(name, Date.now() - start)
      if (callback) {
        return callback.apply(null, arguments)
      }
    }
  },

  timer: function(name, func) {
    var callback = this.time(name)
    func(callback)
  },

  stats: function(reset) {
    return {
      counters: this.getCounterStats(reset),
      timings: this.getTimingStats(reset),
    }
  },

  //
  //
  //

  addTiming: function(name, timing) {
    return 0
  },

  incr: function(name, count) {
    return count
  },

  getCounterStats: function(reset) {
    return {}
  },

  getTimingStats: function(reset) {
    return {}
  },

  clearAll: function() {
  },
}
