const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ActivitySchema = new Schema(    
    {
        name: String,
        distance: Number,
        movingTime: Number,
        totalElevationGain: Number,
        type: String,
        stravaId: Number,
        startDate: Date,
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
        userStravaId: String
    },
    { collection: 'activity' }
);
module.exports = mongoose.model('Activity', ActivitySchema );