import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Order from '../models/Order';

class DeliverymanController {
  async indexDeliveries(req, res) {
    const deliveries = await Order.findAll({
      where: {
        deliveryman_id: req.params.id,
        end_date: {
          [Op.eq]: null,
        },
        canceled_at: {
          [Op.eq]: null,
        },
      },
    });

    return res.json(deliveries);
  }

  async index(req, res) {
    const { page = 1 } = req.query;

    const deliverymans = await Deliveryman.findAll({
      order: ['name'],
      attributes: ['id', 'name', 'email'],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(deliverymans);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      avatar_id: Yup.number(),
      email: Yup.string().email().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Invalid Schema' });
    }

    const checkDeliverymanExists = await Deliveryman.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (checkDeliverymanExists) {
      return res
        .status(400)
        .json({ error: 'E-mail of Deliveryman already registered' });
    }

    const { name, avatar_id, email } = await Deliveryman.create(req.body);

    return res.json({ name, avatar_id, email });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.json({ error: 'Validation fails' });
    }

    const deliveryman = await Deliveryman.findByPk(req.params.id);

    if (!deliveryman) {
      return res.json({ error: 'Deliveryman does not exists' });
    }

    const file = await File.findByPk(req.body.avatar_id);

    if (!file) {
      return res.json({ error: 'Avatar ID does not exists' });
    }
    const { name, email, avatar_id } = await deliveryman.update(req.body);

    return res.json({ name, email, avatar_id });
  }

  async delete(req, res) {
    const deliverymans = await Deliveryman.findByPk(req.params.id);

    if (!deliverymans) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    deliverymans.canceled_at = new Date();

    await deliverymans.save();

    return res.json(deliverymans);
  }
}

export default new DeliverymanController();
