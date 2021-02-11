const express = require("express");
const mongo = require("./mongo");
const bodyParser = require("body-parser")
const cors= require('cors');
const session = require('express-session')
const passport = require('passport')

const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// app.use(express.urlencoded());
app.use(express.json());
app.use(passport.initialize())
app.use(passport.session())
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: { 
        maxAge: 600000 
    }
}));
const port = process.env.PORT || 4000

app.get('/',(req, res)=>{
    res.send('Hello from Quiz-time server !!!')
})

app.post('/register/users',(req,res)=>{
    var user = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    }
    var message = mongo.registerFunction(user, 'users')
    console.log(message);
})
app.post('/register/admins',(req,res)=>{
    var user = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    }
    var message = mongo.registerFunction(user, 'admins')
    //console.log(message);
})

const login = require('./login')
app.use('/login', login)

app.listen(port,()=>{
    console.log("App started at "+port)
})