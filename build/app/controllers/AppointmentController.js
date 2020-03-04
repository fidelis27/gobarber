"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }Object.defineProperty(exports, "__esModule", {value: true});var _yup = require('yup'); var Yup = _interopRequireWildcard(_yup);
var _datefns = require('date-fns');
var _pt = require('date-fns/locale/pt'); var _pt2 = _interopRequireDefault(_pt);
var _Appointments = require('../models/Appointments'); var _Appointments2 = _interopRequireDefault(_Appointments);
var _User = require('../models/User'); var _User2 = _interopRequireDefault(_User);
var _File = require('../models/File'); var _File2 = _interopRequireDefault(_File);
var _Notification = require('../schemas/Notification'); var _Notification2 = _interopRequireDefault(_Notification);

var _CancellationMail = require('../jobs/CancellationMail'); var _CancellationMail2 = _interopRequireDefault(_CancellationMail);
var _Queue = require('../../lib/Queue'); var _Queue2 = _interopRequireDefault(_Queue);

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await _Appointments2.default.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date', 'past', 'cancelable'],
      include: [
        {
          model: _User2.default,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: _File2.default,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ message: 'validation fails' });
    }

    const { provider_id, date } = req.body;
    /**
     * check if provider_id is a provider
     */
    const isProvider = await _User2.default.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(400)
        .json({ message: 'You can only create appointment with providers' });
    }
    /**
     * Check for past dates
     */

    const hourStart = _datefns.startOfHour.call(void 0, _datefns.parseISO.call(void 0, date));

    if (_datefns.isBefore.call(void 0, hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }
    /*
     * Check date avalilability
     */

    const checkAvailabity = await _Appointments2.default.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailabity) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not availabity' });
    }
    if (req.userId === provider_id) {
      return res.status(400).json({ error: 'Provider can not be user' });
    }

    const appointment = await _Appointments2.default.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /*
     * Notify provider
     */
    const user = await _User2.default.findByPk(req.userId);
    const formatDate = _datefns.format.call(void 0, hourStart, "'dia 'dd 'de' MMMM', ás' H:mm'h'", {
      locale: _pt2.default,
    });

    await _Notification2.default.create({
      content: `Novo agendamento de ${user.name} para ${formatDate} `,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await _Appointments2.default.findByPk(req.params.id, {
      include: [
        {
          model: _User2.default,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: _User2.default,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointmet",
      });
    }
    const dateWithSub = _datefns.subHours.call(void 0, appointment.date, 2);
    if (_datefns.isBefore.call(void 0, dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can onlys cancels appointments 2 hours  in advance.',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await _Queue2.default.add(_CancellationMail2.default.key, {
      appointment,
    });

    return res.json(appointment);
  }
}

exports. default = new AppointmentController();
