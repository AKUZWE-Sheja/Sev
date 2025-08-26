"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const slotController_1 = require("../controllers/slotController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/parking-slots/bulk:
 *   post:
 *     summary: Create multiple parking slots (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slots]
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [slotNumber, size, vehicleType, location]
 *                   properties:
 *                     slotNumber: { type: string }
 *                     size: { type: string }
 *                     vehicleType: { type: string }
 *                     location: { type: string }
 *     responses:
 *       201: { description: Slots created }
 *       400: { description: Slot number exists }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/bulk', auth_1.authenticate, auth_1.isAdmin, slotController_1.bulkCreateSlots);
/**
 * @swagger
 * /api/parking-slots:
 *   get:
 *     summary: List parking slots
 *     tags: [Parking Slots]
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
 *       200:
 *         description: List of slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       slotNumber: { type: string }
 *                       size: { type: string }
 *                       vehicleType: { type: string }
 *                       status: { type: string }
 *                       location: { type: string }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer }
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     limit: { type: integer }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/', auth_1.authenticate, slotController_1.getSlots);
/**
 * @swagger
 * /api/parking-slots/{id}:
 *   put:
 *     summary: Update a parking slot (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotNumber, size, vehicleType, location]
 *             properties:
 *               slotNumber: { type: string }
 *               size: { type: string }
 *               vehicleType: { type: string }
 *               location: { type: string }
 *     responses:
 *       200: { description: Slot updated }
 *       400: { description: Slot number exists }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Slot not found }
 */
router.put('/:id', auth_1.authenticate, auth_1.isAdmin, slotController_1.updateSlot);
/**
 * @swagger
 * /api/parking-slots/{id}:
 *   delete:
 *     summary: Delete a parking slot (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Slot deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Slot not found }
 */
router.delete('/:id', auth_1.authenticate, auth_1.isAdmin, slotController_1.deleteSlot);
exports.default = router;
