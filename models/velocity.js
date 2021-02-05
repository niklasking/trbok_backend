const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const VelocitySchema = new Schema(
    {
        data: [
            { x: Number, y: Number }
        ],
        series_type: String
    }
);
module.exports = mongoose.model('Velocity', VelocitySchema );
