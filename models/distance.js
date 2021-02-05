const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const DistanceSchema = new Schema(
    {
        data: [Number],
        series_type: String
    },
    { collection: 'distance' }
);
module.exports = mongoose.model('Distance', DistanceSchema );
