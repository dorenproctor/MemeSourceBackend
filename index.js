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
    imageId: {type: Number, required: true },
    content: { type: String, required: true },
    user: { type: ObjectId, ref: User },
    date: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
});
var Comment = mongoose.model('Comment', CommentSchema);

app.post('/postComment', function(req, res){
    if ((req.body.imageId) && req.body.content && req.body.user) {
        var commentData = {
            imageId: req.body.imageId,
            content: req.body.content,
            user: req.body.user
        }
        Comment.create(commentData, function (err, user) {
            if (err) {
                res.send(err);
                console.log(err);
            } else {
                console.log("Created comment");
                const response = { statusCode: 200 }
                res.send(response);
            }
        });
    } else {
        res.send("The proper parameters were not passed");
    }
});

app.get('/getComments/:id', function(req, res) {
    Comment.find({"imageId": req.params.id}, function(err, comments) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            console.log(comments);
            const response = {
                statusCode: 200,
                comments: comments
            }
            res.send(comments);
        }
    });
});

app.delete('/deleteComment/:commentId', function(req, res) {
    Comment.findByIdAndRemove(req.params.commentId, function(err, removed) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (removed) {
            console.log("Comment removed: ", removed);
            res.send({ statusCode: 200 });
        } else {
            console.log("Comment not found to delete");
            res.send("Comment not found to delete");
        }
    });
});

app.post('/createUser', function(req, res){
if (req.body.email && req.body.username &&
    req.body.password && req.body.passwordConf) {
        var userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            passwordConf: req.body.passwordConf,
        }
        User.create(userData, function (err, user) {
            if (err) {
                res.send(err);
                console.log(err);
            } else {
                console.log("Created user " + req.body.username);
                res.send({ statusCode: 200 });
            }
        });
    }
});

app.delete('/deleteUser/:userId', function(req, res) {
    User.findByIdAndRemove(req.params.userId, function(err, removed) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (removed) {
            console.log("User removed: ", removed);
            res.send({ statusCode: 200 });
        } else {
            console.log("Comment not found to delete");
            res.send("Comment not found to delete");
        }
    });
});

app.get('/listUsers', function(req, res) {
    User.find(function(err, users) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            console.log(users);
            res.send(users);
        }
    });
});

app.get('/signIn/:username/:password', function(req, res) {
    User.findOne({"username": req.params.username}, function(err, user) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (user) {
            if (req.params.password === user.password) {
                console.log(user.username, " signed in");
                res.send({statusCode: 200});
            } else {
                console.log(user, user.username, user.password, req.params.username, req.params.password);
                console.log("Password doesn't match");
                res.send("Password doesn't match");
            }
        } else {
            console.log("Didn't find user");
            res.send("Didn't find user");
        }
    });
});



app.get('/getImage/:id', (req, res) => {
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

app.get('/', (req, res) => {
    console.log('Welcome to memesource');
    res.send('Welcome to memesource');
})

app.listen(3000, () => console.log('Server running on port 3000'));