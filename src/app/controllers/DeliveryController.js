import {
  parseISO,
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

class DeliveryController {
  async update(req, res) {
    const order = await Order.findOne({
      where: {
        id: req.params.order_id,
        deliveryman_id: req.params.deliveryman_id,
      },
    });

    const dateStarte = order.start_date
      ? order.start_date
      : parseISO(req.body.start_date);
    const dateEnd = order.end_date
      ? order.end_date
      : parseISO(req.body.end_date);

    console.log(order.start_date);
    console.log(dateStarte);
    console.log(dateEnd);

    /**
     * Check if order exists
     */

    if (!order) {
      return res.status(400).json({ error: 'Order not found' });
    }

    /**
     * Check Deliveryman is the same of req
     */

    if (!req.params.deliveryman_id === order.deliveryman_id) {
      return res.status(400).json({ error: 'Deliveryman not authorized' });
    }

    /**
     * Check StartDate
     */

    if (dateStarte) {
      /**
       * Check for past Dates
       */
      const hourStart = startOfHour(dateStarte);

      if (isBefore(hourStart, new Date().getTime())) {
        return res
          .status(400)
          .json({ error: 'Past date to start order are not permitted' });
      }

      /**
       * Check Quantity of orders
       */

      const checkQtdOrders = await Order.findAndCountAll({
        where: {
          deliveryman_id: req.params.deliveryman_id,
          start_date: {
            [Op.between]: [startOfDay(dateStarte), endOfDay(dateStarte)],
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
          setMinutes(setHours(dateStarte, hour), minute),
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
        format(dateStarte, "yyyy-MM-dd'T'HH:mm:ssxxx") >= available[0].value;
      const checkIfSmallerThan18pm =
        format(dateStarte, "yyyy-MM-dd'T'HH:mm:ssxxx") <=
        available[lenghtAvaiableHours - 1].value;

      if (!(checkIfBiggerThan8am && checkIfSmallerThan18pm)) {
        return res.status(400).json({ error: 'Not a comercial hour' });
      }
    }

    /**
     * Check EndDates
     */

    if (dateEnd) {
      /**
       * Check for past Dates
       */
      const hourEnd = startOfHour(dateEnd);

      if (isBefore(hourEnd, new Date().getTime())) {
        return res
          .status(400)
          .json({ error: 'Past date to end order are not permitted' });
      }
      /**
       * Check EndDate is Before StartDate
       */

      if (isBefore(hourEnd, dateStarte)) {
        return res
          .status(400)
          .json({ error: 'End date order can not be before started date' });
      }
    }

    const { start_date, end_date, signature_id } = await order.update(req.body);

    return res.json({ start_date, end_date, signature_id });
  }
}

export default new DeliveryController();
