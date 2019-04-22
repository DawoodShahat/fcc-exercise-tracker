const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let exerciseSchema = new Schema({
    _id: { type: String, required: true },
    username: { type: String, required: true },
    log: [{
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: Date, default: Date.now }
    }]
});

module.exports = exercise = mongoose.model('exercise', exerciseSchema);
