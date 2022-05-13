const express = require('express');
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRoute = require('./routes/tourRoute');
const userRoute = require('./routes/userRoute');
const reviewRoute = require('./routes/reviewRoute');

const app = express();

// GLOBAL MIDDLEWARES

// set security http headers
app.use(helmet());

// developemnt logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// help us prevent denial of service and also brute force attacks, limiting request
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // win Mili Sec '1HOUR'
    max: 100, // limit each IP to 100 requests per windowMs (1HR)
    message: 'Too many request from this IP, please try again in an hour.'
});
app.use('/api', limiter); //  apply to only the api route

// Body parser, reading data from body into 'req.body'
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NOSql query injections
app.use(mongoSanitize()); // should be done under the body parser...

// Data sanitization against Cross Site Scripting Attacks (XSS)
app.use(xss());

// protect against HTTP Parameter Pollution attacks. Make sure the body is parsed beforehand.
app.use(hpp({
    // set allowed parameters that can be allowed muiltiple times
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// Serving static files
app.use(express.static(`${__dirname}/public`));

// test middle wares
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// ROUTES
app.use('/api/v1/tours', tourRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/reviews', reviewRoute);

// MIDDLEWARE to check ALL(*) routes that wr not executes above b4 reaching here
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ERROR MIDDLEWAEW to catch all error
app.use(globalErrorHandler);

module.exports = app;