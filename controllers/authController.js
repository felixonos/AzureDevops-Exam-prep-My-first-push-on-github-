const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendMail = require('./../utils/email');


const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createAndSendToken = (user, statusCode, res) => {
    // sign jwt token
    const token = signToken(user._id);

    const cookieOptions = {
        // from todays dateTime plus the day of expiring, * 24hr * 60min * 60sec * 1000milisec
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: false,
        // set so the cookie cannot be modified anyway by the browser
        httpOnly: true
    }

    // if in prod, send cookie through encrypted connection (https)
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    // send the token through cookies
    res.cookie('jwt', token, cookieOptions);

    // remove the user password field on return
    user.password = undefined;

    // resp
    return res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    // create the new user
    const createdUser = await User.create(req.body);

    createAndSendToken(createdUser, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //check if email and password was passed
    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400))
    }

    // get user data, also select the password column, use the '+' sign to reselect it, since we have select to false 
    const user = await User.findOne({ email }).select('+password');

    //check if user not exist, using the user instance for it model method
    //also call the comparePassword in the if statement, so it won't execute if the user is null
    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // generate token
    createAndSendToken(user, 201, res);
})

exports.protect = catchAsync(async (req, res, next) => {
    // confirm if a token was passed
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    //check if token is empty
    if (!token) {
        return next(new AppError('Please login to get access.', 401));
    }

    //verify the signToken, "buh use the build in promisify util, so we cam use await since the method only returns a callback, so we dont break out structure"
    // jwt.sign(token, process.env.JWT_SECRET);
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exist
    const userData = await User.findById(decodedToken.id);
    if (!userData) return next(new AppError('User belonging to this token no longer exist.', 401));

    // check if user changed the password after the token was issued
    if (await userData.changedPasswordAfter(decodedToken.iat)) {
        return next(new AppError('Please login again, password was changed.', 401));
    }

    // call the next middleware if all checks are passed
    req.user = userData; // pass the user info, so it can be used in the next miidle ware e.g 'restrictTo'
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']
        // check if userRole is included. The req is holding the user data passed from the protect middleware
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission for this action.', 403));
        }

        next();
    };
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // get the user based on the posted email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError(`There is no user with ${req.body.email}.`, 404));
    }

    //generate the random reset token
    const resettoken = await user.createPasswordResetToken();
    // save the data in createPasswordResetToken, also to avoid revalidation again, use the property
    await user.save({ validateBeforeSave: false });

    //send reset token to mail
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resettoken}`;

    const mssg = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf your didn't forget your password, then ignore this email.`;

    //use a tryCatch, incase there is an error
    try {
        await sendMail({
            email: user.email,
            subject: 'Your password reset token (valid for 10min)',
            message: mssg
        });

        //send response
        res.status(200).json({
            status: 'success',
            message: 'Token sent to mail'
        });

    } catch (err) {
        //reset the userToken data & save
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email.', 500));
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // get the user based on encrypted token token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // if token has not expired, and user exist, set the new password
    if (!user) {
        return next(new AppError('Token has expired or invalid', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // user.passwordChangedAt = Date.now();  // update chnagedPasswordAt property for the user

    // save user data
    await user.save();

    // login the user, and send JWT
    createAndSendToken(user, 201, res);
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // get user from document by id, also select the hiden password field
    const user = await User.findOne(req.user._id).select('+password');

    // check if posted password is correct 
    if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Incorrect password', 401));
    }

    // if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // login user and send JWT
    createAndSendToken(user, 200, res);
})
