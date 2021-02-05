const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const LapSchema = new Schema(    
    {
        data: [
            {
                id: Number,
                average_cadence: Number,
                average_speed: Number,
                distance: Number,
                elapsed_time: Number,
                start_index: Number,
                end_index: Number,
                lap_index: Number,
                max_speed: Number,
                moving_time: Number,
                name: String,
                pace_zone: Number,
                split: Number,
                start_date: Date,
                start_dateLocal: Date,
                total_elevation_gain: Number
            }
        ]
    },
    { collection: 'lap' }
);
module.exports = mongoose.model('Lap', LapSchema );
//export default LapSchema;