'use strict';

const express = require('express');
const app = express();
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const schemas = require('./schemas');
const bcrypt = require('bcrypt');

var User = mongoose.model('User', schemas.User);
var Comment = mongoose.model('Comment', schemas.Comment);
var Image = mongoose.model('Image', schemas.Image);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/ms');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Failed to connect to database'));
db.once('open', function () {
  console.log("Connected to Database");
});

/* available commands:
    /imageInfo/:id
    /getImage/:id
    /urls
    /commentInfo/:id
    /postComment //takes a json object with post call
    /deleteComment/:id
    /createUser //takes a json object with post call
    /listUsers
    /signIn/:username/:password
    /upvoteImage/:username/:imageId
    /downvoteImage/:username/:imageId
*/


app.get('/imageInfo/:id', function (req, res) {
  Image.findOne({ "imageId": req.params.id }, function (err, dbEntry) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log(dbEntry);
      res.send(dbEntry);
    }
  });
});


app.get('/getImage/:id', function (req, res) {
  // var params = {
  //     Bucket: 'memesourceimages',
  //     Key : req.params.id+'.jpg'
  // };
  // s3.getObject(params, function (err, data) {
  //     if (err) {
  //         console.log("Error: ", err);
  //         res.send(err);
  //     }
  //     if (data) {
  //         // data.Metadata = dbEntry;
  //         // const response = {
  //         //         statusCode: 200,
  //         //     data: data
  //         // }
  //         console.log("Data: ", data);
  //         res.send(data);
  //     }
  // });
  console.log("Sending image " + req.params.id);
  var img = fs.readFileSync('./img/' + req.params.id + '.jpg');
  res.writeHead(200, { 'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

app.get('/urls', function (req, res) {
  Image.find({}, { imageId: 1, _id: 0 }, function (err, imgs) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      var urls = imgs.map(obj => {
        var newObj = {};
        var string = "http://ec2-18-188-44-41.us-east-2.compute.amazonaws.com/getImage/" + obj.imageId;
        newObj["url"] = string;
        return newObj;
      });
      res.send({ urls: urls });
    }
  }).sort({ imageId: 1 });
});


app.get('/commentInfo/:id', function (req, res) {
  Comment.find({ "imageId": req.params.id }, function (err, comments) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (!comments) {
      console.log("Image id not found");
      res.send({ statusCode: 400, message: "Image id not found" });
    } else {
      // const response = {
      //     statusCode: 200,
      //     comments: comments
      // }
      console.log(comments);
      res.send(comments);
    }
  });
});


app.post('/postComment', function (req, res) {
  if (req.body.imageId && req.body.content && req.body.user) {
    var commentData = {
      imageId: req.body.imageId,
      content: req.body.content,
      user: req.body.user
    };
    Comment.create(commentData, function (err, user) {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        console.log("Created comment", req.body.content);
        res.send({ statusCode: 200 });
      }
    });
  } else {
    res.send({ statusCode: 400, message: "The proper parameters were not passed" });
  }
});


app.delete('/deleteComment/:id', function (req, res) {
  Comment.findByIdAndRemove(req.params.id, function (err, removed) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (!removed) {
      console.log("Comment not found to delete");
      res.send({ statusCode: 400, message: "Comment not found to delete" });
    } else {
      console.log("Comment removed: ", removed);
      res.send({ statusCode: 200 });
    }
  });
});


app.post('/createUser', function (req, res) {
  if (!req.body.email || !req.body.username ||
    !req.body.password) {
      res.send({ statusCode: 400, message: "Email, username and password required" });
  } else {
    bcrypt.hash(req.body.password, 12).then(function(hash) {
      console.log("ASFSDFSDF ", hash);
      var userData = {
        email: req.body.email,
        username: req.body.username,
        password: hash,
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
    });
  }
});


app.get('/listUsers', function (req, res) {
  User.find(function (err, users) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log(users);
      res.send(users);
    }
  });
});


app.post('/signIn', function (req, res) {
  if (!req.body.username || !req.body.password) {
    res.send({ statusCode: 400, message: "Username and password required" });
  }
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ "username": username }, function (err, user) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (!user) {
      console.log("Did not find user: ", username);
      res.send({ statusCode: 400, message: "Did not find user" });
    } else {
      bcrypt.compare(password, user.password).then(function(result) {
        if (result) {
          console.log(user.username, " signed in");
          res.send({ statusCode: 200, message: "Sign In verified" });
        } else {
          console.log("Password does not match");
          res.send({ statusCode: 400, message: "Password does not match" });
        }
      });
    }
  });
});





app.put('/upvoteImage/:username/:imageId', function (req, res) {
  var username = req.params.username;
  var imageId = req.params.imageId;
  var upvoted = false;
  var downvoted = false;
  Image.findOne({ "imageId": imageId }, function (err, img) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (!img) {
      console.log("Could not find image");
      res.send({ statusCode: 400, message: "Could not find image" });
    } else {
      if (img.upvoters.includes(username)) { upvoted = true; }
      if (img.downvoters.includes(username)) { downvoted = true; }
      if (!upvoted) { //add upvote
        Image.updateOne({ "imageId": imageId }, { $push: { upvoters: username }, $inc: { upvotes: 1 } }, function (err, data) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          } else {
            console.log(username + " upvoted " + imageId);
          }
        });
      } else { //already upvoted. remove it
        Image.updateOne({ "imageId": imageId }, { $pull: { upvoters: username }, $inc: { upvotes: -1 } }, function (err, data) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          } else {
            console.log(username + " removed upvote on Image" + imageId);
          }
        });
      }
      if (downvoted) { //remove downvote
        Image.updateOne({ "imageId": imageId }, { $pull: { downvoters: username }, $inc: { downvotes: -1 } }, function (err, data) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          } else {
            console.log("Downvote on Image " + imageId + " by " + username + " removed because of upvote");
          }
        });
      }
      res.send({ statusCode: 200 });
    }
  });
});


app.put('/downvoteImage/:username/:imageId', function (req, res) {
  var username = req.params.username;
  var imageId = req.params.imageId;
  var upvoted = false;
  var downvoted = false;
  Image.findOne({ "imageId": imageId }, function (err, img) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (!img) {
      console.log("Could not find image");
      res.send({ statusCode: 400, message: "Could not find image" });
    } else {
      if (img.upvoters.includes(username)) { upvoted = true; }
      if (img.downvoters.includes(username)) { downvoted = true; }
      if (!downvoted) { //add upvote
        Image.updateOne({ "imageId": imageId }, { $push: { downvoters: username }, $inc: { downvotes: 1 } }, function (err, data) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          } else {
            console.log(username + " downvoted " + imageId);
          }
        });
      } else { //already upvoted. remove it
        Image.updateOne({ "imageId": imageId }, { $pull: { downvoters: username }, $inc: { downvotes: -1 } }, function (err, data) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          } else {
            console.log(username + " removed downvote on Image" + imageId);
          }
        });
      }
      if (upvoted) { //remove downvote
        Image.updateOne({ "imageId": imageId }, { $pull: { upvoters: username }, $inc: { upvotes: -1 } }, function (err, data) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          } else {
            console.log("Upvote on Image " + imageId + " by " + username + " removed because of downvote");
          }
        });
      }
      res.send({ statusCode: 200 });
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
//     Image.create(imageData, function (err, image) {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log("Created image entry");
//             const response = { statusCode: 200 }
//         }
//     });
// }
