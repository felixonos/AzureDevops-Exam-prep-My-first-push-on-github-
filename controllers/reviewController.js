const Review = require('./../models/reviewModel');
// const ApiFeatures = require('./../utils/apiFeatures');
// const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');


exports.getAllReviews = handlerFactory.getAll(Review);

exports.setTourUserIds = async (req, res, next) => {
    // check if tourId and user id was passed in the body for nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    next();
}

exports.getReview = handlerFactory.getOne(Review);

exports.createReview = handlerFactory.createOne(Review);

exports.updateReview = handlerFactory.updateOne(Review);

exports.deleteReview = handlerFactory.deleteOne(Review);