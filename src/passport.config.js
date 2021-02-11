const localStrategy = require('passport-local').Strategy
const mongo = require('./mongo')

function initialize( passport ){
    var user, userAccess
    const authenticateUser = async (username, password, done) =>{
        user = await mongo.findUser(username, password, userAccess)
        //console.log(user)
        if(user)
            return done(null, user)
        else
            return done(null, false, {message : "Invalid username or password"})
    }
    passport.use(new localStrategy({ passReqToCallback: true },function(req, username, password, done) {
            userAccess = req.body.userType
            //console.log(req)
            authenticateUser(username,password, done)
        }
    ))
    
    passport.serializeUser((user, done)=>{
        done(null, user._id)
    })
    passport.deserializeUser(async (id, done)=>{
        var user = await mongo.findUserByID(id, userAccess)
        return done(null, user)
    })
}

module.exports = initialize