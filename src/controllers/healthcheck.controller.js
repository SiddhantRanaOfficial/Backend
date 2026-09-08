/*
 ============================================================================
 [PHASE 2 FEATURE]: System Health Check Controller
 ============================================================================
 Provides health probe status for database connection, uptime, and server state.
*/

import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// [PHASE 2 FEATURE]: Get server and database health status
const healthcheck = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting"
  };

  const healthData = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbState] || "Unknown",
      stateCode: dbState
    }
  };

  return res
    .status(200)
    .json(new ApiResponse(200, healthData, "System is healthy"));
});

export { healthcheck };
