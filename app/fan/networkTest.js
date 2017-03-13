function NetworkTest(){
  this.TEST_TIMEOUT_MS = 15000;
  this.MOSQuality = {
    Excellent:5,
    Good:4,
    Fair:3,
    Poor:2,
    Bad:1
  }
}

NetworkTest.prototype.performQualityTest = function(config, callback) {
  var _this = this;
  var startMs = new Date().getTime();
  var testTimeout;
  var currentStats;

  var bandwidthCalculator = this.bandwidthCalculatorObj({
    subscriber: config.subscriber
  });

  var cleanupAndReport = function() {
    if(currentStats === undefined) return;
    currentStats.elapsedTimeMs = new Date().getTime() - startMs;
    var quality = _this.analyzeStats(currentStats, config.subscriber);
    callback(undefined, quality);
    window.clearTimeout(testTimeout);
    bandwidthCalculator.stop();

    callback = function() {};
  };

  // bail out of the test after 30 seconds
  window.setTimeout(cleanupAndReport, this.TEST_TIMEOUT_MS);

  bandwidthCalculator.start(function(stats) {
    //console.log(stats);

    // you could do something smart here like determine if the bandwidth is
    // stable or acceptable and exit early
    currentStats = stats;
  });
};

NetworkTest.prototype.analyzeStats = function (results, subscriber) {
  var quality = this.MOSQuality.Bad;
  if(!subscriber || !subscriber.stream) return quality;
  if(subscriber && subscriber.stream && subscriber.stream.hasVideo) {
    var videoBw = results.video.bitsPerSecond / 1000;
    var videoPLRatio = results.video.packetLossRatioPerSecond;
    var frameRate = subscriber.stream.frameRate && subscriber.stream.frameRate.toString() || '30';
    var resolution = subscriber.stream.videoDimensions.width + 'x' + subscriber.stream.videoDimensions.height;
    //console.log('resolution', resolution);
    //console.log('frameRate', frameRate);
    //console.log('videoBw', videoBw);
    //console.log('videoPLRatio', videoPLRatio);
    if(resolution === '1280x720') {

      aVideoLimits = {
        '1280x720-30': [250, 350, 600, 1000],
        '1280x720-15': [150, 250, 350, 800],
        '1280x720-7': [120, 150, 250, 400]
      };

      if(videoBw > aVideoLimits[3] && videoPLRatio < 0.1) {
        quality = this.MOSQuality.Excellent;
      } else if (videoBw > aVideoLimits[2] && videoBw <= aVideoLimits[3] && videoPLRatio < 0.02) {
        quality = this.MOSQuality.Good;
      } else if (videoBw > aVideoLimits[2] && videoBw <= aVideoLimits[3] && videoPLRatio >0.02 && videoPLRatio < 0.1) {
        quality = this.MOSQuality.Fair;
      } else if (videoBw > aVideoLimits[1] && videoBw <= aVideoLimits[2] && videoPLRatio < 0.1) {
        quality = this.MOSQuality.Fair;
      } else if (videoBw > aVideoLimits[0] && videoPLRatio > 0.1) {
        quality = this.MOSQuality.Poor;
      } else if (videoBw > aVideoLimits[0] && videoBw <= aVideoLimits[1] && videoPLRatio < 0.1) {
        quality = this.MOSQuality.Poor;
      } else if (videoBw < aVideoLimits[0] || videoPLRatio > 0.1) {
        quality = this.MOSQuality.Bad;
      }
    } else if(resolution === '640x480') {
      switch(frameRate) {
         case '30':

                    if(videoBw > 600 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Excellent;
                    } else if (videoBw > 250 && videoBw <= 600 && videoPLRatio <0.02) {
                      quality = this.MOSQuality.Good;
                    } else if (videoBw > 250 && videoBw <= 600 && videoPLRatio >0.02 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoBw > 150 && videoBw <=250 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoPLRatio > 0.1 && videoBw >150) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw >120 && videoBw <= 150 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw < 120 || videoPLRatio > 0.1) {
                      quality = this.MOSQuality.Bad;
                    }
                    break;
         case '15':

                    if(videoBw > 400 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Excellent;
                    } else if (videoBw > 200 && videoBw <= 400 && videoPLRatio <0.02) {
                      quality = this.MOSQuality.Good;
                    } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoBw> 120 && videoBw <=150 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoPLRatio > 0.1 && videoBw >120) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw >75 && videoBw <= 120 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw < 75 || videoPLRatio > 0.1) {
                      quality = this.MOSQuality.Bad;
                    }
                    break;
         case '7':
                    if(videoBw > 200 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Excellent;
                    } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio <0.02) {
                      quality = this.MOSQuality.Good;
                    } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio >0.02 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoBw> 75 && videoBw <=120 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoPLRatio> 0.1 && videoBw >50) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw >50 && videoBw <= 75 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw < 50 || videoPLRatio > 0.1) {
                      quality = this.MOSQuality.Bad;
                    }
                    break;
        }
      } else if(resolution === '320x240') {
        switch(frameRate) {
         case '30':

                    if(videoBw > 300 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Excellent;
                    } else if (videoBw > 200 && videoBw <= 300 && videoPLRatio <0.02) {
                      quality = this.MOSQuality.Good;
                    } else if (videoBw > 120 && videoBw <= 200 && videoPLRatio >0.02 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoBw > 120 && videoBw <= 200 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoPLRatio > 0.1 && videoBw >120) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw >100 && videoBw <= 120 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw < 100 || videoPLRatio > 0.1) {
                      quality = this.MOSQuality.Bad;
                    }
                    break;
         case '15':

                    if(videoBw > 200 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Excellent;
                    } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio <0.02) {
                      quality = this.MOSQuality.Good;
                    } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoBw> 120 && videoBw <=150 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoPLRatio > 0.1 && videoBw >120) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw >100 && videoBw <= 120 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw < 100 || videoPLRatio > 0.1) {
                      quality = this.MOSQuality.Bad;
                    }
                    break;
         case '7':
                    if(videoBw > 150 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Excellent;
                    } else if (videoBw > 100 && videoBw <= 150 && videoPLRatio <0.02) {
                      quality = this.MOSQuality.Good;
                    } else if (videoBw > 100 && videoBw <= 150 && videoPLRatio >0.02 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoBw> 75 && videoBw <=100 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Fair;
                    } else if (videoPLRatio> 0.1 && videoBw >75) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw >50 && videoBw <= 75 && videoPLRatio < 0.1) {
                      quality = this.MOSQuality.Poor;
                    } else if (videoBw < 50 || videoPLRatio > 0.1) {
                      quality = this.MOSQuality.Bad;
                    }
                    break;
        }
      }
  } else {
    var audioBw = results.audio.bitsPerSecond / 1000;
    var audioPLRadio = results.audio.packetLossRatioPerSecond;

    if(audioBw > 30 && audioPLRadio < 0.5) {
      quality = this.MOSQuality.Excellent;
    } else if(audioBw > 25 && audioPLRadio < 5) {
      quality = this.MOSQuality.Good;
    } else {
      quality = this.MOSQuality.Bad;
    }
  }
  return quality;
}


