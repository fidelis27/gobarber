"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Queue = require('./lib/Queue'); var _Queue2 = _interopRequireDefault(_Queue);
require('dotenv/config');

_Queue2.default.processQueue();
