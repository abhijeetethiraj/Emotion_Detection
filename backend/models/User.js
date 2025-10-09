const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Add the role field with a default value

}, {
    timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', schema);

module.exports = User;
