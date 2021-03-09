const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Groups= require('../models/group');
const Users= require('../models/user');
const Admins= require('../models/admin');
const Tests= require('../models/test');

const constants=require('./../../constants');
const connect = mongoose.connect(constants.mongoURL,{ useNewUrlParser: true,useUnifiedTopology: true  });
const groupRouter=express.Router();
const authenticate=require('../authenticate');
const admin = require('../models/admin');

groupRouter.use(bodyParser.json());

connect.then((db) => {
    console.log("Connected correctly to server");

groupRouter.route('/')
// .get(authenticate.verifyAdmin,(req,res,next) => {
//     Admins.findById(req.user._id).then(admin=>{
//         admin.groups.push(group._id);
//         admin.save().then(()=>{
//             Admins.findById(req.user._id)
//             .populate('groups')
//             .then((admin) => {
//                 res.statusCode = 200;
//                 res.setHeader('Content-Type', 'application/json');
//                 res.json(admin.groups);
//             })
//         })
    
//     },err=>next(err))
// })
.post(authenticate.verifyAdmin, (req, res, next) => {
    var groupobj={
        name:req.body.name,
        creator:req.user._id,
        isPrivate: req.body.isPrivate
    }
    Groups.create(groupobj)
    .then((group) => {
        console.log('Group Created ', group);
        Admins.findById(req.user._id).then(admin=>{
            admin.groups.push(group._id);
            admin.save().then(()=>{
                Admins.findById(req.user._id)
                .populate('groups')
                .then((admin) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(admin.groups);
                })
            })
        
        },err=>next(err))
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /groups');
})
// .delete((req, res, next) => {
//     Groups.remove({})
//     .then((resp) => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(resp);
//     }, (err) => next(err))
//     .catch((err) => next(err));    
// });

groupRouter.route('/admingroups')
.get(authenticate.verifyAdmin,(req,res,next) => {
    Admins.findById(req.user._id)
            .populate('groups')
            .then((admin) => {
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(admin.groups);
            },err=>next(err))
            .catch((err) => next(err)); 
    });
groupRouter.route('/usergroups')
.get(authenticate.verifyUser,(req,res,next) => {
    Users.findById(req.user._id)
            .populate('groups')
            .populate({
                path:'groups',
                populate:{
                    path:'creator',
                    model:'Admin'
                }
            })
            .then((user) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user.groups);
            },err=>next(err))
            .catch((err) => next(err)); 
});
groupRouter.route('/:groupId')
.options((req, res) => { res.sendStatus(200); })
.get(authenticate.verifyAdmin, (req,res,next) => {
    Groups.findById(req.params.groupId)
    .populate('tests')
    .then((group) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(group);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post((req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /groups/'+ req.params.groupId);
})
.put((req, res, next) => {
    Groups.findByIdAndUpdate(req.params.groupId, {
        $set: req.body
    }, { new: true })
    .then((group) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(group);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Groups.findByIdAndRemove(req.params.groupId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err)
)});

groupRouter.route('/:groupId/member')
.options((req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Groups.findById(req.params.groupId)
    .then((group) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(group);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser,(req, res, next) => {
    Groups.findById(req.params.groupId)
    .then((group) => {
        var request= { 
            name: req.body.name,
            uniqueID:req.body.uniqueID,
            userID:req.user._id
        }
        if(group.isPrivate)
        {
            group.pendingReq.push(request)
            group.save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(group);
        }
        else{
            group.members.push(request)
            group.save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(group);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyAdmin,(req, res, next) => {
    var request;
    Groups.findByIdAndUpdate(
        req.params.groupId,
       { $pull: { 'pendingReq': {  _id: req.body.requestId } } },function(err,model){
          if(err){
               console.log(err);
               return res.send(err);
            }
         else{
            request=model;
        }
        }).then(()=>{
            var mem={
                name:req.body.name,
                uniqueID:req.body.uniqueID,
                userID:req.body.userID,
            }
            Groups.findByIdAndUpdate(
                req.params.groupId,
                { $push: {"members": mem}},
                {  safe: true, upsert: true},
                  function(err, model) {
                    if(err){
                       console.log(err);
                       return res.send(err);
                    }
                 });
        }).then(()=>{
            Users.findById(req.body.userID).then((user)=>
            {
                user.groups.push(req.params.groupId);
                user.save();
            })
        }).then(()=>{
            Admins.findById(req.user._id)
            .populate('groups')
            .then((admin) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(admin.groups);
            },err=>next(err))
            .catch((err) => next(err)); 
        })
})
.delete(authenticate.verifyAdmin,(req, res, next) => {
    console.log(req);
    Groups.findByIdAndUpdate(
        req.params.groupId,
       { $pull: { 'members': {  _id: req.body.memberId } } },function(err,model){
          if(err){
               console.log(err);
               return res.send(err);
            }
        }).then(()=>{
            Users.findById(req.body.userID).then(user=>{
            var index = user.groups.indexOf(req.params.groupId);
            if( index >= 0) {
                user.groups.splice(index,1);
                user.save()
            }
        }).then(()=>{
            Admins.findById(req.user._id)
            .populate('groups')
            .then((admin) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(admin.groups);
            },err=>next(err))
            .catch((err) => next(err)); 
        })
    });

})



groupRouter.route('/:groupId/removereq')
.delete(authenticate.verifyAdmin,(req,res,next)=>{
    Groups.findByIdAndUpdate(
        req.params.groupId,
       { $pull: { 'pendingReq': {  _id: req.body.requestId } } },function(err,model){
          if(err){
               console.log(err);
               return res.send(err);
            }
        }).then(()=>{
            Admins.findById(req.user._id)
            .populate('groups')
            .then((admin) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(admin.groups);
            },err=>next(err))
            .catch((err) => next(err)); 
        })
    });
});

groupRouter.route('/:groupId/test')
.post(authenticate.verifyAdmin,(req,res,next)=>{
    var Testobj={
        title:req.body.title,
        createdBy:req.user._id,
        duration: req.body.duration,
        subject:req.body.subject,
        startDate:req.body.startDate,
        totalMarks:req.body.totalMarks,
        questions:req.body.questions,
    }
    Tests.create(Testobj)
    .then((test) => {
        console.log('Test Created ', test);
        Groups.findById(req.params.groupId).then(group=>{
            group.tests.push(test._id);
            group.save().then(()=>{
                Admins.findById(req.user._id)
                .populate('groups')
                .then((admin) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(admin.groups);
                })
            })
        
        },err=>next(err))
    }, (err) => next(err))
    .catch((err) => next(err));  
});
// groupRouter.route('/student/:groupId')
// .get(authenticate.verifyUser, (req,res,next)=>{
//     Groups.findById(req.params.groupId)
//     .populate('tests').then(group=>{
//         var grouptoreturn={
//             name:group.name,
//             _id:group._id,

//         }
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(group);
//     },err=>next(err))
// });


module.exports=groupRouter;