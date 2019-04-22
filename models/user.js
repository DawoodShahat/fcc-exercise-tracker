const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    }
});

userSchema.post('save', (err, doc, next) => {
    if(err.name === 'MongoError' && err.code === 11000){
        next(new Error("Duplicate entry error"));
    }else {
        next();
    }
});

module.exports = user = mongoose.model('user', userSchema);