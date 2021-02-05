const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const AltitudeSchema = new Schema(
    {
        data: [
            [Number]
        ],
        series_type: String
    },
    { collection: 'altitude' }
);
module.exports = mongoose.model('Altitude', AltitudeSchema );
