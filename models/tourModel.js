const mongoose = require('mongoose');
const slugify = require('slugify');

// const User = require('./userModel');

const tourSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name.'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must have less or equal then 40 characters'],
            minlength: [10, 'A tour name must have more or equal then 10 characters'],
            // validate: [validator.isAlpha, 'Tour name must only contain characters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration.']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a maxGroupSize.']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty.'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium, difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            // get the set value and round it up, Math.round, rounds a figure to Int, below is a trick
            set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price.']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only points to current doc on NEW document creation
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) should be below regular price'
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description']
        },
        description: {
            type: String,
            required: [true, 'A tour must have a description'],
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a imageCover.']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [
            {
                // use a child referencing, as this holds an array of the user Ids, by passing only the Ids of the users in the guides array..
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },

    // pass schema options
    {
        // when ever it return a JSON, also pass along the virtual properties
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// created an index  (1 for asc, -1 for desc)
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// VIRTUAL PROPERTY
tourSchema.virtual('durationWeeks').get(function () {
    // return the duration per week
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// DOCUMENT MIDDLE WARE runs before a save or create occurs in the database
// also known as Pre Save Hooks
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// SAVING A DOCUMENT runs befroe saving a doc

// embedding the user data into the tour table as guides, JUST FOR TEST THO *incase*
// tourSchema.pre('save', async function (next) {
//     // so loop through each data that was passed in the guid, an get each user based on that Id, which returns it as a Promise
//     const guidePromises = this.guides.map(async id => await User.findOne({ id }));
//     // to get each data in the query, use promise.all, and store the users in the guides
//     this.guides = await Promise.all(guidePromises);

//     next();
// });

// QUERY MIDDLEWARES /^find/ to use all query function that starts with find
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
});

tourSchema.pre('aggregate', function (next) {
    // in the aggregate pipeline, add a match func
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    // console.log(this.pipeline());
    next();
});

tourSchema.post(/^find/, function (doc, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    // console.log(doc);
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
