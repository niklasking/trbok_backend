const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const DaySchema = new Schema(    
    {
        startDate: Date,
        skada: { type: Number, default: 0},
        sjuk: { type: Number, default: 0},
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { collection: 'day' }
);
module.exports = mongoose.model('Day', DaySchema );