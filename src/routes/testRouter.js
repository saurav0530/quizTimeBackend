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
const testRouter=express.Router();
const authenticate=require('../authenticate');
const admin = require('../models/admin');
const { initialize } = require('passport');

testRouter.use(bodyParser.json());
testRouter.use(cors());

connect.then((db) => {
    console.log("Connected correctly to server");
    // console.log(path.join(__dirname,'/../../test.pdf'))


// Router to start exam and initialize attendance
testRouter.route('/:groupid/start/:testid')
.get(authenticate.verifyUser,(req, res, next) => {
    // console.log(req);
    var message, response, temp
    Groups.findById(req.params.groupid).then(async group =>{
        var check = 0
        console.log(group);
        for(var i=0; i<group.members.length; i++)
        {
            var students = group.members[i]
            console.log(students);
            //console.log(`${students.userID}`==req.user._id)
            if(`${students.userID}` == req.user._id)
            {
                var student = {
                    name: students.name,
                    uniqueID: students.uniqueID,
                    userID: students.userID,
                    answers : [],
                    marks : 0,
                    negativeMarks:0,
                    positiveMarks:0
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
                            console.log("Run")
                            var NoOfQuestions;
                            NoOfQuestions=test.totalQuestions
                            
                            if(test.questions.length)
                            {
                                NoOfQuestions=test.questions.length
                            }
                            console.log(NoOfQuestions)
                            for(var j=1;j<=NoOfQuestions;j++)
                            {
                                student.answers.push({questionNo:j})
                            }
                            if(test.testType==='1')
                            {
                                student.isEvaluated=true
                            }

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
                            isQuestionInPDF:test.isQuestionInPDF,
                            remainingTime : remainingTime,
                            message : ''
                            }
                        }
                    }
                    return response
                })
                 break
            }
            // console.log(temp)
        }
        res.status(200).json(temp)
    }) 
})

testRouter.route('/:testId/testPaper')
.get(authenticate.verifyUser,(req,res,next)=>{
    Tests.findById(req.params.testId).then(test =>{
        if(test.isQuestionInPDF)
        {
            var filename=`static/${req.params.testId}.pdf`;
            console.log((path.join(__dirname,`/../../${filename}`)));
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

testRouter.route('/:testid/:qno')
.get( (req, res, next) => {
    Tests.findById(req.params.testid).then(test =>{
        if(test.questions[req.params.qno])
        {
            var question = {
                number : test.questions[req.params.qno].questionNo,
                questionType:test.questions[req.params.qno].questionType,
                question : test.questions[req.params.qno].question,
                marks : test.questions[req.params.qno].marks
            }
            if(question.questionType==='1')
            {
                question.A = test.questions[req.params.qno].A,
                question.B = test.questions[req.params.qno].B,
                question.C = test.questions[req.params.qno].C,
                question.D = test.questions[req.params.qno].D
            }

            res.status(200).send(question)
        }
        else
            res.status(200).json("Completed !!!")
    })
})




testRouter.route('/:testId/uploadAssignment')
.post(authenticate.verifyUser,(req,res,next)=>{
    Tests.findById(req.params.testId).then(async test =>{
        var file = req.files.file.data
        var filename=`static/${req.user._id}_${req.params.testId}.pdf`
        try{
            fs.writeFileSync(filename, file,  "buffer");
            console.log("The file was saved!");
            for(var j=0; j<test.studentMarks.length; j++)
            {
                if(`${test.studentMarks[j].userID}` == req.user._id)
                {
                    // test.studentMarks[j].file = req.files.file.data
                    Tests.updateOne(
                        {_id : req.params.testId, 'studentMarks.userID' : req.user._id},
                        {
                            $set:{
                                'studentMarks.$.file' : filename
                            }
                        }
                    ).then(()=> {
                        console.log(`Result : Response inserted ${req.user._id} + pdf`)
                        res.status(200).json('Response added successfully')
                    })
                    .catch(err => console.log(`Error : ${err}`))
                }
            }
        }catch{
            console.log(err);
            res.statusCode(609);
            res.json({err:err})
        }

        
    }, (err) => next(err))
    .catch((err) => next(err))
})


testRouter.route('/:testid/next/:qno')
.post(authenticate.verifyUser,(req, res, next) =>{
    var response=req.body.ans;
    Tests.findById(req.params.testid).then(async test =>{
        if(req.params.qno > 1)
        {
            var index, data
            test.studentMarks.map((student,i) =>{
                if(`${student.userID}` == req.user._id)
                {
                    var obj = {
                        questionNo: req.params.qno-1,
                        markedAns: response
                    }
                    // console.log(obj);
                    index = i;
                    if(student.answers[obj.questionNo-1].markedAns!=obj.markedAns)
                    {
                        // console.log("Going to update marks")
                        student.answers[obj.questionNo-1].markedAns=obj.markedAns;
                        if(test.questions[req.params.qno-2].questionType==='1')
                        {
                            if(response == test.questions[req.params.qno-2].ans)
                            {
                                student.answers[obj.questionNo-1].marks=test.questions[req.params.qno-2].marks
                                student.marks += test.questions[req.params.qno-2].marks
                                student.positiveMarks+=test.questions[req.params.qno-2].marks
                            }
                            else if(test.negative)
                            {
                                var negP=Number(test.negPercentage)/100;
                                var negmarks=negP*Number(test.questions[req.params.qno-2].marks);
                                student.answers[obj.questionNo-1].marks=-1*negmarks
                                student.marks -= negmarks
                                student.negativeMarks+=negmarks

                            }
                         }
                    }   // data : student
                    // console.log(student);
                    Tests.updateOne(
                        {_id : req.params.testid, 'studentMarks.userID' : req.user._id},
                        {
                            $set:{
                                'studentMarks.$' : student
                            }
                        }
                    ).then(res => console.log(`Result : Response inserted ${req.user._id} + ${req.params.qno - 1}`))
                    .catch(err => console.log(`Error : ${err}`))
                }
            })
        }
        if(test.questions.length === (req.params.qno-1))
        {
           
            var result={
                finished:true,
                Message:"Test has been sucessfully Completed"
            }
            res.status(200).send(result)
        }
        else
            res.redirect(`/tests/${req.params.testid}/${req.params.qno - 1}`)
    })
})
});


module.exports=testRouter;