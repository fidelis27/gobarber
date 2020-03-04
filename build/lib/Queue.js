"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _beequeue = require('bee-queue'); var _beequeue2 = _interopRequireDefault(_beequeue);
var _CancellationMail = require('../app/jobs/CancellationMail'); var _CancellationMail2 = _interopRequireDefault(_CancellationMail);
var _redis = require('../config/redis'); var _redis2 = _interopRequireDefault(_redis);

const jobs = [_CancellationMail2.default];

class Queue {
  constructor() {
    this.queues = {};
    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new (0, _beequeue2.default)(key, {
          redis: _redis2.default,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

exports. default = new Queue();
