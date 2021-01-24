const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const LapSchema = new Schema(    
    {
        id: Number,
        averageCadence: Number,
        averageSpeed: Number,
        distance: Number,
        elapsedTime: Number,
        startIndex: Number,
        endIndex: Number,
        lapIndex: Number,
        maxSpeed: Number,
        movingTime: Number,
        name: String,
        paceZone: Number,
        split: Number,
        startDate: Date,
        startDateLocal: Date,
        totalElevationGain: Number
    },
    { collection: 'lap' }
);
//module.exports = mongoose.model('Lap', LapSchema );
export default LapSchema;