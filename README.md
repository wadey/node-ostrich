# node-ostrich

This is a port of the Scala [Ostrich](https://github.com/twitter/ostrich) and Python [python-ostrich](https://github.com/wadey/python-ostrich) libraries. This port is currently a work in progress, so only the stuff covered in the unit tests are considered to be completed.

## Usage ##

    npm install ostrich

    var stats = require('ostrich')

## Stats API ##

There are three kinds of statistics that ostrich captures:

- counters

  A counter is a value that never decreases. Examples might be "`widgets_sold`" or "`births`". You
  just click the counter each time a countable event happens, and graphing utilities usually graph
  the deltas over time. To increment a counter, use:

        stats.incr("births")

        // or

        stats.incr("widgets_sold", 5)

- gauges

  A gauge is a value that has a discrete value at any given moment, like "`heap_used`" or
  "`current_temperature`". It's usually a measurement that you only need to take when someone asks.
  To define a gauge, stick this code somewhere in the server initialization:

        stats.gauge("current_temperature", function() { my_thermometer.get_temperature_in_celcius() })

  Gauge methods should always return a number.

- timings

  A timing is a stopwatch timer around code, like so:

        // you can time how long until a callback fires

        fs.open('file', stats.time('file_opening', function(err, fd) {
          // ...
        })

        // you can also time something by creating a timer

        var timer = stats.time('file_opening')
        fs.open('file', function(err, fd) {
          timer()
          // ...
        })

  Timings are collected in aggregate, and the aggregation is reported through the "`stats`" command.
  The aggregation includes the count (number of timings performed), sum, maximum, minimum, average,
  standard deviation, and sum of squares (useful for aggregating the standard deviation).

## Dump stats as JSON ##

There is a `TimingStat.prototype.toJSON` function provided to make dumping the stats to JSON easy.
There was an attempt to make this format compatible between Scala, Python and Node.js versions.

    // Don't reset
    JSON.stringify(stats.stats())

    // Do reset
    JSON.stringify(stats.stats(true))
