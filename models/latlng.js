const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const LatLngSchema = new Schema(
    {
        data: [
            [Number]
        ],
        series_type: String
    },
    { collection: 'latlng' }
);
module.exports = mongoose.model('LatLng', LatLngSchema );