NetworkTest.prototype.bandwidthCalculatorObj = function(config) {
  var intervalId;
  var _this = this;

  config.pollingInterval = config.pollingInterval || 500;
  config.windowSize = config.windowSize || 2000;
  config.subscriber = config.subscriber || undefined;

  return {
    start: function(reportFunction) {
      var statsBuffer = [];
      var last = {
        audio: {},
        video: {}
      };

      intervalId = window.setInterval(function() {
        config.subscriber.getStats(function(error, stats) {
          var snapshot = {};
          var nowMs = new Date().getTime();
          var sampleWindowSize;

          ['audio', 'video'].forEach(function(type) {
            if(stats === undefined) {
              window.clearInterval(intervalId);
              return;
            }
            snapshot[type] = Object.keys(stats[type]).reduce(function(result, key) {
              result[key] = stats[type][key] - (last[type][key] || 0);
              last[type][key] = stats[type][key];
              return result;
            }, {});
          });
          if(stats !== undefined) {
            // get a snapshot of now, and keep the last values for next round
            snapshot.timestamp = stats.timestamp;

            statsBuffer.push(snapshot);
            statsBuffer = statsBuffer.filter(function(value) {
              return nowMs - value.timestamp < config.windowSize;
            });

            sampleWindowSize = _this.getSampleWindowSize(statsBuffer);

            if (sampleWindowSize !== 0) {
              reportFunction(_this.calculatePerSecondStats(
                statsBuffer,
                sampleWindowSize
              ));
            }
          }
        });
      }, config.pollingInterval);
    },

    stop: function() {
      window.clearInterval(intervalId);
    }
  };
};


NetworkTest.prototype.pluck= function(arr, propertName) {
  return arr.map(function(value) {
    return value[propertName];
  });
};

NetworkTest.prototype.sum = function(arr, propertyName) {
  if (typeof propertyName !== 'undefined') {
    arr = this.pluck(arr, propertyName);
  }

  return arr.reduce(function(previous, current) {
    return previous + current;
  }, 0);
};

NetworkTest.prototype.max = function(arr) {
  return Math.max.apply(undefined, arr);
};

NetworkTest.prototype.min = function min(arr) {
  return Math.min.apply(undefined, arr);
};

NetworkTest.prototype.calculatePerSecondStats = function(statsBuffer, seconds) {
  var stats = {};
  var _this = this;
  ['video', 'audio'].forEach(function(type) {
    stats[type] = {
      packetsPerSecond: _this.sum(_this.pluck(statsBuffer, type), 'packetsReceived') / seconds,
      bitsPerSecond: (_this.sum(_this.pluck(statsBuffer, type), 'bytesReceived') * 8) / seconds,
      packetsLostPerSecond: _this.sum(_this.pluck(statsBuffer, type), 'packetsLost') / seconds
    };
    stats[type].packetLossRatioPerSecond = (
      stats[type].packetsLostPerSecond / stats[type].packetsPerSecond
    );
  });

  stats.windowSize = seconds;
  return stats;
};

NetworkTest.prototype.getSampleWindowSize = function(samples) {
  var times = this.pluck(samples, 'timestamp');
  return (this.max(times) - this.min(times)) / 1000;
};

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn, scope) {
    for (var i = 0, len = this.length; i < len; ++i) {
      fn.call(scope, this[i], i, this);
    }
  };
};




module.exports = NetworkTest;
