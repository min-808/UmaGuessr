const { Schema, model } = require('mongoose')

const userUID = new Schema({
    // user id
    _id: {
        type: String,
        required : true
    },

    // their uid
    uid: {
        type: Number,
        required: true,
        default: 0
    }

})

module.exports = model('saveUID', userUID)