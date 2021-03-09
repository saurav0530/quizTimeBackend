const mongoose= require('mongoose');
const Schema = mongoose.Schema;
var passportLocalMongoose= require('passport-local-mongoose');

const User = new Schema({
    firstname:{
        type:String,
    },
    lastname:{
        type:String,
    },
    email:{
        type:String,
    },
    groups:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Group'
    }],

},{
    timestamps:true
});

User.plugin(passportLocalMongoose);
module.exports=mongoose.model('User',User);