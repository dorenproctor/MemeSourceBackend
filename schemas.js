const mongoose = require('mongoose');

// Why are schemas and models capitalize?
// No clue. That's the way it's done in the docs and examples.
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

var CommentSchema = new mongoose.Schema({
    imageId: { type: Number, required: true },
    content: { type: String, required: true },
    user: { type: String, required: true },
    date: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    upvoters: [String],
    downvoters: [String],
});

var ImageSchema = new mongoose.Schema({
    imageId: {type: Number, required: true, unique: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    upvoters: [String],
    downvoters: [String],
    description: {type: String, default: ""},
    tags: [String]
});

module.exports = {
    User: UserSchema,
    Comment: CommentSchema,
    Image: ImageSchema
}