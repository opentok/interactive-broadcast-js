// @flow
/* beautify preserve:start */
type StatProperty = AudioProperty | VideoProperty;
type AV = 'audio' | 'video';
const TEST_TIMEOUT_MS = 15000;
const MOSQuality: {[rating: string]: QualityRating } = {
  Excellent: 5,
  Good: 4,
  Fair: 3,
  Poor: 2,
  Bad: 1,
};
type BandwidthCalculatorProps = {
  subscriber: TestSubscriber,
  pollingInterval?: number,
  windowSize?: number
};
type Timestamp = number;

type Snapshot = { // $FlowFixMe
  audio: AudioStats,
  video: VideoStats,
  timestamp: Timestamp
};
type PerSecondStatsProps = {
  packetsPerSecond: number,
  bitsPerSecond: number,
  packetsLostPerSecond: number,
  packetLossRatioPerSecond: number
};
type PerSecondStats = {
  audio: PerSecondStatsProps,
  video: PerSecondStatsProps,
  windowSize: number,
  elapsedTimeMs?: number
};
type Resolution = '1280x720' | '640x480' | '320x240';
/* beautify preserve:ende */

const max = (numbers: number[]): number => Math.max.apply(undefined, numbers);
const min = (numbers: number[]): number => Math.min.apply(undefined, numbers); // $FlowFixMe
const pluck = <A>(arr: Array<{ [string]: A}>, property: string): A[] => arr.map((a: {[string]: A}): A => a[property]);
const sum = (values: number[]): number => values.reduce((acc: number, a: number): number => acc + a, 0);

