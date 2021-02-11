const express = require('express')
const router = express.Router()
//const bcrypt = require('bcryptjs')
const mongo = require('./mongo')
const bodyParser = require('body-parser')
const passport = require('passport')

const initializePassport = require('./passport.config')
const { ObjectId } = require('mongodb')
const { session } = require('passport')
initializePassport(passport)


// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
router.use(bodyParser.json())

router.get('/',(req,res)=>{
    res.send('Hi'+ req.session.passport)
})

router.post('/',passport.authenticate('local') ,(req,res)=>{
    res.send(req.user)
})


module.exports = router