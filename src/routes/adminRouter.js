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
const adminRouter=express.Router();
const authenticate=require('../authenticate');
const admin = require('../models/admin');
const { initialize } = require('passport');

adminRouter.use(bodyParser.json());
adminRouter.use(cors());

connect.then((db) => {
    console.log("Connected correctly to server");


// Router to get group-wise lists of tests 
adminRouter.route('/results/:testid')
.get((req, res, next) => {
    Tests.findById(req.params.testid).then(test =>{
        var response = []
        for (let i = 0; i < test.studentMarks.length; i++) 
        {
            response.push({
                name : test.studentMarks[i].name,
                uniqueID : test.studentMarks[i].uniqueID,
                userID : test.studentMarks[i].userID,
                marks : test.studentMarks[i].marks,
                totalMarks : test.totalMarks
            })            
        }
        res.status(200).send(response)
    })
})
adminRouter.route('/:testid/getCompletedQuestions/:studentId')
.get(authenticate.verifyAdmin,(req, res, next) => {
    Tests.findById(req.params.testid).then(test =>{
        var response
        for(var j=0; j<test.studentMarks.length; j++)
        {
            if(`${test.studentMarks[j].userID}` == req.params.studentId)
            {
                response = {
                    title:test.title,
                    startDate:test.startDate,
                    duration:test.duration,
                    subject:test.subject,
                    questions : test.questions,
                    response : test.studentMarks[j].answers,
                    marksObtained : test.studentMarks[j].marks,
                    totalMarks : test.totalMarks
                }
            }
        }
        console.log(response);
        res.status(200).send(response)
    })
})
});

module.exports = adminRouter;