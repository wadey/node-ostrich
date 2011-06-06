var assert = require('assert')

var stats = require('ostrich/stats')
  , Timing = require('ostrich/timing')
  , TimingStat = Timing.TimingStat
  , Histogram = require('ostrich/histogram')

module.exports = {
  setup: function(done) {
    stats.clearAll()
    done()
  },

  testCounters: function() {
    stats.incr('widgets', 1)
    stats.incr('wodgets', 12)
    stats.incr('wodgets')
    assert.eql({widgets: 1, wodgets: 13}, stats.getCounterStats())
  },

  testTimingsEmpty: function() {
    stats.addTiming('test', 0)
    test = stats.getTiming('test')
    assert.ok(new TimingStat(1, 0, 0).equals(test.get(true)))
    assert.ok(new TimingStat(0, 0, 0).equals(test.get()))
  },

  testTimingsBasic: function() {
    stats.addTiming('test', 1)
    stats.addTiming('test', 2)
    stats.addTiming('test', 3)
    test = stats.getTiming('test')
    assert.ok(new TimingStat(3, 3, 1, 2.0, 2.0, new Histogram([1, 2, 3])).equals(test.get()))
  },

  testTimingsReport: function() {
    var x = 0
    stats.timer('hundred', function(done) {
      for (var i = 0; i < 100; ++i) {
        x += i
      }
      done()
    })
    var timings = stats.getTimingStats()
    assert.eql(['hundred'], Object.keys(timings))
    assert.eql(1, timings.hundred.count)
    assert.eql(timings.hundred.average, timings.hundred.min)
    assert.eql(timings.hundred.average, timings.hundred.max)
  },

  testTimingsAverage: function() {
    stats.addTiming('test', 0)
    var test = stats.getTiming('test')
    assert.ok(new TimingStat(1, 0, 0).equals(test.get()))
  },

  testTimingsNegative: function() {
    stats.addTiming('test', 1)
    stats.addTiming('test', -1)
    var test = stats.getTiming('test')
    assert.ok(new TimingStat(1, 1, 1, 1.0, 0.0, new Histogram([1])).equals(test.get()))
  },

  testTimingBoundaries: function() {
    var maxInt = Math.pow(2, 32)

    stats.addTiming('test', maxInt)
    stats.addTiming('test', 5)
    var sum = 5 + maxInt
      , avg = sum / 2
      , sumsq = 5 * 5 + maxInt * maxInt
      , partial = sumsq - sum * avg
    var test = stats.getTiming('test')
    assert.ok(new TimingStat(2, maxInt, 5, avg, partial, new Histogram([5, maxInt])).equals(test.get()))
  },

  testTimingTime: function(done) {
    var timer = stats.time('test')
    setTimeout(function() {
      timer()
      var test = stats.getTiming('test')
      assert.ok(test.get().average >= 10)
      done()
    }, 10)
  },

  testTimingTimeCallback: function(done) {
    var callback = function() {
      var test = stats.getTiming('test')
      assert.ok(test.get().average >= 10)
      done()
    }
    setTimeout(stats.time('test', callback), 10)
  },

  testTimingTimer: function(done) {
    stats.timer('test', function(timer) {
      setTimeout(function() {
        timer()
        var test = stats.getTiming('test')
        assert.ok(test.get().average >= 10)
        done()
      }, 10)
    })
  },

  testTimingReset: function() {
    stats.time('hundred')()
    assert.eql(1, stats.getTimingStats().hundred.count)
    stats.time('hundred')()
    assert.eql(2, stats.getTimingStats().hundred.count)
    assert.eql(2, stats.getTimingStats(true).hundred.count)
    stats.time('hundred')()
    assert.eql(1, stats.getTimingStats().hundred.count)
  },

  testTimingBundle: function() {
    var timingStat = new TimingStat(3, 20, 10, 15.0, 50.0, new Histogram([10, 15, 20]))
    stats.addTiming('test', timingStat)
    stats.addTiming('test', 25)
    var test = stats.getTimingStats()['test']
    assert.eql(4, test.count)
    assert.eql(17, test.average)
    assert.eql(6, parseInt(test.stdDev))

    stats.clearAll()


    var timingStat1 = new TimingStat(2, 25, 15, 20.0, 50.0, new Histogram([15, 25]))
    var timingStat2 = new TimingStat(2, 20, 10, 15.0, 50.0, new Histogram([10, 20]))
    stats.addTiming('test', timingStat1)
    stats.addTiming('test', timingStat2)
    test = stats.getTimingStats()['test']
    assert.eql(4, test.count)
    assert.eql(17, test.average)
    assert.eql(6, parseInt(test.stdDev))
  },

  testTimingAdd: function() {
    stats.time('hundred')()
    assert.eql(1, Object.keys(stats.getTimingStats()).length)

    stats.addTiming('foobar', new TimingStat(1, 0, 0))
    assert.eql(2, Object.keys(stats.getTimingStats()).length)
    assert.eql(1, stats.getTimingStats(true)['foobar'].count)
    stats.addTiming('foobar', new TimingStat(3, 0, 0))
    assert.eql(3, stats.getTimingStats(true)['foobar'].count)
  },

  // testTimingReportSorted: function() {
  //   stats.addTiming('alpha', new TimingStat(1, 0, 0))
  //   var string = stats.getTimingStats()['alpha']
  //   console.log(string.inspect())
  // },

  testGaugeReport: function() {
    stats.gauge('pi', function() { return Math.PI })
    stats.gauge('e', function() { return Math.E })
    assert.eql({e: Math.E, pi: Math.PI}, stats.getGaugeStats())
  },

  testGaugeUpdate: function() {
    var potatoes = [100.0]
    stats.gauge('stew', function() {
      potatoes[0] += 1.0
      return potatoes[0]
    })
    assert.eql({stew: 101.0}, stats.getGaugeStats())
    assert.eql({stew: 102.0}, stats.getGaugeStats())
    assert.eql({stew: 103.0}, stats.getGaugeStats())
  },

  testFork: function() {
    var collection = stats.fork()
    stats.incr('widgets', 5)
    assert.eql({widgets: 5}, collection.getCounterStats())
    assert.eql({widgets: 5}, stats.getCounterStats(true))
    stats.incr('widgets', 5)
    assert.eql({widgets: 10}, collection.getCounterStats())
    assert.eql({widgets: 5}, stats.getCounterStats(true))
  }
}
