const express = require('express');
const userCon = require('./../controllers/userController');
const authCon = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authCon.signup);
router.post('/login', authCon.login);
router.post('/forgot-password', authCon.forgotPassword);
router.patch('/reset-password/:token', authCon.resetPassword);

// protect all routes/endpoints after this middleware
router.use(authCon.protect);

router.get('/me', userCon.setMyData, userCon.getUser);
router.patch('/update-my-password', authCon.updatePassword);
router.patch('/update-my-data', userCon.updateMyData);
router.delete('/delete-my-data', userCon.deleteMyData);

// restrict all routes/endpoints after this middleware to admins only
router.use(authCon.restrictTo('admin'));

router.route('/')
    .get(userCon.getAllUsers)
    .post(userCon.createUser);

router.route('/:id')
    .get(userCon.getUser)
    .patch(userCon.updateUser)
    .delete(userCon.deleteUser);

module.exports = router;