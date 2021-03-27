

// const url = 'mongodb+srv://saurav0530:Saurav9113@cluster0.rz8ul.mongodb.net/quizTimeAPIdatabase?retryWrites=true&w=majority';
// const connect = mongoose.connect(url);



const express = require("express");
const fileupload = require("express-fileupload")
const bodyParser = require("body-parser")
 const cors= require('cors');
// const session = require('express-session')
// const passport = require('passport')
const groupRouter=require('./routes/groupRouter');
const registerRouter = require("./routes/registerRouter");
const testRouter = require("./routes/testRouter")
const studentRouter = require("./routes/studentRouter")
const adminRouter = require("./routes/adminRouter")
const createTestRouter=require("./routes/createTestRouter");

const app = express()

var passport = require('passport');
var authenticate = require('./authenticate');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(fileupload())


app.use(express.json());
// app.use(passport.initialize())
// app.use(passport.session())
// app.use(session({
//     secret: 'keyboard cat',
//     resave: true,
//     saveUninitialized: true,
//     rolling: true,
//     cookie: { 
//         maxAge: 600000 
//     }
// }));
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 4000
app.use('/groups',groupRouter);
app.use('/register',registerRouter);
app.use('/tests',testRouter);
app.use('/student',studentRouter)
app.use('/admin',adminRouter);
app.use('/createtest',createTestRouter);
app.get('/',(req, res)=>{
    res.send('Hello from Quiz-time server !!!')
})
// app.get('/login',(req,res)=>{
//     res.send('Hi'+ req.session.passport)
app.post('/login/user',passport.authenticate('user-local',{session:false}) ,(req,res)=>{
    console.log(req.user);
    var token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
     res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!',user:req.user});
});
app.post('/login/admin',passport.authenticate('admin-local',{session:false}) ,(req,res)=>{
    var token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!',user:req.user});
});

// app.post('/register/users',(req,res)=>{
//     var user = {
//         firstName: req.body.firstName,
//         lastName: req.body.lastName,
//         email: req.body.email,
//         username: req.body.username,
//         password: req.body.password
//     }
//     var message = mongo.registerFunction(user, 'users')
//     console.log(message);
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json({success: true, status: 'User Registration Successful!'});
// })
// app.post('/register/admins',(req,res)=>{
//     var user = {
//         firstName: req.body.firstName,
//         lastName: req.body.lastName,
//         email: req.body.email,
//         username: req.body.username,
//         password: req.body.password
//     }
//     var message = mongo.registerFunction(user, 'admins')
//     console.log(message);
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json({success: true, status: 'Admin Registration Successful!'});
// })

// const login = require('./login')
// app.use('/login', login)

app.listen(port,()=>{
    console.log("App started at "+port)
})