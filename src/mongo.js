const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const { ObjectId } = require('mongodb')
const request = require("request")
const constants= require('../constants')


const connectionURL = constants.mongoURL
const databaseName = constants.databaseName

// ***** Function for connecting to database *****
const mongoConnect = async function(){
        return await MongoClient.connect( connectionURL, {useUnifiedTopology : true, useNewUrlParser : true})
}

// ***** Function for user registration *****
var registerFunction= function(data, userType){
    mongoConnect().then(async client =>{
        const db= client.db(databaseName)
        await db.collection(userType).insertOne(data);
        client.close()
    }).catch(err => console.log(err))

    return "Registration successful"
}

// ***** Checking username duplicacy *****
var usernameDuplicacyCheck = async (data , userType)=>{
    var existingUser
    await mongoConnect().then(async client =>{
        const db= client.db(databaseName)
        await db.collection(userType).findOne(data.username, user=>{
            existingUser = user
        });
        client.close()
    }).catch(err => console.log(err))

    if(existingUser)
        return "username already taken"
    return "available"
}

// ***** Finding user for login *****
var findUser = async (username, password, userType)=>{
    //console.log(username , password, userType)
    var findUserResults
    await mongoConnect().then(async client =>{
        const db= client.db(databaseName)
        await db.collection(`${userType}`).findOne({username : username}).then( user => {
            if( user.password == password)
                findUserResults = user 
        })
        client.close()
    })

    return findUserResults
}

// ***** Finding user by ID *****
var findUserByID = async (id, userType)=>{
    var findUserByIdResults
    await mongoConnect().then(async client =>{
        const db= client.db(databaseName)
        await db.collection(`${userType}`).findOne({_id : ObjectId(id)}).then( user => {
            findUserByIdResults = user 
        })
        client.close()
    })
    //console.log(findUserByIdResults)
    return findUserByIdResults
}


module.exports = {
    mongoConnect : mongoConnect,
    registerFunction: registerFunction,
    usernameDuplicacyCheck: usernameDuplicacyCheck,
    findUser : findUser,
    findUserByID : findUserByID
}

// const APIurl = "https://quiztimeapi.herokuapp.com/"
 
// var apicall= ()=>{
//     request(APIurl,{json: true}, (e, r, b)=>{
//         console.log(b)
//     })
// }
//apicall();
