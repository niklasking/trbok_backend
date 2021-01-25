const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const LapSchema = new Schema(    
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
);

const ActivitySchema = new Schema(    
    {
        name: String,
        distance: Number,
        movingTime: Number,
        totalElevationGain: Number,
        type: String,
        stravaId: Number,
        startDate: Date,
//        startDateLocal: Date,
        startLat: Number,
        startLong: Number,
        mapPolyline: String,
        averageSpeed: Number,
        maxSpeed: Number,
        averageCadence: Number,
        maxCadence: Number,
        averageHeartrate: Number,
        maxHeartRate: Number,
        elevationHighest: Number,
        elevationLowest: Number,
        title: String,
        ol: Number,
        night: Number, // Natt-OL
        quality: Number,
        lsd: Number, // Långpass,
        strength: Number,
        alternative: Number, // Alternativ träning
        forest: Number,
        path: Number,
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userStravaId: String,
        typePlanned: String,
        movingTimePlanned: Number,
        distancePlanned: Number,
        namePlanned: String,
        laps: [ LapSchema ]
},
    { collection: 'activity' }
);
module.exports = mongoose.model('Activity', ActivitySchema );