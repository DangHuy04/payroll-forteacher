const express = require('express');
const router = express.Router();
const {
  getPeriodRates,
  getCurrentRate,
  getStatistics,
  getPeriodRate,
  createPeriodRate,
  updatePeriodRate,
  deletePeriodRate,
  activatePeriodRate,
  deactivatePeriodRate
} = require('../controllers/periodRateController');

// @route   GET /api/period-rates
// @desc    Get all period rates for academic year
// @access  Private
router.get('/', getPeriodRates);

// @route   GET /api/period-rates/current
// @desc    Get current active period rate
// @access  Private
router.get('/current', getCurrentRate);

// @route   GET /api/period-rates/statistics
// @desc    Get period rate statistics
// @access  Private
router.get('/statistics', getStatistics);

// @route   GET /api/period-rates/:id
// @desc    Get single period rate
// @access  Private
router.get('/:id', getPeriodRate);

// @route   POST /api/period-rates
// @desc    Create new period rate
// @access  Private
router.post('/', createPeriodRate);

// @route   PUT /api/period-rates/:id
// @desc    Update period rate
// @access  Private
router.put('/:id', updatePeriodRate);

// @route   PUT /api/period-rates/:id/activate
// @desc    Activate period rate
// @access  Private
router.put('/:id/activate', activatePeriodRate);

// @route   PUT /api/period-rates/:id/deactivate
// @desc    Deactivate period rate
// @access  Private
router.put('/:id/deactivate', deactivatePeriodRate);

// @route   DELETE /api/period-rates/:id
// @desc    Delete period rate
// @access  Private
router.delete('/:id', deletePeriodRate);

module.exports = router; 