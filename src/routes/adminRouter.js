const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors= require('cors');
const fs = require('fs')
const path = require('path')

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
adminRouter.route('/evaluate')
.post(authenticate.verifyAdmin,(req,res,next)=>{
    console.log(req.body);
    // var evaluatedData={
    //     marks:this.state.test.response[index].marks,
    //     remarks:this.state.test.response[index].remarks,
    //     questionIndex:index,
    //     studentId:this.props.match.params.studentId,
    //     testid:this.props.match.params.testId
    // }

    Tests.findById(req.body.testid).then(async test =>{
            test.studentMarks.map((student,i) =>{
                if(`${student.userID}` == req.body.studentId)
                {
                    student.marks =Number(student.marks)-student.answers[req.body.questionIndex].marks+Number(req.body.marks);
                    student.answers[req.body.questionIndex].marks=req.body.marks;
                    student.answers[req.body.questionIndex].remarks=req.body.remarks;
                    console.log(student);
                    console.log(req.body);
                    Tests.updateOne(
                        {_id : req.body.testid, 'studentMarks.userID' : req.body.studentId},
                        {
                            $set:{
                                'studentMarks.$' : student
                            }
                        }
                    ).then(() => {
                        console.log(`Result : Question evaluated ${req.body.studentId} + ${req.body.questionIndex+1}`)
                        res.redirect(`/admin/${req.body.testid}/getCompletedQuestions/${req.body.studentId}`)
                        })
                    .catch(err => console.log(`Error : ${err}`))
                }
            })
        })  
})
.put(authenticate.verifyAdmin,(req,res,next)=>{

    Tests.findById(req.body.testid).then(async test =>{
        test.studentMarks.map((student,i) =>{
            if(`${student.userID}` == req.body.studentId)
            {
                student.isEvaluated =true;
                Tests.updateOne(
                    {_id : req.body.testid, 'studentMarks.userID' : req.body.studentId},
                    {
                        $set:{
                            'studentMarks.$' : student
                        }
                    }
                ).then(() => {
                    console.log(`Result : Test evaluated ${req.body.studentId}`)
                    // res.redirect(`admin/${req.body.testid}/getCompletedQuestions/${req.body.studentId}`)
                    res.status(200).json({Message:"Evaluation Complete"})
                    })
                .catch(err => console.log(`Error : ${err}`))
            }
        })
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
                    isQuestionInPDF:test.isQuestionInPDF,
                    questions : test.questions,
                    isEvaluated:test.studentMarks[j].isEvaluated,
                    response : test.studentMarks[j].answers,
                    marksObtained : test.studentMarks[j].marks,
                    totalMarks : test.totalMarks,
                    totalQuestions:test.totalQuestions
                }
            }
        }
        // console.log(response);
        res.status(200).send(response)
    })
})


adminRouter.route('/:testId/testPaper')
.get((req,res,next)=>{
    console.log("File Request");
    Tests.findById(req.params.testId).then(test =>{
        var filename
        if(test.isQuestionInPDF)
        {
            var file = test.questionPDF
            var filename=`static/${req.params.testId}.pdf`;
            // filename=`${req.params.testId}.pdf`
            fs.writeFileSync(filename, file,  "buffer",function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            });
            res.sendFile(path.join(__dirname,`/../../${filename}`))
        }
        else{
            var response = {
                questions: test.questions
            }
            res.status(200).send(response)
        }
    })
})
adminRouter.route('/:testId/testPaper/:studentId')
.get((req,res,next)=>{
    Tests.findById(req.params.testId).then(test =>{
        var filename
        for(var j=0; j<test.studentMarks.length; j++)
        {

            if(`${test.studentMarks[j].userID}` == req.params.studentId)
            {
                var file = test.studentMarks[j].file
                filename=`static/${req.params.studentId}_${req.params.testId}.pdf`
                fs.writeFileSync(filename, file,  "buffer",function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            });
            res.sendFile(path.join(__dirname,`/../../${filename}`))
            }
        }
    })
})

adminRouter.route('/:testId/getEvaluationData/:studentId')
.get(authenticate.verifyAdmin,(req,res,next)=>{
    Tests.findById(req.params.testId).then(test =>{
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
                    isQuestionInPDF:test.isQuestionInPDF,
                    questions : test.questions,
                    isEvaluated:test.studentMarks[j].isEvaluated,
                    response : test.studentMarks[j].answers,
                    marksObtained : test.studentMarks[j].marks,
                    totalMarks : test.totalMarks,
                    totalQuestions : test.totalQuestions
                }
            }
        }
        console.log(response);
        res.status(200).send(response)
    })
})
});

module.exports = adminRouter;