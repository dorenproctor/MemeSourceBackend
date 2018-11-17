'use strict'
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

var SingletonDatabase = (() => {
  var instance
  var getInstance = () => {
    if (!instance)
      instance = new Database()
    return instance
  }
  return getInstance
})()

module.exports = {Database: SingletonDatabase}

/* Available commands
getImage(imageId,onFailure,onSuccess)
searchImages(query,sortBy,onFailure,onSuccess)
getUrls()
getCommentInfo(imageId,onFailure,onSuccess)
postComment(commentData,onFailure,onSuccess)
deleteComment(id,onFailure,onSuccess)
createUser(userData,onFailure,onSuccess)
listUsers(onFailure,onSuccess)
signIn(username,password,onFailure,onSuccess)
findUser(username,onFailure,onSuccess)
addUpvote(imageId,username,onFailure,onSuccess)
removeUpvote(imageId,username,onFailure,onSuccess)
addDownvote(imageId,username,onFailure,onSuccess)
removeDownvote(imageId,username,onFailure,onSuccess)
*/

class Database {
  constructor() {
    this.User = mongoose.model('User', schemas.User)
    this.Comment = mongoose.model('Comment', schemas.Comment)
    this.Image = mongoose.model('Image', schemas.Image)
    mongoose.connect('mongodb://localhost/ms')
    var db = mongoose.connection
    db.on('error', console.error.bind(console, 'Failed to connect to database'))
    db.once('open', function () {
      console.log("Connected to Database")
    })
  }

  getImage(imageId,onFailure,onSuccess) {
    Image.findOne({ "imageId": imageId }, function (err, dbEntry) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(dbEntry)
      }
    })
  }

  searchImages(query,sortBy,onFailure,onSuccess) {
    Image.find(query).sort(sortBy).exec(function (err, imgs) {
      if (err) {
        onFailure()(err)
      } else {
        var idArray = []
        imgs.map(obj => { idArray.push(obj.imageId) })
        onSuccess()(idArray)
      }
    })
  }

  getUrls() {
    Image.find({}, { imageId: 1, _id: 0 }, function (err, imgs) {
      if (err) {
        onFailure()(err)
      } else {
        var urls = imgs.map(obj => {
          var newObj = {}
          var string = "http://ec2-18-188-44-41.us-east-2.compute.amazonaws.com/getImage/" + obj.imageId
          newObj["url"] = string
          return newObj
        })
        onSuccess()(urls)
      }
    }).sort({ imageId: 1 })
  }

  getCommentInfo(imageId,onFailure,onSuccess) {
    Comment.find({ "imageId": imageId }, function (err, comments) {
      if (err) {
        onFailure()(err)
      } else if (!comments) {
        onFailure()("Image id not found")
      } else {
        onSuccess()(comments)
      }
    })
  }

  postComment(commentData,onFailure,onSuccess) {
    Comment.create(commentData, function (err, user) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(user)
      }
    })
  }

  deleteComment(id,onFailure,onSuccess) {
    Comment.findByIdAndRemove(id, function (err, removed) {
      if (err) {
        onFailure()(err)
      } else if (!removed) {
        onFailure()("Comment not found to delete")
      } else {
        onSuccess()(removed)
      }
    })
  }

  createUser(userData,onFailure,onSuccess) {
    User.create(userData, function (err, user) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(user)
      }
    })
  }

  listUsers(onFailure,onSuccess) {
    User.find(function (err, users) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(users)
      }
    })
  }

  signIn(username,password,onFailure,onSuccess) {
    User.findOne({ "username": username }, function (err, user) {
      if (err) {
        onFailure()(err)
      } else if (!user) {
        onFailure()("Did not find user: "+username)
      } else {
        bcrypt.compare(password, user.password).then(function(result) {
          if (result) {
            onSuccess()(user.username+" signed in")
          } else {
            onFailure()("Password does not match")
          }
        })
      }
    })
  }

  findUser(username,onFailure,onSuccess) {
    User.findOne({ "username": username }, function (err, user) {
      if (err) {
        onFailure()(err)
      } else if (!user) {
        onFailure()("User not found: "+err)
      } else {
        onSuccess()(user)
      }
    })
  }
  
  addUpvote(imageId,username,onFailure,onSuccess) {
    Image.updateOne({ "imageId": imageId }, { $push: { upvoters: username }, 
                              $inc: { upvotes: 1 } }, function (err, data) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(username + " upvoted " + imageId)
      }
    })
  }

  removeUpvote(imageId,username,onFailure,onSuccess) {
    Image.updateOne({ "imageId": imageId }, { $pull: { upvoters: username },
                              $inc: { upvotes: -1 } }, function (err, data) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(username + " removed upvote on Image" + imageId)
      }
    })
  }

  addDownvote(imageId,username,onFailure,onSuccess) {
    Image.updateOne({ "imageId": imageId }, { $push: { downvoters: username },
                              $inc: { downvotes: 1 } }, function (err, data) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(username + " downvoted " + imageId)
      }
    })
  }

  removeDownvote(imageId,username,onFailure,onSuccess) {
    Image.updateOne({ "imageId": imageId }, { $pull: { downvoters: username },
                              $inc: { downvotes: -1 } }, function (err, data) {
      if (err) {
        onFailure()(err)
      } else {
        onSuccess()(username + " removed downvote on Image" + imageId)
      }
    })
  }
}


//closure!
/*var SingletonDatabase = (function () {
  var instance;

  function createInstance() {
      var object = new Database();
      return object;
  }

  return {
      getInstance: function () {
          if (!instance) {
              instance = createInstance();
          }
          return instance;
      }
  };
})();*/
