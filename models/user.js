const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema(
    {
        username : {type: String, unique: true, required:true},
        email: String, 
        name: { type: String, required: true },
        useStrava: {type: Boolean, required: true},
        stravaId: String,
        refreshToken: String,
        accessToken: String,
        expiresAt: Number,
        private: Boolean,
        admin: Boolean
    },
    { collection: 'user'}    
);
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema );