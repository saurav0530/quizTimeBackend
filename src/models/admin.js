const mongoose= require('mongoose');
const Schema = mongoose.Schema;
var passportLocalMongoose= require('passport-local-mongoose');

const Admin = new Schema({
    firstname:{
        type:String,
       
    },
    lastname:{
        type:String,
        // required:true
    },
    termAgree:{
        type:Boolean,
        default:true,
    },
    organisation:{
        type:String,
        // required:true
    },
    email:{
        type:String,
        // required:true,
    },
    groups:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Group'
    }],

},{
    timestamps:true
});

Admin.plugin(passportLocalMongoose);
module.exports=mongoose.model('Admin',Admin);