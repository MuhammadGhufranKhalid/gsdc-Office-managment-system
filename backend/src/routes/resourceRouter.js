import { Router } from 'express';
import { crudFactory } from '../controllers/crudFactory.js';
import { protect, authorize } from '../middleware/auth.js';
import { resolveTenantScope, requireTenantForWrite } from '../middleware/tenant.js';

/**
 * @param {mongoose.Model} Model
 * @param {object} factoryOptions
 * @param {object} access
 */
export const resourceRouter = (Model, factoryOptions = {}, access = {}) => {
  const router = Router();
  const c = crudFactory(Model, factoryOptions);
  const writeGuard = access.write ? [authorize(...access.write)] : [];

  router.use(protect);
  router.use(resolveTenantScope);

  router.route('/')
    .get(c.list)
    .post(requireTenantForWrite, ...writeGuard, c.create);

  router.route('/:id')
    .get(c.get)
    .put(requireTenantForWrite, ...writeGuard, c.update)
    .delete(requireTenantForWrite, ...writeGuard, c.remove);

  return router;
};
