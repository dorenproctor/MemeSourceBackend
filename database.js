'use strict'
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const schemas = require('./schemas')

//I think I can just export the database itself without the singleton without side effects
const SingletonDatabase = (() => {
  const instance
  return () => {
    if (!instance)
      instance = new Database()
    return instance
  }
})

module.exports = SingletonDatabase()

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
    const db = mongoose.connection
    db.on('error', console.error.bind(console, 'Failed to connect to database'))
    db.once('open', function () {
      console.log('Connected to Database')
    })
  }

  getImage(imageId,onFailure,onSuccess) {
    this.Image.findOne({ 'imageId': imageId }, function (err, dbEntry) {
      if (err) onFailure(err)
      else onSuccess(dbEntry)
    })
  }

  searchImages(query,sortBy,onFailure,onSuccess) {
    this.Image.find(query).sort(sortBy).exec(function (err, imgs) {
      if (err) onFailure(err)
      else {
        const idArray = []
        imgs.map(obj => { idArray.push(obj.imageId) })
        onSuccess(idArray)//()(idArray)
      }
    })
  }

  getUrls() {
    this.Image.find({}, { imageId: 1, _id: 0 }, function (err, imgs) {
      if (err) onFailure(err)
      else {
        const urls = []
        for (const img of imgs)
          urls.push({'url': 'http://ec2-18-188-44-41.us-east-2.compute.amazonaws.com/getImage/' + img.imageId})
        onSuccess(urls)
      }
    }).sort({ imageId: 1 })
  }

  getCommentInfo(imageId,onFailure,onSuccess) {
    this.Comment.find({ 'imageId': imageId }, function (err, comments) {
      if (err) onFailure(err)
      else if (!comments) onFailure('Image id not found') //is this the right error message?
      else onSuccess(comments)
    })
  }

  postComment(commentData,onFailure,onSuccess) {
    this.Comment.create(commentData, function (err, user) {
      if (err) onFailure(err)
      else onSuccess(user)
    })
  }

  deleteComment(id,onFailure,onSuccess) {
    this.Comment.findByIdAndRemove(id, function (err, removed) {
      if (err) onFailure(err)
      else if (!removed) onFailure('Comment not found to delete')
      else onSuccess(removed)
    })
  }

  createUser(userData,onFailure,onSuccess) {
    this.User.create(userData, function (err, user) {
      if (err) onFailure(err)
      else onSuccess(user)
    })
  }

  listUsers(onFailure,onSuccess) {
    this.User.find(function (err, users) {
      if (err) onFailure(err)
      else onSuccess(users)
    })
  }

  signIn(username,password,onFailure,onSuccess) {
    this.User.findOne({ 'username': username }, function (err, user) {
      if (err) onFailure(err)
      else if (!user) onFailure('Did not find user: '+username)
      else {
        bcrypt.compare(password, user.password).then(function(result) {
          if (result) onSuccess(user.username+' signed in')
          else onFailure('Password does not match')
        })
      }
    })
  }

  findUser(username,onFailure,onSuccess) {
    this.User.findOne({ 'username': username }, function (err, user) {
      if (err) onFailure(err)
      else if (!user) onFailure('User not found: '+err)
      else onSuccess(user)
    })
  }
  
  addUpvote(imageId,username,onFailure,onSuccess) {
    this.Image.updateOne({ 'imageId': imageId }, { $push: { upvoters: username }, 
                                  $inc: { upvotes: 1 } }, function (err, data) {
      if (err) onFailure(err)
      else onSuccess(username + ' upvoted ' + imageId)
    })
  }

  removeUpvote(imageId,username,onFailure,onSuccess) {
    this.Image.updateOne({ 'imageId': imageId }, { $pull: { upvoters: username },
                                  $inc: { upvotes: -1 } }, function (err, data) {
      if (err) onFailure(err)
      else onSuccess(username + ' removed upvote on Image' + imageId)
    })
  }

  addDownvote(imageId,username,onFailure,onSuccess) {
    this.Image.updateOne({ 'imageId': imageId }, { $push: { downvoters: username },
                                  $inc: { downvotes: 1 } }, function (err, data) {
      if (err) onFailure(err)
      else onSuccess(username + ' downvoted ' + imageId)
    })
  }

  removeDownvote(imageId,username,onFailure,onSuccess) {
    this.Image.updateOne({ 'imageId': imageId }, { $pull: { downvoters: username },
                              $inc: { downvotes: -1 } }, function (err, data) {
      if (err) onFailure(err)
      else onSuccess(username + ' removed downvote on Image' + imageId)
    })
  }
}