

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

app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 4000
app.use('/groups',groupRouter);         //A router to manage groups like adding/removing members and initialising a test
app.use('/register',registerRouter);    //A router to handle registration
app.use('/tests',testRouter);       //A router to handle requests during the exam like storing reponse to a answer and sending questions and verification before start
app.use('/student',studentRouter)       //A router for student's request to get list of test and result sheet
app.use('/admin',adminRouter);      //Router to handle admin's request to see test result and evaluation
app.use('/createtest',createTestRouter);        //Router to handle request related to creation and edit of test paper
app.get('/',(req, res)=>{
    res.sendFile('E:\Backend\quizTimeBackend\static\606bcc0fd1143b120cdf6e6e.pdf')
    //res.send('Hello from Quiz-time server !!!')
})

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



app.listen(port,()=>{
    console.log("App started at "+port)
})