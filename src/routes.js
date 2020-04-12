import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientsController from './app/controllers/RecipientsController';
import FileController from './app/controllers/FileController';
import DeliverymanController from './app/controllers/DeliverymanController';
import OrderController from './app/controllers/OrderController';
import DeliveryController from './app/controllers/DeliveryController';
import DeliveryproblemController from './app/controllers/DeliveryproblemController';

import authHeader from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authHeader);

/**
 * Destinatários
 */
routes.post('/recipients', RecipientsController.store);

/**
 * Atualização de entregas para entregadores
 */
routes.put('/deliveries/:order_id/:deliveryman_id', DeliveryController.update);

/**
 * Problems
 */
routes.delete(
  '/problem/:problem_id/cancel-delivery',
  DeliveryproblemController.delete
);
routes.post('/delivery/:order_id/problems', DeliveryproblemController.store);
routes.get('/delivery/problems', DeliveryproblemController.index);
routes.get(
  '/delivery/:order_id/problems',
  DeliveryproblemController.indexByOrderId
);

/**
 * Entregadores
 */
routes.get('/deliveryman', DeliverymanController.index);
routes.get(
  '/deliveryman/:id/deliveries',
  DeliverymanController.indexDeliveries
);
routes.post('/deliveryman', DeliverymanController.store);
routes.put('/deliveryman/:id', DeliverymanController.update);
routes.delete('/deliveryman/:id', DeliverymanController.delete);

/**
 * Orders
 */
routes.get('/orders', OrderController.index);
routes.post('/orders', OrderController.store);
routes.put('/orders/:id/:deliverymanid', OrderController.update);
routes.delete('/orders/:id', OrderController.delete);

/**
 * Controle de Arquivos
 */
routes.post('/files', upload.single('file'), FileController.store);

export default routes;
