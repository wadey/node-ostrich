"use strict";

var util = require('util')
  , StatsProvider = require('./stats_provider')
  , Timing = require('./timing')

var StatsCollection = module.exports = function StatsCollection() {
  this.counters = {}
  this.timings = {}
}
util.inherits(StatsCollection, StatsProvider)

StatsCollection.prototype.addTiming = function(name, duration) {
  this.getTiming(name).add(duration)
}

StatsCollection.prototype.incr = function(name, count) {
  if (count === undefined) {
    count = 1
  }
  this.getCounter(name).incr(count)
}

StatsCollection.prototype.getCounterStats = function(reset) {
  var results = {}
    , counters = this.counters
  Object.keys(counters).forEach(function(name) {
    results[name] = counters[name].get(reset)
  })
  return results
}

StatsCollection.prototype.getTimingStats = function(reset) {
  var results = {}
    , timings = this.timings
  Object.keys(timings).forEach(function(name) {
    results[name] = timings[name].get(reset)
  })
  return results
}

StatsCollection.prototype.getCounter = function(name) {
  var counter = this.counters[name]
  if (!counter) {
    counter = this.counters[name] = new Counter()
  }
  return counter
}

StatsCollection.prototype.getTiming = function(name) {
  var timing = this.timings[name]
  if (!timing) {
    timing = this.timings[name] = new Timing()
  }
  return timing
}

StatsCollection.prototype.clearAll = function() {
  this.counters = []
  this.timings = []
}

var Counter = function Counter() {
  this.value = 0
}

Counter.prototype.incr = function(n) {
  if (n === undefined) {
    n = 1
  }
  return this.value += n
}

Counter.prototype.reset = function() {
  return this.value = 0
}

Counter.prototype.get = function(reset) {
  try {
    return this.value
  } finally {
    if (reset) {
      this.value = 0
    }
  }
}