const analyzeStats = (results: PerSecondStats, subscriber: TestSubscriber): QualityRating => {
  // if (!subscriber || !subscriber.stream) return MOSQuality.Bad;
  if (subscriber && subscriber.stream && subscriber.stream.hasVideo) {
    const videoBw = results.video.bitsPerSecond / 1000;
    const videoPLRatio = results.video.packetLossRatioPerSecond;
    const frameRate = (subscriber.stream.frameRate && subscriber.stream.frameRate.toString()) || '30';
    const { width, height }: TestVideoDimensions = subscriber.stream.videoDimensions; // $FlowFixMe
    const resolution: Resolution = `${width}x${height}`;
    if (resolution === '1280x720') {
      let aVideoLimits;
      switch (frameRate) {
        case '30':
          aVideoLimits = [250, 350, 600, 1000];
          break;
        case '15':
          aVideoLimits = [150, 250, 350, 800];
          break;
        default:
          aVideoLimits = [120, 150, 250, 400];
          break;
      }
      if (videoBw > aVideoLimits[3] && videoPLRatio < 0.1) {
        return MOSQuality.Excellent;
      } else if (videoBw > aVideoLimits[2] && videoBw <= aVideoLimits[3] && videoPLRatio < 0.02) {
        return MOSQuality.Good;
      } else if (videoBw > aVideoLimits[2] && videoBw <= aVideoLimits[3] && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
        return MOSQuality.Fair;
      } else if (videoBw > aVideoLimits[1] && videoBw <= aVideoLimits[2] && videoPLRatio < 0.1) {
        return MOSQuality.Fair;
      } else if (videoBw > aVideoLimits[0] && videoPLRatio > 0.1) {
        return MOSQuality.Poor;
      } else if (videoBw > aVideoLimits[0] && videoBw <= aVideoLimits[1] && videoPLRatio < 0.1) {
        return MOSQuality.Poor;
      } else if (videoBw < aVideoLimits[0] || videoPLRatio > 0.1) {
        return MOSQuality.Bad;
      }
      return MOSQuality.Bad;
    } else if (resolution === '640x480') {
      switch (frameRate) {
        case '30':
          if (videoBw > 600 && videoPLRatio < 0.1) {
            return MOSQuality.Excellent;
          } else if (videoBw > 250 && videoBw <= 600 && videoPLRatio < 0.02) {
            return MOSQuality.Good;
          } else if (videoBw > 250 && videoBw <= 600 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoBw > 150 && videoBw <= 250 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 150) {
            return MOSQuality.Poor;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio < 0.1) {
            return MOSQuality.Poor;
          } else if (videoBw < 120 || videoPLRatio > 0.1) {
            return MOSQuality.Bad;
          }
          return MOSQuality.Bad;
        case '15':
          if (videoBw > 400 && videoPLRatio < 0.1) {
            return MOSQuality.Excellent;
          } else if (videoBw > 200 && videoBw <= 400 && videoPLRatio < 0.02) {
            return MOSQuality.Good;
          } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 120) {
            return MOSQuality.Poor;
          } else if (videoBw > 75 && videoBw <= 120 && videoPLRatio < 0.1) {
            return MOSQuality.Poor;
          } else if (videoBw < 75 || videoPLRatio > 0.1) {
            return MOSQuality.Bad;
          }
          return MOSQuality.Bad;
        case '7':
          if (videoBw > 200 && videoPLRatio < 0.1) {
            return MOSQuality.Excellent;
          } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio < 0.02) {
            return MOSQuality.Good;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoBw > 75 && videoBw <= 120 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 50) {
            return MOSQuality.Poor;
          } else if (videoBw > 50 && videoBw <= 75 && videoPLRatio < 0.1) {
            return MOSQuality.Poor;
          } else if (videoBw < 50 || videoPLRatio > 0.1) {
            return MOSQuality.Bad;
          }
          return MOSQuality.Bad;
        default:
          return MOSQuality.Bad;
      }
    } else if (resolution === '320x240') {
      switch (frameRate) {
        case '30':
          if (videoBw > 300 && videoPLRatio < 0.1) {
            return MOSQuality.Excellent;
          } else if (videoBw > 200 && videoBw <= 300 && videoPLRatio < 0.02) {
            return MOSQuality.Good;
          } else if (videoBw > 120 && videoBw <= 200 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoBw > 120 && videoBw <= 200 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 120) {
            return MOSQuality.Poor;
          } else if (videoBw > 100 && videoBw <= 120 && videoPLRatio < 0.1) {
            return MOSQuality.Poor;
          } else if (videoBw < 100 || videoPLRatio > 0.1) {
            return MOSQuality.Bad;
          }
          return MOSQuality.Bad;
        case '15':
          if (videoBw > 200 && videoPLRatio < 0.1) {
            return MOSQuality.Excellent;
          } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio < 0.02) {
            return MOSQuality.Good;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 120) {
            return MOSQuality.Poor;
          } else if (videoBw > 100 && videoBw <= 120 && videoPLRatio < 0.1) {
            return MOSQuality.Poor;
          } else if (videoBw < 100 || videoPLRatio > 0.1) {
            return MOSQuality.Bad;
          }
          return MOSQuality.Bad;
        case '7':
          if (videoBw > 150 && videoPLRatio < 0.1) {
            return MOSQuality.Excellent;
          } else if (videoBw > 100 && videoBw <= 150 && videoPLRatio < 0.02) {
            return MOSQuality.Good;
          } else if (videoBw > 100 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoBw > 75 && videoBw <= 100 && videoPLRatio < 0.1) {
            return MOSQuality.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 75) {
            return MOSQuality.Poor;
          } else if (videoBw > 50 && videoBw <= 75 && videoPLRatio < 0.1) {
            return MOSQuality.Poor;
          } else if (videoBw < 50 || videoPLRatio > 0.1) {
            return MOSQuality.Bad;
          }
          return MOSQuality.Bad;
        default:
          return MOSQuality.Bad;
      }
    }
    return MOSQuality.Bad;
  }
  const audioBw = results.audio.bitsPerSecond / 1000;
  const audioPLRadio = results.audio.packetLossRatioPerSecond;
  if (audioBw > 30 && audioPLRadio < 0.5) {
    return MOSQuality.Excellent;
  } else if (audioBw > 25 && audioPLRadio < 5) {
    return MOSQuality.Good;
  }
  return MOSQuality.Bad;
};

