"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicleController_1 = require("../controllers/vehicleController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plate_number, vehicle_type, size]
 *             properties:
 *               plate_number: { type: string }
 *               vehicle_type: { type: string }
 *               size: { type: string }
 *               other_attributes: { type: object }
 *     responses:
 *       201: { description: Vehicle created }
 *       400: { description: Plate number exists }
 *       401: { description: Unauthorized }
 */
router.post('/', auth_1.authenticate, vehicleController_1.createVehicle);
/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: List vehicles
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: List of vehicles }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/', auth_1.authenticate, vehicleController_1.getVehicles);
exports.default = router;
