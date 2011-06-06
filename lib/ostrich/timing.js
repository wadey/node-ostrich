"use strict";

var Histogram = require('./histogram')

var Timing = module.exports = function Timing() {
  this.max = 0
  this.min = Infinity
  this.count = 0
  this.histogram = new Histogram()
  this.mean = 0
  this.partialVariance = 0
}

Timing.prototype.clear = function() {
  this.max = 0
  this.min = Infinity
  this.count = 0
  this.histogram.clear()
}

Timing.prototype.add = function(n) {
  if (n instanceof TimingStat) {
    this.addTimingStat(n)
  } else {
    this.addDuration(n)
  }
}

Timing.prototype.addTimingStat = function(timingStat) {
  if (timingStat.count > 0) {
    // (comment from Scala ostrich) these equations end up using the sum again, and may be lossy. i couldn't find or think of a better way.
    var newMean = (this.mean * this.count + timingStat.mean * timingStat.count) / (this.count + timingStat.count)
    this.partialVariance = this.partialVariance + timingStat.partialVariance +
                           (this.mean - newMean) * this.mean * this.count +
                           (timingStat.mean - newMean) * timingStat.mean * timingStat.count
    this.mean = newMean
    this.count += timingStat.count
    this.max = Math.max(this.max, timingStat.max)
    this.min = Math.min(this.min, timingStat.min)
    if (timingStat.histogram) {
      this.histogram.merge(timingStat.histogram)
    }
  }
}

Timing.prototype.addDuration = function(n) {
  if (n >= 0) {
    this.max = Math.max(this.max, n)
    this.min = Math.min(this.min, n)
    this.count++
    this.histogram.add(n)
    if (this.count === 1) {
      this.mean = n
      this.partialVariance = 0
    } else {
      var newMean = this.mean + (n - this.mean) / this.count
      this.partialVariance += (n - this.mean) * (n - newMean)
      this.mean = newMean
    }
  } else {
    // TODO: warning / error?
  }
  return this.count
}

Timing.prototype.get = function(reset) {
  try {
    return new TimingStat(this.count, this.max, this.min, this.mean, this.partialVariance, this.histogram.clone())
  } finally {
    if (reset) {
      this.max = 0
      this.min = Infinity
      this.count = 0
      this.histogram.clear()
    }
  }
}

/**
 * A pre-calulated timing. If you have timing stats from an external source but
 * still want to report them via the Stats interface, use this.
 *
 * Partial variance is `(count - 1)(s^2)`, or `sum(x^2) - sum(x) * mean`.
 */
var TimingStat = module.exports.TimingStat = function TimingStat(count, max, min, mean, partialVariance, histogram) {
  this.count = count || 0
  this.min = (count > 0 ? min : 0) || 0
  this.max = (count > 0 ? max : 0) || 0
  this.average = (count > 0 ? parseInt(mean) : 0) || 0
  this.mean = (count > 0 ? mean : 0) || 0
  this.partialVariance = (count > 1 ? partialVariance : 0) || 0
  this.variance = (count > 1 ? (partialVariance / (count - 1)) : 0)
  this.stdDev = Math.round(Math.sqrt(this.variance))
  this.histogram = histogram
}

TimingStat.prototype.equals = function(other) {
  return this.count === other.count && this.max === other.max &&
         this.min === other.min && this.average === other.average &&
         this.variance === other.variance
}

TimingStat.prototype.toRawObject = function(histogram) {
  var obj = {
    count: this.count,
    max: this.max,
    min: this.min,
    mean: this.mean,
    partial_variance: this.partialVariance,
  }
  if (histogram) {
    histogram = this.histogram.buckets.slice()
    while (histogram.length && histogram[histogram.length - 1] === 0) {
      histogram = histogram.slice(0, histogram.length - 1)
    }
    obj.histogram = histogram
  }
  return obj
}

TimingStat.prototype.toJSON = function() {
  return this.toObject(true, true)
}

TimingStat.prototype.toObjectNoHistogram = function() {
  return {
    count: this.count,
    maximum: this.max,
    minimum: this.min,
    average: this.average,
    standard_deviation: parseInt(this.stdDev),
  }
}

TimingStat.prototype.toObject = function(percentiles, rawHistogram) {
  var obj = this.toObjectNoHistogram()
  if (this.histogram) {
    var h = this.histogram
    obj.p25 = h.getPercentile(0.25)
    obj.p50 = h.getPercentile(0.50)
    obj.p75 = h.getPercentile(0.75)
    obj.p90 = h.getPercentile(0.90)
    obj.p99 = h.getPercentile(0.99)
    obj.p999 = h.getPercentile(0.999)
    obj.p9999 = h.getPercentile(0.9999)
    if (rawHistogram) {
      var histogram = h.buckets.slice()
      while (histogram.length && histogram[histogram.length - 1] === 0) {
        histogram = histogram.slice(0, histogram.length - 1)
      }
      obj.histogram = histogram
    }
  }
  return obj
}

TimingStat.fromRawObject = function(d, bucketOffsets) {
  var histogram
  if (d.histogram) {
    histogram = Histogram.fromArray(d.histogram, bucketOffsets)
  }
  return new TimingStat(d.count, d.max, d.min, d.mean, d.partial_variance, histogram)
}

Timing.TimingStat = TimingStat
