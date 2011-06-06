"use strict";

var Histogram = module.exports = function Histogram(values) {
  var self = this

  this.numBuckets = Histogram.BUCKET_OFFSETS.length + 1
  this.buckets = Histogram.BUCKET_OFFSETS.map(function() {
    return 0
  }).concat([0])
  this.total = 0
  if (values) {
    values.forEach(function(value) {
      self.add(value)
    })
  }
}

Histogram.BUCKET_OFFSETS = [1, 2, 3, 4, 5, 7, 9, 11, 14, 18, 24, 31, 40, 52,
  67, 87, 113, 147, 191, 248, 322, 418, 543, 706, 918, 1193, 1551, 2016, 2620,
  3406, 4428, 5757, 7483, 9728, 12647, 16441, 21373, 27784, 36119, 46955,
  61041, 79354, 103160, 134107, 174339, 226641, 294633, 383023, 497930,
  647308, 841501, 1093951
]

var binarySearch = function(array, key, low, high) {
  if (low > high) {
    return low
  } else {
    var mid = (low + high + 1) >> 1
      , midVal = array[mid]
    if (midVal < key) {
      return binarySearch(array, key, mid + 1, high)
    } else if (midVal > key) {
      return binarySearch(array, key, low, mid - 1)
    } else {
      return mid + 1
    }
  }
}

Histogram.binarySearch = function(key) {
  return binarySearch(Histogram.BUCKET_OFFSETS, key, 0, Histogram.BUCKET_OFFSETS.length - 1)
}

Histogram.fromArray = function(buckets, bucketOffsets) {
  if (!bucketOffsets) {
    bucketOffsets = Histogram.BUCKET_OFFSETS
  }
  var h = new Histogram()
  if (bucketOffsets === BUCKET_OFFSETS) {
    buckets.forEach(function(v, i) {
      h.buckets[i] = v
      h.total += v
    })
  } else {
    buckets.forEach(function(v, i) {
      h.add(bucketOffsets[i] - 1, v)
    })
  }
}

Histogram.prototype.add = function(n) {
  var index = Histogram.binarySearch(n)
  this.buckets[index] += 1
  this.total += 1
}

Histogram.prototype.clear = function() {
  this.buckets = this.buckets.map(function() { return 0 })
  this.total = 0
}

Histogram.prototype.getPercentile = function(percentile) {
  var sum = 0
    , index = 0

  while (sum < percentile * this.total) {
    sum += this.buckets[index++]
  }

  if (index === 0) {
    return 0
  } else if (index - 1 >= Histogram.BUCKET_OFFSETS.length) {
    return Infinity // TODO
  } else {
    return Histogram.BUCKET_OFFSETS[index - 1] - 1
  }
}

Histogram.prototype.merge = function(other) {
  var self = this
  other.buckets.forEach(function(val, i) {
    self.buckets[i] += val
  })
  this.total += other.total
}

Histogram.prototype.clone = function() {
  var o = new Histogram()
  o.merge(this)
  return o
}
