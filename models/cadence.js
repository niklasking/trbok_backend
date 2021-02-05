const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const CadenceSchema = new Schema(
    {
        data: [
            [Number]
        ],
        series_type: String
    }
);
module.exports = mongoose.model('Cadence', CadenceSchema );
