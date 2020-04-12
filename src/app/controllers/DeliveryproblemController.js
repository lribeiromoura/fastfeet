import Deliveryproblem from '../models/Deliveryproblem';
import Order from '../models/Order';
import Mail from '../../lib/Mail';
import deliveryman from '../models/Deliveryman';
import Deliveryman from '../models/Deliveryman';

class DeliveryproblemController {
  async indexByOrderId(req, res) {
    const { page = 1 } = req.query;

    const orders = await Deliveryproblem.findOne({
      where: {
        delivery_id: req.params.order_id,
      },
      include: [
        {
          model: Order,
          as: 'order',
        },
      ],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(orders);
  }

  async index(req, res) {
    const { page = 1 } = req.query;

    const orders = await Deliveryproblem.findAll({
      include: [
        {
          model: Order,
          as: 'order',
        },
      ],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(orders);
  }

  async store(req, res) {
    const order = await Order.findByPk(req.params.order_id);

    if (!order) {
      return res.status(400).json({
        error: 'Order does not exists',
      });
    }

    const problem = {
      delivery_id: req.params.order_id,
      description: req.body.description,
    };

    const createProblem = await Deliveryproblem.create(problem);

    return res.json(createProblem);
  }

  async delete(req, res) {
    const problem = await Deliveryproblem.findByPk(req.params.problem_id);
    if (!problem) {
      return res.status(400).json({ error: 'Problem not found' });
    }

    const order = await Order.findByPk(problem.delivery_id);

    if (!order) {
      return res.status(400).json({
        error: 'Order not found',
      });
    }

    const deliverymanbyorder = await Deliveryman.findByPk(order.deliveryman_id);

    order.canceled_at = new Date();

    await order.save();

    /**
     * Create Order if all validations are okay
     */

    await Mail.sendMail({
      to: `${deliverymanbyorder.name} <${deliverymanbyorder.email}>`,
      subject: 'Ordem Cancelada',
      template: 'Cancellation',
      context: {
        deliveryman: deliverymanbyorder.name,
        product: order.product,
        description: problem.description,
      },
    });

    return res.json(order);
  }
}

export default new DeliveryproblemController();
