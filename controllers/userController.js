const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');

const filteredObject = (object, ...allowedFields) => {
    const newObj = {};

    //get the field name of each object, and loop through them
    Object.keys(object).forEach(_data => {
        // if the allowedFields array includes any pf the element, then add to the new object
        if (allowedFields.includes(_data)) newObj[_data] = object[_data];
    });

    return newObj;
}



exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        data: 'This route is not yet defined, kindly use sign up instead!!!'
    });
}

exports.updateMyData = catchAsync(async (req, res, next) => {
    // return an error if user post password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(`This route is not used in updating password. Either remove the password from the body or use '/update-my-password' `, 400));
    }

    //filter out unwanted fields that are now allowed to be updated
    const fliteredBody = filteredObject(req.body, 'name', 'email');
    //update user document
    const updateUser = await User.findByIdAndUpdate(req.user.id, fliteredBody, {
        new: true,
        runValidators: true
    });
    // user

    res.status(200).json({
        status: 'sucess',
        data: {
            user: updateUser
        }
    });
})

exports.deleteMyData = catchAsync(async (req, res, next) => {
    // withoud deleting the data completely, just update isActive field
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    res.status(204).json({
        status: 'sucess',
        data: null
    });
})

exports.setMyData = catchAsync(async (req, res, next) => {
    // set set the id to the params, as this func will be a middle ware to getOne
    req.params.id = req.user.id;

    next();
})

exports.getAllUsers = handlerFactory.getAll(User);

exports.getUser = handlerFactory.getOne(User);

// DO NOT UPDATE USER PASWORD WITH THIS
exports.updateUser = handlerFactory.updateOne(User);

exports.deleteUser = handlerFactory.deleteOne(User);