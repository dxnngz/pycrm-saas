import { Router } from 'express';
import * as opportunityController from './opportunity.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requirePermission, Permission } from '../../core/middlewares/rbac.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { createOpportunitySchema, updateOpportunityStatusSchema, getOpportunitiesSchema, opportunityIdSchema } from './opportunity.schema.js';

const router = Router();

router.use(protect);

router.get('/', validate(getOpportunitiesSchema), requirePermission(Permission.READ_OPPORTUNITY), opportunityController.getOpportunities);
router.post('/', validate(createOpportunitySchema), requirePermission(Permission.WRITE_OPPORTUNITY), opportunityController.createOpportunity);
router.patch('/:id/status', validate(updateOpportunityStatusSchema), requirePermission(Permission.WRITE_OPPORTUNITY), opportunityController.updateOpportunityStatus);
router.get('/:id/score', validate(opportunityIdSchema), requirePermission(Permission.READ_OPPORTUNITY), opportunityController.getLeadScore);

export default router;
