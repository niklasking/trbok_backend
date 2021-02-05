const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const HeartrateSchema = new Schema(
    {
        data: [
            { x: Number, y: Number }
        ],
        series_type: String
    },
    { collection: 'heartrate' }
);
module.exports = mongoose.model('Heartrate', HeartrateSchema );
