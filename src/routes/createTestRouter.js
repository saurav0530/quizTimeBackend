

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


const Groups= require('../models/group');
const Users= require('../models/user');
const Admins= require('../models/admin');
const Tests= require('../models/test');
const authenticate=require('../authenticate');
const constants=require('./../../constants');
const connect = mongoose.connect(constants.mongoURL);
const createTestRouter=express.Router();

// createTestRouter.use(bodyParser.json());
connect.then((db) => {
    console.log("Connected correctly to server");


    createTestRouter.route('/:groupId')
    .post(authenticate.verifyAdmin,(req,res,next)=>{
        var Testobj={
            title:req.body.title,
            createdBy:req.user._id,
            duration: req.body.duration,
            subject:req.body.subject,
            startDate:req.body.startDate,
            testType:req.body.testType,
            isQuestionInPDF : req.body.isQuestionInPDF
        }
        Tests.create(Testobj)
        .then((test) => {
            console.log('Test Created ', test);
            Groups.findById(req.params.groupId).then(group=>{
                group.tests.push(test._id);
                group.save().then(()=>{
                    // Admins.findById(req.user._id)
                    // .populate('groups')
                    // .then((admin) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(test);
                    // })
                })
            
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
    });
    createTestRouter.route('/:groupId/uploadAssignment/:testId')
    .post((req,res,next)=>{
        Tests.findById(req.params.testId)
        .then((test) => {
            test.questionPDF = req.files.file.data
            test.save().then(()=>{
                console.log('Question Added ', test);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(test);
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    createTestRouter.route('/edit/:testId')
    .put(authenticate.verifyAdmin,(req,res,next)=>{
        var Testobj={
            title:req.body.title,
            // createdBy:req.user._id,
            duration: req.body.duration,
            subject:req.body.subject,
            startDate:req.body.startDate,
            testType:req.body.testType,
            // totalMarks:req.body.totalMarks,
            // questions:req.body.questions,
        }
        Tests.findByIdAndUpdate(req.params.testId,{
            $set:Testobj
        })
        .then((test) => {
            
            
            console.log('Test Updated ', test);
            // Groups.findById(req.params.groupId).then(group=>{
            //     group.tests.push(test._id);
            //     group.save().then(()=>{
                    // Admins.findById(req.user._id)
                    // .populate('groups')
                    // .then((admin) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(test);
                    // })
                // })
            
            // },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
    });
createTestRouter.route('/:testId/question')
    .post(authenticate.verifyAdmin,(req,res,next)=>{
        var question;
        if(req.body.questionType==='1')
        {
            question={
                questionNo: req.body.questionNo,
                question:req.body.question,
                questionType:req.body.questionType,
                A:req.body.A,
                B:req.body.B,
                C:req.body.C,
                D:req.body.D,
                ans:req.body.ans,
                marks:req.body.marks,

            }
           // totalMarks:req.body.totalMarks  // questions:req.body.questions,
        }
        if(req.body.questionType==='2'||req.body.questionType==='3')
        {
            question={
                questionNo: req.body.questionNo,
                question:req.body.question,
                questionType:req.body.questionType,
                // A:req.body.A,
                // B:req.body.B,
                // C:req.body.C,
                // D:req.body.D,
                // ans:req.body.ans,
                marks:req.body.marks,

            }
        }
        Tests.findById(req.params.testId)
        .then((test) => {
            test.totalMarks= Number(test.totalMarks+question.marks),
            test.questions.push(question);
            test.save().then(()=>{
                console.log('Question Added ', test);
                // Groups.findById(req.params.groupId).then(group=>{
                // group.tests.push(test._id);
                // group.save().then(()=>{
                    // Admins.findById(req.user._id)
                    // .populate('groups')
                    // .then((admin) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(test);
                    // })
                // })

            // })
            
            
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
});

createTestRouter.route('/:testId/question')
    .put(authenticate.verifyAdmin,(req,res,next)=>{
        var question;
        if(req.body.questionType==='1')
        {
            question={
                questionNo: req.body.questionNo,
                question:req.body.question,
                A:req.body.A,
                B:req.body.B,
                C:req.body.C,
                D:req.body.D,
                ans:req.body.ans,
                marks:req.body.marks,

            }
           // totalMarks:req.body.totalMarks  // questions:req.body.questions,
        }
        if(req.body.questionType==='2'||req.body.questionType==='3')
        {
            question={
                questionNo: req.body.questionNo,
                question:req.body.question,
                // A:req.body.A,
                // B:req.body.B,
                // C:req.body.C,
                // D:req.body.D,
                // ans:req.body.ans,
                marks:req.body.marks,

            }
        }
        Tests.findById(req.params.testId)
        .then((test) => {
            test.totalMarks= req.body.totalMarks,
            test.questions[question.questionNo-1]=question;
            test.save().then(()=>{
                console.log('Question Added ', test);
                // Groups.findById(req.params.groupId).then(group=>{
                // group.tests.push(test._id);
                // group.save().then(()=>{
                    // Admins.findById(req.user._id)
                    // .populate('groups')
                    // .then((admin) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(test);
                    // })
                // })

            // })
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
});
createTestRouter.route('/:testId')
.get(authenticate.verifyAdmin,(req,res,next)=>{
    Tests.findById(req.params.testId).then((test)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(test);
    },err=>next(err))
    .catch(err=>next(err));
});

// createTestRouter.route('/:testId/pdfUpload')
// .post(authenticate.verifyAdmin,(req,res,next)=>{
//     Tests.findById(req.params.testId).then((test)=>{
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(test);
//     },err=>next(err))
//     .catch(err=>next(err));
// });





}, (err) => { console.log(err); });

module.exports=createTestRouter;
