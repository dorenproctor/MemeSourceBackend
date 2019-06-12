'use strict'
//pgrep node | xargs kill; sudo rm server.js;  sudo vim server.js
//nohup npm start &
const express = require('express')
const app = express()
const fs = require('fs')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const database = require('./database')
const db = database()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

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


//these closures allow the callback to accept parameters from both here and the db function
function standardOnSuccess(res) {
  return (content) => {
    console.log(content)
    res.send({ statusCode: 200, content: content })
  }
}

function onSuccessJustLog(res) {
  return (message) => {
    console.log(message)
  }
}

function standardOnFailure(res) {
  return (err) => {
    console.log(err)
    res.send({ statusCode: 400, message: err })
  }
}

app.get('/imageInfo/:id', function (req, res) {
  db.getImage(req.params.id,standardOnFailure(res),standardOnSuccess(res))
})

app.get('/getImage/:id', function (req, res) {
  console.log("Sending image " + req.params.id)
  const img = fs.readFileSync('./img/' + req.params.id + '.jpg')
  res.writeHead(200, { 'Content-Type': 'image/jpg' })
  res.end(img, 'binary')
})

app.post('/imageSearch', function(req, res) {
  const query = req.body.query || {}//{} //
  let sortBy = {}
  switch(req.body.sortBy) {
    case "newest":
      sortBy = {imageId: -1}
      break
    case "oldest":
      sortBy = {imageId: 1}
      break
    case "upvotes":
      sortBy = {upvotes: -1}
      break
    default:
      sortBy = {imageId: -1}
  }
  db.searchImages(query,sortBy,standardOnFailure(res),standardOnSuccess(res))
})

app.get('/urls', function (req, res) {
  db.getUrls(standardOnFailure(res),standardOnSuccess(res))
})

app.get('/commentInfo/:id', function (req, res) {
  db.getCommentInfo(req.params.id,standardOnFailure(res),standardOnSuccess(res))
})

app.post('/postComment', function (req, res) {
  if (req.body.imageId != null && req.body.content && req.body.user) {
    const commentData = {
      imageId: req.body.imageId,
      content: req.body.content,
      user: req.body.user
    }
    db.postComment(commentData,standardOnFailure(res),standardOnSuccess(res))
  } else {
    res.send({ statusCode: 400, message: "The proper parameters were not passed" })
  }
})

app.delete('/deleteComment/:id', function (req, res) {
  db.deleteComment(req.params.id,standardOnFailure(res),standardOnSuccess(res))
})

app.post('/createUser', function (req, res) {
  const username = req.body.username
  const password = req.body.password
  const email = req.body.email
  if (!email || !username || !password) {
      res.send({ statusCode: 400, message: "Email, username and password required" })
  } else {
    bcrypt.hash(password, 12).then(function(hash) {
      const userData = {
        email: email,
        username: username,
        password: hash,
      }
      db.createUser(userData,standardOnFailure(res),standardOnSuccess(res))
    })
  }
})

app.get('/listUsers', function (req, res) {
  db.listUsers(standardOnFailure(res),standardOnSuccess(res))
})

app.post('/signIn', function (req, res) {
  const username = req.body.username
  const password = req.body.password
  if (!username || !password) {
    res.send({ statusCode: 400, message: "Username and password required" })
  }
  db.signIn(username,password,standardOnFailure(res),standardOnSuccess(res))
})

app.put('/upvoteImage', function (req, res) {
  const username = req.body.username
  const imageId = req.body.imageId
  let upvoted = false
  let downvoted = false
  const returnImage = (res) => {
    return (message) => {
      console.log(message);
      db.getImage(imageId,standardOnFailure(res),standardOnSuccess(res))
    }
  }
  db.findUser(username,standardOnFailure(res),(user) => {
    db.getImage(imageId,standardOnFailure(res),(img) => {
      if (img.upvoters.includes(username)) upvoted = true
      if (img.downvoters.includes(username)) downvoted = true
      if (!upvoted) { //add upvote and remove downvote if it exists
        db.addUpvote(imageId,username,standardOnFailure(res),(message) => {
          console.log(message);
          if (downvoted)
            db.removeDownvote(imageId,username,standardOnFailure(res),returnImage(res))
          else 
            db.getImage(imageId,standardOnFailure(res),standardOnSuccess(res))
        })
      } else { //already upvoted. remove it
        db.removeUpvote(imageId,username,standardOnFailure(res),returnImage(res))
      }
    })
  })
})

app.put('/downvoteImage', function (req, res) {
  const username = req.body.username
  const imageId = req.body.imageId
  let upvoted = false
  let downvoted = false
  const returnImage = (res) => {
    return (message) => {
      console.log(message);
      db.getImage(imageId,standardOnFailure(res),standardOnSuccess(res))
    }
  }
  db.findUser(username,standardOnFailure(res), (user) => {
    db.getImage(imageId,standardOnFailure(res), (img) => {
      if (img.upvoters.includes(username)) upvoted = true
      if (img.downvoters.includes(username)) downvoted = true
      if (!downvoted) { //add upvote and remove downvote if it exists
        db.addDownvote(imageId,username,standardOnFailure(res),(message) => {
          console.log(message)
          if (upvoted)
            db.removeUpvote(imageId,username,standardOnFailure(res),returnImage(res))
          else
            db.getImage(imageId,standardOnFailure(res),standardOnSuccess(res))
        })
      } else { //already upvoted. remove it
        db.removeDownvote(imageId,username,standardOnFailure(res),returnImage(res))
      }
    })
  })
})

app.put('/addTag', function(req, res) {
  const {imageId, tag, username} = req.body
  console.log('received: '+imageId, tag, username)
  db.addTag(imageId,tag,username,standardOnFailure(res), standardOnSuccess(res))
})

app.put('/removeTag', function(req, res) {
  const {imageId, tag, username} = req.body
  db.removeTag(imageId,tag,username,standardOnFailure(res), standardOnSuccess(res))
})

app.get('/', function(req, res) {
  console.log('Welcome to memesource')
  res.send({ statusCode: 200 , message: 'Welcome to memesource' })
})

app.listen(3000, () => console.log('Server is running'))




// for (let i = 0 i<124 i++) {
//     const imageData = {
//         imageId: i,
//     }
//     Image.create(imageData, function (err, image) {
//         if (err) {
//             console.log(err)
//         } else {
//             console.log("Created image entry")
//             const response = { statusCode: 200 }
//         }
//     })
// }
