const mongoose= require('mongoose');
const Schema = mongoose.Schema;
const testSchema = new Schema({
    title :{
        type: String,
        required: true
    },
    createdBy:{  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    duration:{
        type:Number,
        required:true
    },
    subject:{
        type:String,
        required:true
    },
    startDate:{
        type:Date,
        required:true
    },
    totalMarks:{
        type:Number,
        default:0
    },
    testType:{
        type:String,
    },
    studentMarks:[{
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
        },
        marks:{
            type:Number,
            default:0,
        },
        answers:[{
            questionNo:{
                type:Number,
            },
            markedAns:{
                type:String,
            }
        }],
        file:{
            type:Object,
            default:{}
        },
    }],
    isQuestionInPDF:{
        type: Boolean,
        required: true,
        default: false
    },
    questionPDF:{
        type: Buffer
    },
    questions:[{
        questionNo:{
            type:Number,
            required:true
        },
        questionType:{
            type:String,
            default:'1'
        },
        question:{
            type:String,
            required:true
        },
        A:{
            type:String,
            
        },
        B:{
            type:String,
            // required:true
        },
        C:{
            type:String,
            // required:true
        },
        D:{
            type:String,
            // required:true
        },
        ans:{
            type:String,
            // required:true
        },
        marks:{
            type:Number,
            required:true
        }
    }]
},{
    timestamps:true
});

var Tests= mongoose.model('Test',testSchema);
module.exports= Tests;