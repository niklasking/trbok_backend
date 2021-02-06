const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const WattSchema = new Schema(
    {
        data: [
            { x: Number, y: Number }
        ],
        series_type: String
    },
    { collection: 'watt' }
);
module.exports = mongoose.model('Watt', WattSchema );
