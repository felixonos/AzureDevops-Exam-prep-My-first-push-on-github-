class ApiFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // console.log(this.queryString);
        // BUILDING THE QUERY (filtering)
        const queryObj = { ...this.queryString };
        // const queryObj = this.queryString;
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // ADVANCED FILTERING
        let queryStr = JSON.stringify(queryObj);
        // build the queryStr and replace to put the '$' before them. 
        // const tours = await Tour.find({ difficulty: 'easy', duration: { $gte: 5 } });
        // (greater than or equal => 'gte')
        // (greater than => 'gt')
        // (less than or equal => 'lte' )
        // (less than => 'lt')
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        // use without calling "await, so it can return a queryable object"
        //  let query = Tour.find(queryStr);
        this.query = this.query.find(JSON.parse(queryStr))

        // retuen this object
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // .sort('price ratingsAverage')
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query.sort(sortBy);
        }
        else {
            // if a sort value wasnt passed, ll be sorted with a default
            // will start from the latest createdAt
            this.query.sort('-createdAt');
        }
        // retuen this object
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query.select(fields);
        }
        else {
            // remove the returning '__v' property, and return all
            this.query.select('-__v');
        }
        // retuen this object
        return this;
    }

    pagination() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 50;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        // retuen this object
        return this;
    }
}

module.exports = ApiFeatures;