const calculatePerSecondStats = (statsBuffer: Snapshot[], seconds: number): PerSecondStats => {  // $FlowFixMe
  const stats = { windowSize: seconds, audio: {}, video: {} };
  ['video', 'audio'].forEach((type: AV) => {
    stats[type] = {
      packetsPerSecond: (sum(pluck(pluck(statsBuffer, type), 'packetsReceived'))) / seconds,
      bitsPerSecond: (sum(pluck(pluck(statsBuffer, type), 'bytesReceived')) * 8) / seconds,
      packetsLostPerSecond: (sum(pluck(pluck(statsBuffer, type), 'packetsLost'))) / seconds,
    };
    stats[type].packetLossRatioPerSecond = (
      stats[type].packetsLostPerSecond / stats[type].packetsPerSecond
    );
  });
  return stats;
};

const getSampleWindowSize = (samples: Snapshot[]): number => {
  const times: Timestamp[] = samples.map((s: Snapshot): number => s.timestamp);
  return (max(times) - min(times)) / 1000;
};

class BandwidthCalculator {

  intervalId: number;
  pollingInterval: number;
  windowSize: number;
  subscriber: TestSubscriber;
  start: (PerSecondStats => void) => void;
  end: Unit;

  constructor(config: BandwidthCalculatorProps) {
    this.pollingInterval = config.pollingInterval || 500;
    this.windowSize = config.windowSize || 2000;
    this.subscriber = config.subscriber;
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  }

  start(reportFunction: PerSecondStats => void) {
    const statsBuffer: Snapshot[] = [];
    const last = {
      audio: {},
      video: {},
    };
    this.intervalId = setInterval(() => {
      this.subscriber.getStats((error: Error | null, stats: Stats | void) => {
        const snapshot = {};
        const nowMs = new Date().getTime();
        if (!stats) {
          clearInterval(this.intervalId);
          return;
        }

        /* eslint-disable flowtype/no-weak-types */
        ['audio', 'video'].forEach((type: AV) => { // $FlowFixMe
          snapshot[type] = Object.keys(stats[type]).reduce((acc: Object, key: StatProperty): AudioStats | VideoStats => {
            // $FlowFixMe
            const delta = stats[type][key] - (last[type][key] || 0); // $FlowFixMe
            last[type][key] = stats[type][key];
            return Object.assign({}, acc, { [key]: delta });
          }, { [type]: {} });
        });
        /* eslint-enable flowtype/no-weak-types */

        // get a snapshot of now, and keep the last values for next round
        snapshot.timestamp = stats.timestamp;
        statsBuffer.push(snapshot);

        const filteredBuffer = statsBuffer.filter((s: Snapshot): boolean => (nowMs - s.timestamp) < this.windowSize);

        const sampleWindowSize = getSampleWindowSize(statsBuffer);

        if (sampleWindowSize !== 0) {
          reportFunction(calculatePerSecondStats(
            filteredBuffer,
            sampleWindowSize,
          ));
        }
      });
    }, this.pollingInterval);
  }
  end() {
    clearInterval(this.intervalId);
  }
}

type TestConfig = { subscriber: TestSubscriber };
const performQualityTest = (config: TestConfig): Promise<QualityRating> =>
  new Promise((resolve: Promise.resolve<QualityRating>, reject: Promise.reject<Error>) => {
    const startMs = new Date().getTime();
    let testTimeout;
    let currentStats;

    const bandwidthCalculator = new BandwidthCalculator({ subscriber: config.subscriber });

    const cleanupAndReport = () => {
      if (!currentStats) { // $FlowFixMe
        reject(new Error('Failed to calculate network statistics'));
      } else {
        currentStats.elapsedTimeMs = new Date().getTime() - startMs;
        const quality: QualityRating = analyzeStats(currentStats, config.subscriber);
        clearTimeout(testTimeout);
        bandwidthCalculator.end(); // $FlowFixMe
        resolve(quality);
      }
    };

    // bail out of the test after 30 seconds
    setTimeout(cleanupAndReport, TEST_TIMEOUT_MS);

    bandwidthCalculator.start((stats: PerSecondStats) => {
      currentStats = stats; // $FlowFixMe
      resolve(analyzeStats(currentStats, config.subscriber));
    });
  });

export default performQualityTest;
