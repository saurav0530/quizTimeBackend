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
.delete(authenticate.verifyAdmin,(req, res, next) => {
    Groups.findByIdAndRemove(req.params.groupId).then((resp)=>{
        Admins.findByIdAndUpdate(req.user._id,{$pull:{groups:req.params.groupId}},(err,data)=>{
            if(err)
            {
                res.status(500).json({error:"Error in Deletion "});
            }
            else{
                res.redirect('/groups/admingroups');
            }
        })
    })

});

groupRouter.route('/:groupId/member')
.get((req,res,next) => {
    Groups.findById(req.params.groupId)
    .then((group) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(group);
    }, (err) => next(err))
    .catch((err) => next(err));
    res.sendStatus(200);
})
.post(authenticate.verifyUser,(req, res, next) => {
    Groups.findById(req.params.groupId)
    .then((group) => {
        var request= { 
            name: req.body.name,
            uniqueID:req.body.uniqueID,
            userID:req.user._id
        }
        console.log(group.members.find(e => console.log(`${e.userID}` == req.user._id)))
        if(group.members.find(e => `${e.userID}` == req.user._id) || group.pendingReq.find(e => `${e.userID}` == req.user._id))
        {
            res.status(409).send({warningMssg : "Already a member"})
        } 
        else 
        {
            if(group.isPrivate)
            {
                group.pendingReq.push(request)
                group.save();
                res.redirect('/groups/usergroups');
            }         
            else{
                group.members.push(request)
                group.save();
                Users.findById(req.user._id).then((user)=>
                {
                    user.groups.push(req.params.groupId);
                    user.save();
                })
                .then(() => res.redirect('/groups/usergroups'))
                
            }
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyAdmin,async (req, res, next) => {
    // var request;
    console.log("Request Made ");
    await Groups.findByIdAndUpdate(
       { _id :req.params.groupId},
       { $pull: { 'pendingReq': {  _id: req.body.requestId } },
         $addToSet:{"members":{ name:req.body.name,
            uniqueID:req.body.uniqueID,
            userID:req.body.userID}}},function(err,model){
          if(err){
               console.log(err);
               return res.send(err);
            }
         else{
            request=model;
        }});
    await Users.findById(req.body.userID).then((user)=>
            {
                user.groups.push(req.params.groupId);
                user.save();
            }
        ).then(()=>{
            Groups.findById(req.params.groupId)
            .then((group) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(group);
            },err=>next(err))
            .catch((err) => next(err)); 
        })
})
.delete(authenticate.verifyAdmin,(req, res, next) => {
    // console.log(req);
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
            Groups.findById(req.params.groupId)
            .then((group) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(group);
            },err=>next(err))
            .catch((err) => next(err));  
        })
    });

});



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
            Groups.findById(req.params.groupId)
            .then((group) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(group);
            },err=>next(err))
            .catch((err) => next(err)); 
        })
    });

});


module.exports=groupRouter;