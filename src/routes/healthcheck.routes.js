/*
 ============================================================================
 [PHASE 2 FEATURE]: Health Check Express Routes
 ============================================================================
 Public healthprobe endpoint for load balancers and system monitoring.
*/

import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";

const router = Router();

router.route("/").get(healthcheck);

export default router;
