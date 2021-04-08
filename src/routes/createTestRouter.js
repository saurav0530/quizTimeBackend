

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');


const Groups= require('../models/group');
const Users= require('../models/user');
const Admins= require('../models/admin');
const Tests= require('../models/test');
const authenticate=require('../authenticate');
const constants=require('./../../constants');
const { group } = require('console');
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
            isQuestionInPDF : req.body.isQuestionInPDF,
            totalQuestions:req.body.totalQuestions,
            totalMarks:req.body.totalMarks,
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
    createTestRouter.route('/uploadAssignment/:testId')
    .post(authenticate.verifyAdmin,(req,res,next)=>{
        
        Tests.findById(req.params.testId)
        .then(async (test) => {
            var file = req.files.file.data;
            console.log(file);
            var filename=`static/${req.params.testId}.pdf`;
            // filename=`${req.params.testId}.pdf`
            try{
                fs.writeFileSync(filename, file,  "buffer");
                console.log("The file was saved!");
                test.questionPDF = filename;
                test.totalQuestions=req.body.totalQuestions
                test.totalMarks = req.body.totalMarks
                test.save().then(()=>{
                console.log('Assignment Updated', test);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(test);
                },err=>next(err))
            }catch{
                console.log(err);
                res.statusCode(609);
                res.json({err:err})
            }


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
        .then(() => {
            Tests.findById(req.params.testId).then(test1 =>{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(test1);
            })
        }, (err) => next(err))
        .catch((err) => next(err));  
    });
    createTestRouter.route('/edit/:testId')
    .delete(authenticate.verifyAdmin,(req,res,next)=>{
        const groupId=req.body.groupId;
        Tests.findByIdAndRemove(req.params.testId).then((resp)=>{
            Groups.findByIdAndUpdate(groupId,{$pull:{tests:req.params.testId}},(err,data)=>{
                if(err)
                {
                    res.status(500).json({error:"Error in Deletion "});
                }
                else{
                    res.status(200).json({Mssg:"Deleted Successfully "});
                }
            })
        })
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
                marks:req.body.marks,

            }
        }
        Tests.findById(req.params.testId)
        .then((test) => {
            console.log("Posting the question");
            test.totalMarks= Number(test.totalMarks)+Number(question.marks);
            test.totalQuestions=Number(test.totalQuestions)+1;
            test.questions.push(question);
            test.save().then(()=>{
                Tests.findById(req.params.testId).then((testnew)=>{
                    console.log('Question Added ', testnew);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(testnew);
                })
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
});

createTestRouter.route('/:testId/question')
    .put(authenticate.verifyAdmin,(req,res,next)=>{
        console.log("Edit Question Details");
        var question;
        if(req.body.questionType==='1')
        {
            question={
                questionType:req.body.questionType,
                questionNo: req.body.questionNo,
                question:req.body.question,
                A:req.body.A,
                B:req.body.B,
                C:req.body.C,
                D:req.body.D,
                ans:req.body.ans,
                marks:req.body.marks,
            }
        }
        if(req.body.questionType==='2'||req.body.questionType==='3')
        {
            question={
                questionType:req.body.questionType,
                questionNo: req.body.questionNo,
                question:req.body.question,
                marks:req.body.marks,
            }
        }
        Tests.findById(req.params.testId)
        .then((test) => {
            test.totalMarks= req.body.totalMarks,
            test.questions[question.questionNo-1]=question;
            test.save().then(()=>{
                console.log('Question Edited ', test);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(test);
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
});

createTestRouter.route('/:testId/question')
    .delete(authenticate.verifyAdmin,(req,res,next)=>{
        var qno = req.body.questionNo;
        Tests.findById(req.params.testId)
        .then((test) => {
            test.totalMarks -= test.questions[qno-1].marks;
            test.totalQuestions--;
            test.questions.splice(qno-1,1);
            for(var i=0; i<test.questions.length; i++)
            {
                test.questions[i].questionNo = i+1;
            }
            console.log(test.questions)
            // test.totalMarks= req.body.totalMarks,
            // test.questions[question.questionNo-1]=question;
            test.save().then(()=>{
                console.log('Question Edited ', test);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(test);
            },err=>next(err))
        }, (err) => next(err))
        .catch((err) => next(err));  
});
createTestRouter.route('/:testId')
.get(authenticate.verifyAdmin,(req,res,next)=>{

    console.log("Fetching Test Details");
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
