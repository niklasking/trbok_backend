const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const TimeSchema = new Schema(
    {
        data: [Number],
        series_type: String
    },
    { collection: 'time' }
);
module.exports = mongoose.model('Time', TimeSchema );
