const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var passport = require('passport');
const Users= require('../models/user');
const Admins= require('../models/admin');

const constants=require('./../../constants');
const connect = mongoose.connect(constants.mongoURL);
const registerRouter=express.Router();
var router = express.Router();

registerRouter.use(bodyParser.json());
connect.then((db) => {
    console.log("Connected correctly to server");

// router.get('/',  authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) =>{
//     User.find().then((users) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json(users);
// }, (err) => next(err))
// .catch((err) => next(err));

//     Admin.find().then((admins) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json(admins);
// }, (err) => next(err))
// .catch((err) => next(err));
// }
// );


registerRouter.post('/users', (req, res, next) => {
    Users.register(new Users({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
    }
    else {
        if (req.body.firstname)
        user.firstname = req.body.firstname;
        if (req.body.lastname)
        user.lastname = req.body.lastname;
        if(req.body.email)
        user.email = req.body.email;
        user.save((err, user) => {
        if (err) {
            console.log(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
            return ;
        }
        passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, status: 'Registration Successful!'});
        });
        });
    }
    });
});

registerRouter.post('/admins', (req, res, next) => {
    Admins.register(new Admins({username: req.body.username}), 
    req.body.password, (err, admin) => {
    if(err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
    }
    else {
        if (req.body.firstname)
        admin.firstname = req.body.firstname;
        if (req.body.lastname)
        admin.lastname = req.body.lastname;
        if(req.body.email)
        admin.email = req.body.email;
        if(req.body.organisation)
        admin.organisation = req.body.organisation;
        admin.save((err, admin) => {
        if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
            return ;
        }
        passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, status: 'Registration Successful!'});
        });
        });
    }
    });
  });
  
// router.post('/login/user', passport.authenticate('local-user'), (req, res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json({success: true, status: 'You are successfully logged in!'});
//   });
// registerRouter.route('/users')
// .post((req,res,next)=>{
//     var user = {
//                 firstName: req.body.firstName,
//                 lastName: req.body.lastName,
//                 email: req.body.email,
//                 username: req.body.username,
//                 password: req.body.password
//             }

// }






}, (err) => { console.log(err); });

module.exports=registerRouter;
