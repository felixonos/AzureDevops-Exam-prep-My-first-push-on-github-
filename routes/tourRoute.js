const express = require('express');
const tourController = require('./../controllers/tourController');
const authCon = require('./../controllers/authController');
const reviewRoute = require('./../routes/reviewRoute');

const router = express.Router();

// confirm ID in middleware before hitting the router
// router.param('id', checkID);

// NESTED ROUTES (Using merge params) (make sure reviews, is also an existing endpoint)
// POST: tour/23ffbe/reviews // GET: tour/23ffbe/reviews // etc
router.use('/:tourId/reviews', reviewRoute);

router.route('/get-top-5-tours')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats')
    .get(tourController.getTourStats);

router.route('/monthly-plan/:year')
    .get(authCon.protect, authCon.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router.route('/')
    .get(tourController.getAllTours)
    .post(authCon.protect, authCon.restrictTo('admin', 'lead-guide'), tourController.createTour);

router.route('/:id')
    .get(tourController.getTour)
    .patch(authCon.protect, authCon.restrictTo('admin', 'lead-guide'), tourController.updateTour)
    .delete(authCon.protect, authCon.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;