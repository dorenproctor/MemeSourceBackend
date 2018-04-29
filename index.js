'use strict';

const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const schemas = require('./schemas');

var UserModel = mongoose.model('User', schemas.User);
var CommentModel = mongoose.model('Comment', schemas.Comment);
var ImageModel = mongoose.model('Image', schemas.Image);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/ms');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Failed to connect to database'));
db.once('open', function() {
    console.log("Connected to Database");
});


app.put('/upvoteImage/:username/:imageId', function(req, res) {
    var username = req.params.username;
    var imageId = req.params.imageId;
    var upvoted = false;
    var downvoted = false;
    ImageModel.findOne({"imageId": imageId}, function(err, img) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (!img) {
            console.log("Couldn't find image");
            res.send("Couldn't find image");
        } else {
            if (img.upvoters.includes(username)) { upvoted = true; }
            if (img.downvoters.includes(username)) { downvoted = true; }
            if (!upvoted) { //add upvote
                ImageModel.updateOne({"imageId": imageId}, {$push: {upvoters: username}, $inc: {upvotes: 1}}, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                        return;
                    } else {
                        console.log(username+" upvoted "+imageId);
                    }
                });
            } else { //already upvoted. remove it
                ImageModel.updateOne({"imageId": imageId}, {$pull: {upvoters: username}, $inc: {upvotes: -1}}, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                        return;
                    } else {
                        console.log(username+" removed upvote on Image"+imageId);
                    }
                });
            }
            if (downvoted) { //remove downvote
                ImageModel.updateOne({"imageId": imageId}, {$pull: {downvoters: username}, $inc: {downvotes: -1}}, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                        return;
                    } else {
                        console.log("Downvote on Image "+imageId+" by "+username+" removed because of upvote");
                    }
                });
            }
            res.send({statusCode: 200});
        }
    });
});


app.put('/downvoteImage/:username/:imageId', function(req, res) {
    var username = req.params.username;
    var imageId = req.params.imageId;
    var upvoted = false;
    var downvoted = false;
    ImageModel.findOne({"imageId": imageId}, function(err, img) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (!img) {
            console.log("Couldn't find image");
            res.send("Couldn't find image");
        } else {
            if (img.upvoters.includes(username)) { upvoted = true; }
            if (img.downvoters.includes(username)) { downvoted = true; }
            if (!downvoted) { //add upvote
                ImageModel.updateOne({"imageId": imageId}, {$push: {downvoters: username}, $inc: {downvotes: 1}}, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                        return;
                    } else {
                        console.log(username+" downvoted "+imageId);
                    }
                });
            } else { //already upvoted. remove it
                ImageModel.updateOne({"imageId": imageId}, {$pull: {downvoters: username}, $inc: {downvotes: -1}}, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                        return;
                    } else {
                        console.log(username+" removed downvote on Image"+imageId);
                    }
                });
            }
            if (upvoted) { //remove downvote
                ImageModel.updateOne({"imageId": imageId}, {$pull: {upvoters: username}, $inc: {upvotes: -1}}, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                        return;
                    } else {
                        console.log("Upvote on Image "+imageId+" by "+username+" removed because of downvote");
                    }
                });
            }
            res.send({statusCode: 200});
        }
    });
});


app.post('/postComment', function(req, res){
    if ((req.body.imageId) && req.body.content && req.body.user) {
        var commentData = {
            imageId: req.body.imageId,
            content: req.body.content,
            user: req.body.user
        };
        CommentModel.create(commentData, function (err, user) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                console.log("Created comment", req.body.content);
                res.send(({statusCode: 200}));
            }
        });
    } else {
        res.send("The proper parameters were not passed");
    }
});


app.get('/getComments/:id', function(req, res) {
    CommentModel.find({"imageId": req.params.id}, function(err, comments) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (!comments) {
            console.log("Image id not found");
            res.send("Image id not found");
        } else {
            const response = {
                statusCode: 200,
                comments: comments
            }
            console.log(comments);
            res.send(comments);
        }
    });
});


app.delete('/deleteComment/:id', function(req, res) {
    CommentModel.findByIdAndRemove(req.params.id, function(err, removed) {
        if (err) {
            console.log(err);
            res.send(err);
        } else if (!removed) {
            console.log("Comment not found to delete");
            res.send("Comment not found to delete");
        } else {
            console.log("Comment removed: ", removed);
            res.send({ statusCode: 200 });
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
                console.log(err);
                res.send(err);
            } else {
                console.log("Created user " + req.body.username);
                res.send({ statusCode: 200 });
            }
        });
    }
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
        } else if (!user) {
            console.log("Didn't find user");
            res.send("Didn't find user");
        } else {
            if (req.params.password === user.password) {
                console.log(user.username, " signed in");
                res.send({statusCode: 200});
            } else {
                console.log(user, user.username, user.password, req.params.username, req.params.password);
                console.log("Password doesn't match");
                res.send("Password doesn't match");
            }
        }
    });
});


app.get('/getImage/:id', (req, res) => {
    ImageModel.findOne({"imageId": req.params.id}, function(err, dbEntry) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            var params = {
                Bucket: 'memesourceimages',
                Key : req.params.id+'.jpg'
            };
            // s3.getObject(params, function (err, data) {
            //     if (err) {
            //         console.log("Error: ", err);
            //         res.send(err);
            //     }
            //     if (data) {
            //         data.Metadata = dbEntry;
            //         const response = {
            //             statusCode: 200,
            //             data: data
            //         }
            //         console.log("Data: ", data);
            //         res.send(response);
            //     }
            // });
            console.log(dbEntry);
            res.send(dbEntry);
        }
    });
});

app.get('/', (req, res) => {
    console.log('Welcome to memesource');
    res.send('Welcome to memesource');
})

app.listen(3000, () => console.log('Server is running'));




// for (var i = 0; i<124; i++) {
//     var imageData = {
//         imageId: i,
//     };
//     ImageModel.create(imageData, function (err, image) {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log("Created image entry");
//             const response = { statusCode: 200 }
//         }
//     });
// }
