const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty.']
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'A review must belong to a tour.']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A review must belong to a user.']
        }
    },

    // pass shema options
    {
        // when ever it return a JSON, also pass along the virtual properties
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// craeted an index to avoid a user creating a more than one rview for a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    // populate each review with its tour and user that post it
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
});


reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // get the statistics
    const stats = await this.aggregate([
        {
            // match based on the current tour
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // check if stats has a value
    if (stats.length > 0) {
        // update tour with the stats
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating
        });

    } else {
        // update tour to default
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 0,
            ratingsQuantity: 0
        });
    }
}

// after posting a review, then calc the avgRating and qnty
reviewSchema.post('save', function () {
    // this points to current review, use the const to excute the static method
    this.constructor.calcAverageRatings(this.tour);
});

// also before updating or deleting a review, get the review
reviewSchema.pre(/^findByIdAnd/, async function (next) {
    const _review = await this.findOne();
    next();
});

// so after updating the review, calc the avg again for the tour 
reviewSchema.post(/^findByIdAnd/, async function () {
    this._review.constructor.calcAverageRatings(this._review.tour);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;