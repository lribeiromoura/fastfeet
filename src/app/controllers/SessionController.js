import jwt from 'jsonwebtoken';
import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
    }

    if (!(await user.checkPassword(password))) {
      res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name,
        email,
      },
      // The MD5 hash for fastfeetsts is : 88daebb30fad9987f79740a0a2a98526
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
