"use strict";

var StatsProvider = require('./stats_provider')
  , StatsCollection = require('./stats_collection')
  , timingStat = require('./timing').TimingStat

var Stats = function Stats() {
  StatsProvider.call(this)
  this.gauges = {}
  this.collection = new StatsCollection()
  this.forkedCollections = []
}

require('util').inherits(Stats, StatsProvider)

Stats.prototype.addTiming = function(name, timing) {
  this.forkedCollections.forEach(function(c) {
    c.addTiming(name, timing)
  })
  return this.collection.addTiming(name, timing)
}

Stats.prototype.incr = function(name, count) {
  this.forkedCollections.forEach(function(c) {
    c.incr(name, count)
  })
  return this.collection.incr(name, count)
}

Stats.prototype.getCounterStats = function(reset) {
  return this.collection.getCounterStats(reset)
}

Stats.prototype.getTimingStats = function(reset) {
  return this.collection.getTimingStats(reset)
}

Stats.prototype.getGaugeStats = function() {
  var results = {}
    , gauges = this.gauges
  Object.keys(gauges).forEach(function(name) {
    results[name] = gauges[name]()
  })
  return results
}

Stats.prototype.getTiming = function(name) {
  // make sure any new timings get added to forked collections
  this.forkedCollections.forEach(function(c) {
    c.getTiming(name)
  })
  return this.collection.getTiming(name)
}

Stats.prototype.getCounter = function(name) {
  // make sure any new counters get added to forked collections
  this.forkedCollections.forEach(function(c) {
    c.getCounter(name)
  })
  return this.collection.getCounter(name)
}

Stats.prototype.stats = function(reset) {
  var stats = this.collection.stats(reset)
  stats.gauges = this.getGaugeStats()
  return stats
}

Stats.prototype.clearAll = function() {
  this.forkedCollections.forEach(function(c) {
    c.clearAll()
  })
  this.forkedCollections = []
  this.collection.clearAll()
  this.gauges = []
}

Stats.prototype.gauge = function(name, func) {
  this.gauges[name] = func
}

Stats.prototype.fork = function() {
  var collection = new StatsCollection()
  this.forkedCollections.push(collection)
  return collection
}

module.exports = new Stats()
