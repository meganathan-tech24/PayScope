import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import {
  createEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeeHandler,
  listEmployeesHandler,
  updateEmployeeHandler,
} from './employees.controller.js';
import {
  employeeBodySchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
} from './employees.schema.js';

export const employeesRouter: Router = Router();

// Every employee route needs a valid token; reads are open to any role.
employeesRouter.use(authenticate);

// authorize runs before validate, so a VIEWER gets a 403 without learning
// anything about what a valid write body looks like.
const hrOnly = authorize('HR_MANAGER');

employeesRouter.get('/', validate({ query: listEmployeesQuerySchema }), listEmployeesHandler);
// Static routes such as /export.csv must be registered above /:id.
employeesRouter.get('/:id', validate({ params: employeeIdParamsSchema }), getEmployeeHandler);
employeesRouter.post('/', hrOnly, validate({ body: employeeBodySchema }), createEmployeeHandler);
employeesRouter.put(
  '/:id',
  hrOnly,
  validate({ params: employeeIdParamsSchema, body: employeeBodySchema }),
  updateEmployeeHandler,
);
employeesRouter.delete(
  '/:id',
  hrOnly,
  validate({ params: employeeIdParamsSchema }),
  deleteEmployeeHandler,
);
