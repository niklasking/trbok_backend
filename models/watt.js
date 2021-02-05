const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const WattSchema = new Schema(
    {
        data: [
            [Number]
        ],
        series_type: String
    }
);
module.exports = mongoose.model('Watt', WattSchema );
