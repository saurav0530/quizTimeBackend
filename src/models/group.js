const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    isPrivate:{
        type: Boolean,
        default: false
    },
    creator: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Admin'
    },
    tests:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Test'

    }],
    members:[{
        name:{
            type: String,
            required: true
        },
        uniqueID:{
            type: String,
            required: true
        },
        userID:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    }],
    pendingReq:[{
        name:{
            type: String,
            required: true
        },
        uniqueID:{
            type: String,
            required: true
        },
        userID:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'

        }
    }]
},{
    timestamps:true
});

var Groups= mongoose.model('Group',groupSchema);
module.exports= Groups;