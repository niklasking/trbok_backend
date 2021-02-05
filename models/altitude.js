const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const AltitudeSchema = new Schema(
    {
        data: [
            { x: Number, y: Number }
        ],
        series_type: String
    },
    { collection: 'altitude' }
);
module.exports = mongoose.model('Altitude', AltitudeSchema );
