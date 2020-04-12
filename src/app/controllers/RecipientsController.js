import * as Yup from 'yup';
import Recipients from '../models/Recipients';
import User from '../models/User';

class RecipientsController {
  async store(req, res) {
    const schema = Yup.object().shape({
      id_transp: Yup.number().required(),
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.string().required(),
      complement: Yup.string().required(),
      state: Yup.string().required().min(2).max(2),
      city: Yup.string().required(),
      cep: Yup.string().required().min(8).max(8),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Invalid Schema' });
    }

    const transpId = await User.findByPk(req.userId);

    if (req.body.id_transp !== transpId.id) {
      return res.status(400).json({ error: 'Transp not valid' });
    }

    const {
      id_transp,
      name,
      street,
      number,
      complement,
      state,
      city,
      cep,
    } = await Recipients.create(req.body);

    return res.json({
      id_transp,
      name,
      street,
      number,
      complement,
      state,
      city,
      cep,
    });
  }
}

export default new RecipientsController();
