"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _sequelize = require('sequelize');
var _datefns = require('date-fns');
var _Appointments = require('../models/Appointments'); var _Appointments2 = _interopRequireDefault(_Appointments);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await _User2.default.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider) {
      return res.status(401).json({ erro: 'User is not Provider' });
    }

    const { date } = req.query;
    const parseDate = _datefns.parseISO.call(void 0, date);

    const appointments = await _Appointments2.default.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [_sequelize.Op.between]: [_datefns.startOfDay.call(void 0, parseDate), _datefns.endOfDay.call(void 0, parseDate)],
        },
      },
      include: [
        {
          model: _User2.default,
          as: 'user',
          attributes: ['name'],
        },
      ],
      order: ['date'],
    });

    return res.json(appointments);
  }
}

exports. default = new ScheduleController();
