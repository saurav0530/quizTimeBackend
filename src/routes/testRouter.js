const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors= require('cors');

const Groups= require('../models/group');
const Users= require('../models/user');
const Admins= require('../models/admin');
const Tests= require('../models/test');

const constants=require('./../../constants');
const connect = mongoose.connect(constants.mongoURL,{ useNewUrlParser: true,useUnifiedTopology: true  });
const testRouter=express.Router();
const authenticate=require('../authenticate');
const admin = require('../models/admin');
const { initialize } = require('passport');

testRouter.use(bodyParser.json());
testRouter.use(cors());

connect.then((db) => {
    console.log("Connected correctly to server");


// Router to start exam and initialize attendance
testRouter.route('/:groupid/start/:testid')
.get(authenticate.verifyUser,(req, res, next) => {
    var message, response, temp
    Groups.findById(req.params.groupid).then(async group =>{
        var check = 0
        for(var i=0; i<group.members.length; i++)
        {
            var students = group.members[i]
            //console.log(`${students.userID}`==req.user._id)
            if(`${students.userID}` == req.user._id)
            {
                var student = {
                    name: students.name,
                    uniqueID: students.uniqueID,
                    userID: students.userID,
                    answers : [],
                    marks : 0
                }
                temp = await Tests.findById(req.params.testid).then(async test => {
                    var remainingTime = (test.startDate.getTime() + (test.duration * 60000))
                    if(test.startDate > Date.now())
                    {
                        response = {
                            totalNumberOfQuestions : 0,
                            remainingTime : Date.now(),
                            message : "Not started yet"
                        }
                    }
                    else if(Date.now() >= remainingTime)
                    {
                        response = {
                            totalNumberOfQuestions : 0,
                            remainingTime : Date.now(),
                            message : "Test already ended"
                        }
                    }
                    else 
                    {
                        var check = 0
                        for(var j=0; j<test.studentMarks.length; j++)
                        {
                            if(`${test.studentMarks[j].userID}` == req.user._id)
                            {
                                check++;
                            }
                        }
                        if(check)
                        {
                            response = {
                                totalNumberOfQuestions : 0,
                                remainingTime : Date.now(),
                                message : "Test already attempted once"
                            }
                        }
                        else
                        {
                            await Tests.updateOne(
                                {_id : req.params.testid},
                                {
                                    $addToSet : {studentMarks : student}
                                },
                                (err, result) =>{
                                console.log(`Error : ${err}`,'\n', `Result : Attendance made ${req.user._id}`)
                            })
                            response = {
                            totalNumberOfQuestions : test.questions.length,
                            remainingTime : remainingTime,
                            message : ''
                            }
                        }
                    }
                    return response
                })
                break
            }
            console.log(temp)
        }
        res.status(200).send(temp)
    }) 
})

testRouter.route('/:testid/:qno')
.get( (req, res, next) => {
    Tests.findById(req.params.testid).then(test =>{
        if(test.questions[req.params.qno])
        {
            var question = {
                number : test.questions[req.params.qno].questionNo,
                question : test.questions[req.params.qno].question,
                A : test.questions[req.params.qno].A,
                B : test.questions[req.params.qno].B,
                C : test.questions[req.params.qno].C,
                D : test.questions[req.params.qno].D,
                marks : test.questions[req.params.qno].marks
            }
            res.status(200).send(question)
        }
        else
            res.status(200).json("Completed !!!")
    })
})
testRouter.route('/:testid/:response/:qno')
.get(authenticate.verifyUser,(req, res, next) =>{
    Tests.findById(req.params.testid).then(async test =>{
        if(req.params.qno > 1)
        {
            var index, data
            test.studentMarks.map((student,i) =>{
                if(`${student.userID}` == req.user._id)
                {
                    var obj = {
                        questionNo: req.params.qno-1,
                        markedAns: req.params.response
                    }
                    index = i
                    student.answers.push(obj)
                    if(req.params.response == test.questions[req.params.qno-2].ans)
                    {
                        student.marks += test.questions[req.params.qno-2].marks
                    }
                    data : student
                }
                Tests.updateOne(
                    {_id : req.params.testid, 'studentMarks.userID' : req.user._id},
                    {
                        $set:{
                            'studentMarks.$' : student
                        }
                    }
                ).then(res => console.log(`Result : Response inserted ${req.user._id} + ${req.params.qno - 1}`))
                .catch(err => console.log(`Error : ${err}`))
            })
        }
        if(test.questions.length === (req.params.qno-1))
        {
            var result
            await Tests.findById(req.params.testid).then(test =>{
                test.studentMarks.map((student,i) =>{
                    if(`${student.userID}` == req.user._id)
                    {
                        result = student
                    }
                })
            })
            res.status(200).send(result)
        }
        else
            res.redirect(`/tests/${req.params.testid}/${req.params.qno - 1}`)
    })
})
 
});


module.exports=testRouter;