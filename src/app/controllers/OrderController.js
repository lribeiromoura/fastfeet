import * as Yup from 'yup';
import {
  startOfHour,
  isBefore,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Recipients from '../models/Recipients';
import Deliveryman from '../models/Deliveryman';
import Mail from '../../lib/Mail';

class OrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const orders = await Order.findAll({
      order: ['deliveryman_id'],
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'created_at',
        'updated_at',
      ],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(orders);
  }

  async store(req, res) {
    /**
     * Check schema
     */
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    /**
     * Check Recipient
     */
    const recipient = await Recipients.findByPk(req.body.recipient_id);

    if (!recipient) {
      return res.status(400).json({ error: 'You must type a valid recipient' });
    }

    /**
     * Check Deliveryman
     */
    const deliveryman = await Deliveryman.findByPk(req.body.deliveryman_id);

    if (!deliveryman) {
      return res
        .status(400)
        .json({ error: 'You must type a valid deliveryman' });
    }

    /**
     * Create Order if all validations are okay
     */
    const { recipient_id, deliveryman_id, product } = await Order.create(
      req.body
    );

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'Ordem Criada!',
      template: 'NewOrder',
      context: {
        deliveryman: deliveryman.name,
        product: req.body.product,
      },
    });

    return res.json({ recipient_id, deliveryman_id, product });
  }

  async update(req, res) {
    const { start_date } = req.body;

    /**
     * Check for past Dates
     */
    const hourStart = startOfHour(start_date);

    if (isBefore(hourStart, new Date().getTime())) {
      return res.status(400).json({ error: 'Past date are not permitted' });
    }

    /**
     * Check Quantity of orders
     */

    const checkQtdOrders = await Order.findAndCountAll({
      where: {
        deliveryman_id: req.params.deliverymanid,
        start_date: {
          [Op.between]: [startOfDay(start_date), endOfDay(start_date)],
        },
      },
    });

    if (checkQtdOrders.count >= 5) {
      return res
        .status(400)
        .json({ error: 'Deliveryman has more than 5 packages in this day' });
    }

    /**
     * Check if is comercial hour
     */
    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ];

    const available = schedule.map((time) => {
      const [hour, minute] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(start_date, hour), minute),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available: isAfter(value, new Date().getTime()),
      };
    });
    const lenghtAvaiableHours = available.length;

    const checkIfBiggerThan8am =
      format(req.body.start_date, "yyyy-MM-dd'T'HH:mm:ssxxx") >=
      available[0].value;
    const checkIfSmallerThan18pm =
      format(req.body.start_date, "yyyy-MM-dd'T'HH:mm:ssxxx") <=
      available[lenghtAvaiableHours - 1].value;

    if (!(checkIfBiggerThan8am && checkIfSmallerThan18pm)) {
      return res.status(400).json({ error: 'Not a comercial hour' });
    }

    return res.json(available);
  }

  async delete(req, res) {
    const orders = await Order.findByPk(req.params.id);

    if (!orders) {
      return res.status(400).json({ error: 'Order does not exist' });
    }

    orders.canceled_at = new Date();

    await orders.save();

    return res.json(orders);
  }
}

export default new OrderController();
