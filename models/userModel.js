const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A user must have a name.']
        },
        email: {
            type: String,
            required: [true, 'A user must have an email.'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Provide a valid email.']
        },
        photo: String,
        role: {
            type: String,
            enum: ['user', 'guide', 'lead-guide', 'admin'],
            default: 'user'
        },
        password: {
            type: String,
            required: [true, 'Password is required.'],
            minlength: 8,
            select: false
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Please confirm password.'],
            validate: {
                // THIS ONLY WORKDS ON CREATE & SAVE...
                validator: function (val) {
                    return val === this.password;
                },
                message: 'Password mismatch.'
            }
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        isActive: {
            type: Boolean,
            default: true,
            select: false
        }
    }
);

//always excempts doc which is not active
userSchema.pre(/^find/, function (next) {
    //this points to the current query
    this.find({ isActive: { $ne: false } });
    next();
});

//encrypt/hash the password only on save & updating, using the middle
userSchema.pre('save', async function (next) {
    //if the password has not been modified during updating, then inore
    if (!this.isModified('password')) return next();

    // hash the pasword with cost 12
    this.password = await bcryptjs.hash(this.password, 12);
    // delete the passwordConfirm feild, as we only need it once
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save', async function (next) {
    //if the password has not been modified during updating or is new doc,  then inore
    if (!this.isModified('password') || this.isNew) return next();

    // subtract by 1sec, so incase the token is generated after this doc has been saved, so this can have an earlier date
    this.passwordChangedAt = Date.now() - 1000;

    next();
});

// Instance method, to be available on all instance of the document
userSchema.methods.comparePassword = async function (loginPassword, dbPassword) {
    return await bcryptjs.compare(loginPassword, dbPassword);
}

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
    // check if password has been updated before
    if (this.passwordChangedAt) {
        // convert passChangedAt to same as JWTTimestamp, also devide it by 1000 to get it in seconds and give it base number 10
        const newPasswordChangedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        // means the time that the token was issued is less than the changed timeStamp
        return JWTTimestamp < newPasswordChangedAt; // 100 < 200 (means password was changed after token was issued)
    }

    // return false which means not changed
    return false;
}

userSchema.methods.createPasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // todays dats plus 10, times 60 sec, time 1000 for milisec
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    // console.log({ resetToken }, this.passwordResetToken);
    //return the resetToken
    return resetToken;
}


const User = mongoose.model('User', userSchema);

module.exports = User;