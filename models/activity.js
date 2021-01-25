const mongoose = require('mongoose');
//const LapSchema = require('./lapSchema');

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
    }
//    { collection: 'lap' }
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