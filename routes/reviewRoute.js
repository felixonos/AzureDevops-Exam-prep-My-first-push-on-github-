const express = require('express');
const reviewCon = require('./../controllers/reviewController');
const authCon = require('./../controllers/authController');

// use merge params to have access params in tour router
const router = express.Router({ mergeParams: true });

// protect all router/endpoints after this middleware
router.use(authCon.protect);

// router.route('/get-reviews-by-tour/:tourId')
//     .get(reviewCon.getReviewsByTour);

router.route('/')
    .get(reviewCon.getAllReviews)
    .post(authCon.restrictTo('user'), reviewCon.setTourUserIds, reviewCon.createReview);

router.route('/:id')
    .get(reviewCon.getReview)
    .patch(authCon.restrictTo('user'), reviewCon.updateReview)
    .delete(authCon.restrictTo('user'), reviewCon.deleteReview);

module.exports = router;