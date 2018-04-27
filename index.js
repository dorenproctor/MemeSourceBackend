'use strict';

const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/memesource');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Failed to connect to database'));
db.once('open', function() {
    console.log("We're connected");
});

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: { type: String, required: true },
    passwordConf: { type: String, required: true }
});
var User = mongoose.model('User', UserSchema);
// module.exports = User;

var CommentSchema = new mongoose.Schema({
    imageId: Number,
    content: { type: String, required: true },
    user: { type: ObjectId, ref: User },
    date: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
});
var Comment = mongoose.model('Comment', CommentSchema);

app.post('/user', function(req,res){
// console.log(req.body.email, req.body.username, req.body.password, req.body.passwordConf);
if (req.body.email && req.body.username &&
    req.body.password && req.body.passwordConf) {
        var userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            passwordConf: req.body.passwordConf,
        }
        //use schema.create to insert data into the db
        User.create(userData, function (err, user) {
            if (err) {
                res.send(err);
                console.log(err);
                // return next(err)
            } else {
                // return res.redirect('/profile');
                // res.send("Created user " + req.body.username);
                console.log("Created user " + req.body.username);
                const response = { statusCode: 200 }
                res.send(response);
            }
        });
    }
});


app.get('/', (req, res) => {
    console.log("hey!");
    res.send('HEY!');
})
app.get('/img/get/:id', (req, res) => {
    var params = {
        Bucket: 'memesourceimages',
        Key : req.params.id+'.jpg'
    };

    s3.getObject(params, function (err, data) {
    //handle error
    if (err) {
        console.log("Error: ", err);
        res.send(err);
    }
    if (data) {
        console.log("Data: ", data);
        const response = {
            statusCode: 200,
            data: data
        }
        res.send(response);
    }
    });
    console.log("req: ", req.query);
})
app.get('/comments/get', (req, res) => {
    res.send('Get comments!');
    console.log('Get comments!');
})
// app.get('/comments/post', (req, res) => {
//     res.send('post comments!');
// })

app.listen(3000, () => console.log('Server running on port 3000'));