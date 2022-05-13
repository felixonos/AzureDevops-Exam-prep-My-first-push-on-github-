const ApiFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
        return next(new AppError(`No document with id ${req.params.id}`, 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        // set an options, so to return the newly updated doc & validate again
        new: true,
        runValidators: true
    });

    if (!document) {
        return next(new AppError(`No document with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: document
        }
    });
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save();
    const document = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            data: document
        }
    });
})

exports.getOne = (Model, populateField) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateField) query = query.populate(populateField);

    const document = await query;

    if (!document) {
        return next(new AppError(`No document with id '${req.params.id}'`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: document
        }
    });
})

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // allow nested get reviews on TOUR, so as to get all reviews based on a tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // pass the query and the queryString // so pass the filter too
    const features = new ApiFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

    // populate the guides column of the users in each tour
    const documents = await features.query; //.explain(); // use explain to read query detail

    // send response
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        result: documents.length,
        data: {
            data: documents
        }
    });
})