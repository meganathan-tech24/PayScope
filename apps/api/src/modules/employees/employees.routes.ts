import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import {
  createEmployeeHandler,
  deleteEmployeeHandler,
  exportEmployeesCsvHandler,
  getEmployeeHandler,
  listEmployeesHandler,
  updateEmployeeHandler,
} from './employees.controller.js';
import {
  employeeBodySchema,
  employeeIdParamsSchema,
  exportEmployeesQuerySchema,
  listEmployeesQuerySchema,
} from './employees.schema.js';

export const employeesRouter: Router = Router();

// Every employee route needs a valid token; reads are open to any role.
employeesRouter.use(authenticate);

// authorize runs before validate, so a VIEWER gets a 403 without learning
// anything about what a valid write body looks like.
const hrOnly = authorize('HR_MANAGER');

employeesRouter.get('/', validate({ query: listEmployeesQuerySchema }), listEmployeesHandler);
// Static routes must be registered above /:id, or it would capture them.
employeesRouter.get(
  '/export.csv',
  validate({ query: exportEmployeesQuerySchema }),
  exportEmployeesCsvHandler,
);
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
