const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors= require('cors');
const fs = require('fs')
const path = require('path')
var nodemailer=require("nodemailer")
const Groups= require('../models/group');
const Users= require('../models/user');
const Admins= require('../models/admin');
const Tests= require('../models/test');

const constants=require('./../../constants');
const connect = mongoose.connect(constants.mongoURL,{ useNewUrlParser: true,useUnifiedTopology: true  });
const forgotPassword=express.Router();
const authenticate=require('../authenticate');
const admin = require('../models/admin');
const { initialize } = require('passport');


const {ObjectId} = require('mongodb')

var generateOTP = function( timeNow )
{
    var ref;
    var id = timeNow
    var msec = ObjectId( id ).getTimestamp().getMilliseconds().toString()
    var yr = ObjectId( id ).getTimestamp().getFullYear().toString()%1000
    var mth = ObjectId( id ).getTimestamp().getMonth().toString()
    var dt = ObjectId( id ).getTimestamp().getDate().toString()
    var min = ObjectId( id ).getTimestamp().getMinutes().toString()
    var hrs = ObjectId( id ).getTimestamp().getHours().toString()
    var sec = ObjectId( id ).getTimestamp().getSeconds().toString()
    ref = msec + min + sec + hrs + mth + dt + yr 
    ref = Number(ref).toString(32)
   return ref
}
// generateOTP(ObjectId())

forgotPassword.use(bodyParser.json());
forgotPassword.use(cors());

connect.then((db) => {
    console.log("Connected correctly to server");

forgotPassword.route('/')
.post((req,res,next)=>{
    const username=req.body.username;
    const accType=req.body.userType;
    if(accType)
    {
        Admins.findByUsername(username).then(function(sanitizedUser){
            if (sanitizedUser){
                const otp = generateOTP(ObjectId());
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'noreply.quiztime@gmail.com',
                      pass: 'Abhay@128125'
                    }
                  });
                  
                  var mailOptions = {
                    from: 'noreply.quiztime@gmail.com',
                    to: `${sanitizedUser.email}`,
                    subject: 'OTP for Password Recovery',
                    text: `Hello ${sanitizedUser.firstname}! ,The OTP for ${sanitizedUser.username} is ${otp}. Please do not share this with anyone.`
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                      res.status(500).json({success:false,message:"Server Error"});
                    } else {
                      console.log('Email sent: ' + info.response);
                      res.status(200).json({success:true,OTP: otp});
                    }
                  });
               
               
            } else {
                res.status(200).json({success:false,message: 'This user does not exist'});
            }
        },function(err){
            console.error(err);
        })

    }
    else
    {
      Users.findByUsername(username).then(function(sanitizedUser){
        if (sanitizedUser){
            const otp = generateOTP(ObjectId());
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'noreply.quiztime@gmail.com',
                  pass: 'Abhay@128125'
                }
              });
              
              var mailOptions = {
                from: 'noreply.quiztime@gmail.com',
                to: `${sanitizedUser.email}`,
                subject: 'OTP for Password Recovery',
                text: `Hello ${sanitizedUser.firstname}! ,The OTP for ${sanitizedUser.username} is ${otp}. Please do not share this with anyone.`
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                  res.status(500).json({success:false,message:"Server Error"});
                } else {
                  console.log('Email sent: ' + info.response);
                  res.status(200).json({success:true,OTP: otp});
                }
              });
           
           
        } else {
            res.status(200).json({success:false,message: 'This user does not exist'});
        }
    },function(err){
        console.error(err);
    })

    }
    

})
forgotPassword.route('/changepass')
.post((req,res,next)=>{
    const username=req.body.username;
    const newpass=req.body.newpass;
    const accType=req.body.userType;
    if(accType)
    {
        Admins.findByUsername(username).then(function(sanitizedUser){
              if (sanitizedUser){
                  sanitizedUser.setPassword(newpass, function(){
                      sanitizedUser.save();
                      res.status(200).json({success:true,message: 'Password reset successful. Now login using your new Password'});
                  });
              } else {
                  res.status(500).json({success:false,message: 'This user does not exist'});
              }
          },function(err){
              console.error(err);
          })

    }
    else
    {
      Users.findByUsername(username).then(function(sanitizedUser){
        if (sanitizedUser){
            sanitizedUser.setPassword(newpass, function(){
                sanitizedUser.save();
                res.status(200).json({success:true,message: 'Password reset successful. Now login using your new Password'});
            });
        } else {
            res.status(500).json({success:false,message: 'This user does not exist'});
        }
      },function(err){
        console.error(err);
      })

    }
    

})
// userModel.findByUsername(email).then(function(sanitizedUser){
//     if (sanitizedUser){
//         sanitizedUser.setPassword(newPasswordString, function(){
//             sanitizedUser.save();
//             res.status(200).json({message: 'password reset successful'});
//         });
//     } else {
//         res.status(500).json({message: 'This user does not exist'});
//     }
// },function(err){
//     console.error(err);
// })

});


module.exports = forgotPassword;