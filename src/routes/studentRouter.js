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
const studentRouter=express.Router();
const authenticate=require('../authenticate');
const admin = require('../models/admin');
const { initialize } = require('passport');

studentRouter.use(bodyParser.json());
studentRouter.use(cors());

connect.then((db) => {
    console.log("Connected correctly to server");


// Router to get group-wise lists of tests 
studentRouter.route('/:groupid/getTestByGroup')
.get(authenticate.verifyUser, (req, res, next) => {
    Groups.findById(req.params.groupid).then(async group =>{
        var temp = group.tests
        var testInfoArray = []
        for(var i=0; i<temp.length; i++)
        {
            await Tests.findById(temp[i]).then(test =>{
                var isCompleted = false
                for(var j=0; j<test.studentMarks.length; j++)
                {
                    if(`${test.studentMarks[j].userID}` == req.user._id)
                        isCompleted = true
                }
                testInfoArray.push({
                    _id:test._id,
                    title : test.title,
                    testType:test.testType,
                    duration : test.duration,
                    subject : test.subject,
                    startDate : test.startDate,
                    totalMarks : test.totalMarks,
                    isCompleted : isCompleted
                })
            })
        }
        var response = {
            name : group.name,
            isPrivate : group.isPrivate,
            _id : group._id,
            tests : testInfoArray
        }
        res.status(200).send(response)
    })
})

// Router to get completed-test-wise questions and response of respective student
studentRouter.route('/:testid/getCompletedQuestions')
.get(authenticate.verifyUser,(req, res, next) => {
    Tests.findById(req.params.testid).then(test =>{
        var response
        var remainingTime = (test.startDate.getTime() + (test.duration * 60000))
        for(var j=0; j<test.studentMarks.length; j++)
        {
            if((`${test.studentMarks[j].userID}` == req.user._id) && (Date.now() >= remainingTime)&&test.studentMarks[j].isEvaluated)
            {
                response = {
                    title:test.title,
                    startDate:test.startDate,
                    testType:test.testType,
                    duration:test.duration,
                    subject:test.subject,
                    questions : test.questions,
                    response : test.studentMarks[j].answers,
                    marksObtained : test.studentMarks[j].marks,
                    isQuestionInPDF:test.isQuestionInPDF,
                    totalMarks : test.totalMarks
                }
            }
        }
        if(!response)
            res.status(401).send({warningMssg : "You are not authorised to see the results now. Try again later once test and evaluation finishes."})
        else
            res.status(200).send(response)
    })
})
});


module.exports = studentRouter;