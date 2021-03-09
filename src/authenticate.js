var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var Admin = require('./models/admin');
var JwtStrategy = require('passport-jwt').Strategy;
var  ExtractJwt=require('passport-jwt').ExtractJwt;
var jwt=require('jsonwebtoken');

var constants=require('../constants');

passport.use('user-local',new LocalStrategy(User.authenticate()));
passport.use('admin-local',new LocalStrategy(Admin.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

exports.getToken=function(user){
    return jwt.sign(user,constants.secretKey,{expiresIn: 10800});
};

var opts= {};
opts.jwtFromRequest=ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey=constants.secretKey;

exports.jwtPassport = passport.use('jwt-user',new JwtStrategy(opts,
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

exports.verifyUser = passport.authenticate('jwt-user', {session: false});

exports.jwtPassport = passport.use('jwt-admin',new JwtStrategy(opts,
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        Admin.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

exports.verifyAdmin = passport.authenticate('jwt-admin', {session: false});
