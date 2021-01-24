const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const moment = require('moment');
const axios = require('axios');
const passport = require('passport');
//const connectEnsureLogin = require('connect-ensure-login');
//const bodyParser = require('body-parser');
const User = require('./models/user');
const Activity = require('./models/activity');
const Day = require('./models/day');
const secret = require('./secret');

const expressSession = require('express-session')({
    secret: 'Kingenvandraderuntsj#n64tre3varv',
    resave: false,
    saveUninitialized: false
});

const app = express();
const port = 3333;

let loggedInUser = null; 
let userData = null;

mongoose.connect('mongodb://localhost/trdagbok', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected! 
});
/*
app.use(function (req, res, next) {
//  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Origin', 'https://trbok.niklasking.com');
//    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('"Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});
*/
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

//passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const LocalStrategy = require('passport-local').Strategy; 
passport.use(new LocalStrategy(User.authenticate()));

    
    

authorize = async (stravaUserId) => {
//    console.log('Authorize: ' + stravaUserId);
    try {
        const user = await User.find({ stravaId: stravaUserId });
        if (user === null) {
            return null;
        } else if (user.length === 0) {
            return null;
        }
//        console.log('** Found user: ' + user);
        const response = await axios.post('https://www.strava.com/api/v3/oauth/token', {
            client_id: secret.clientID,
            client_secret: secret.clientSecret,
            refresh_token: user[0].refreshToken,
            grant_type: 'refresh_token'
        });
//        console.log('Refresh: ' + response.data.refresh_token);
//        console.log('Access: ' + response.data.access_token);
//        console.log('Expires: ' + response.data.expires_at);
        user[0].refreshToken = response.data.refresh_token;
        user[0].accessToken = response.data.access_token;
        user[0].expiresAt = response.data.expires_at;
        const refreshUser = await user[0].save();

        const foundUserData = {
            _id: user[0]._id,
            accessToken: response.data.access_token
        }
        userData = foundUserData;
        return userData.accessToken;
    } catch(err) {
        console.log(err);
        return null;
    }

}

getStravaActivities = async (accessToken) => {
    try {
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        return response.data;
    } catch(err) {
        console.log(err);
        return [];
    }
};
getAdditionalBeforeStravaActivities = async (accessToken, before) => {
    try {
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities?per_page=200&before=' + before, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        return response.data;
    } catch(err) {
        console.log(err);
        return [];
    }
};
getAdditionalBetweenStravaActivities = async (accessToken, before, after) => {
    try {
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities?per_page=200&before=' + before + '&after=' + after, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        return response.data;
    } catch(err) {
        console.log(err);
        return [];
    }
};
getStravaLaps = async (accessToken, activityId) => {
    try {
        const response = await axios.get('https://www.strava.com/api/v3/activities/' + activityId + '/laps', {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        return response.data;
    } catch(err) {
        console.log(err);
        return [];
    }
};

getStravaActivity = async (accessToken, activityId) => {
    try {
        const response = await axios.get('https://www.strava.com/api/v3/activities/' + activityId, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        return response.data;
    } catch(err) {
        console.log(err);
        return [];
    }
};

app.get('/api/v1/summary/week', async (req, res) => {
    try {
        const dateStart = new Date(req.query.dateStart);
        const dateEnd = new Date(req.query.dateEnd);
        const result = await Activity.aggregate([ { $match: { userStravaId: req.query.userStravaId, startDate: {$gte: dateStart, $lte: dateEnd } } }, { $group: { _id: { year: { $isoWeekYear: "$startDate" }, week: { $isoWeek: "$startDate" } }, sumTime: { $sum: "$movingTime" }, sumLength: { $sum: "$distance" } } }, { $sort: { _id: 1 } } ]);
        res.status(200).send(result);
    } catch(err) {
        console.log('Find error: ' + err);
        res.status(400).send("Hittade inga aktiviteter");
    }        
});
app.get('/stravaCallback', async (req, res) => {
    if (req.query.error !== undefined) {
        console.log('Strava error: ' + req.query.error);
        res.status(500).send('Strava error: ' + req.query.error);
    } else {
        try {
            const userId = req.query.state;
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: secret.clientID,
                client_secret: secret.clientSecret,
                code: req.query.code,
                grant_type: 'authorization_code'
            });
            const userDetails = {
                expiresAt: response.data.expires_at,
                refreshToken: response.data.refresh_token,
                accessToken: response.data.access_token,
                stravaId: response.data.athlete.id
            }
            await User.findByIdAndUpdate(userId, userDetails, { upsert: true });

            res.redirect('/api/v1/strava/activities?stravaId=' + userDetails.stravaId);
        } catch(err) {
            console.log('Strava exchange error: ' + err);
            res.status(500).send('Strava exchange error: ' + err);
        }
    }
});
app.post('/api/v1/registerStrava', function (req, res) {
    axios.get('https://www.strava.com/oauth/authorize', {
        client_id: secret.clientID,
        redirect_uri: 'https://trbokbackend.niklasking.com/stravaCallback',
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'activity:read_all',
        state: req.body.userId
    });
    res.status(200).send('OK');
});

app.post('/api/v1/login',  function(req, res) {
//    res.send(loggedInUser);
    if(!req.body.username){ 
        res.json({success: false, message: "Username was not given"}) 
    } else { 
        if(!req.body.password){ 
            res.json({success: false, message: "Password was not given"}) 
        }else{ 
            passport.authenticate('local', function (err, user, info) {  
                if(err){ 
                    res.json({success: false, message: err}) 
                } else{ 
                    if (! user) { 
                        res.json({success: false, message: 'username or password incorrect'}) 
                    } else{ 
                        req.login(user, function(err){ 
                        if(err){ 
                            console.log('error: ' + err);
                            res.json({success: false, message: err}) 
                        }else{ 
//                            console.log(user);
//                            const token =  jwt.sign({userId : user._id,  
//                            username:user.username}, secretkey,  
//                                {expiresIn: '24h'}) 
//                            res.json({success:true, message:"Authentication successful", token: token });
                            const foundUser = {
                                admin: user.admin,
                                email: user.email,
                                name: user.name,
                                private: user.private,
                                stravaId: user.stravaId,
                                useStrava: user.useStrava,
                                _id: user._id
                            };
                            res.json({success:true, message:"Authentication successful", user: foundUser }); 
//                            res.json({success:true, message:"Authentication successful", user: user }); 
                        } 
                        }) 
                    } 
                } 
            })(req, res); 
        } 
    } 
});
app.post('/api/v1/register', function(req, res) {
    Users=new User({
        email: req.body.email, 
        username : req.body.username,
        name: req.body.name,
        refreshToken: '',
        accessToken: '',
        expiresAt: 0,
        stravaId: '',
        private: req.body.private,
        useStrava: req.body.useStrava,
        admin: false
    }); 
  
    User.register(Users, req.body.password, function(err, user) { 
    if (err) { 
        res.json({success:false, message:"Your account could not be saved. Error: ", err})  
    }else{ 
        res.json({success: true, message: "Your account has been saved", user: user}) 
    } 
    }); 
});
app.get('/api/v1/activities', async (req, res) => {
    try {
//        console.log('Saving... ' + req.query.user);
        const dateStart = req.query.dateStart;
        const dateEnd = req.query.dateEnd;
        const result = await Activity.find({ user: req.query.user, startDate: {$gte: dateStart, $lte: dateEnd } }).sort({startDate: 1});
//        console.log('Find success: ' + result);
        res.status(200).send(result);
    } catch(err) {
//        console.log('Find error: ' + err);
        res.status(400).send("Hittade inga aktiviteter");
    }
});
app.post('/api/v1/activities', async (req, res) => {
    try {
        const activity = new Activity(
            {
                startDate: new Date(req.body.startDate),
                startDateLocal: new Date(req.body.startDate),
                name: req.body.name,
                distance: req.body.distance,
                type: req.body.type,
                movingTime: req.body.movingTime,
                ol: req.body.ol,
                night: req.body.night,
                quality: req.body.quality,
                lsd: req.body.lsd,
                strength: req.body.strength,
                alternative: req.body.alternative,
                forest: req.body.forest,
                path: req.body.path,
                user: req.body.user._id,
                userStravaId: req.body.user.stravaId,
                typePlanned: req.body.typePlanned,
                movingTimePlanned: req.body.movingTimePlanned,
                distancePlanned: req.body.distancePlanned,
                namePlanned: req.body.namePlanned
            }
        );
        console.log(activity);
        const result = await activity.save();
        res.status(200).send(result);
    } catch(err) {
        console.log(err);
        res.status(400).send("Det gick inte att skapa en aktivitet");
    }
});
app.patch('/api/v1/activities', async (req, res) => {
    try {
        const activity = {
            name: req.body.name,
            distance: req.body.distance,
            type: req.body.type,
            movingTime: req.body.movingTime,
            ol: req.body.ol,
            night: req.body.night,
            quality: req.body.quality,
            lsd: req.body.lsd,
            strength: req.body.strength,
            alternative: req.body.alternative,
            forest: req.body.forest,
            path: req.body.path,
            typePlanned: req.body.typePlanned,
            movingTimePlanned: req.body.movingTimePlanned,
            distancePlanned: req.body.distancePlanned,
            namePlanned: req.body.namePlanned
    };
        const result = await Activity.findByIdAndUpdate(req.body._id, activity, { upsert: true });
        res.status(200).send(result);
    } catch(err) {
//        console.log('Save error: ' + err);
        res.status(400).send("Det gick inte att ändra en aktivitet. " + err);
    }
});
app.delete('/api/v1/activities/:id', async (req, res) => {
    try {
        const result = await Activity.findByIdAndRemove(req.params.id);
        res.status(200).send(result);
    } catch(err) {
//        console.log('Save error: ' + err);
        res.status(400).send("Det gick inte att ta bort en aktivitet. " + err);
    }
});
app.get('/api/v1/strava/activities', (req, res) => {
    const userStravaId = req.query.stravaId;
    authorize(userStravaId)
    .then( accessToken => getStravaActivities(accessToken))
    .then( result => {
        result.map( item => {
            try {
                const startTime = moment(item.start_date).format('HH:mm');
                const lsd = item.moving_time > 5400 ? 1 : 0;
                const strength = item.type === 'WeightTraining' ? 1 : 0;
                const alternative = item.type === 'Swim' || item.type === 'Ride' || item.type === 'VirtualRide' || item.type === 'Walk' || item.type === 'Workout' || item.type === 'Kayaking' || item.type === 'Rowing' || item.type === 'NordicSki' ? 1 : 0;
                const activity = new Activity(
                    {
                        name: startTime + ' ' + item.name,
                        distance: item.distance,
                        movingTime: item.moving_time,
                        totalElevationGain: item.total_elevation_gain,
                        type: item.type,
                        stravaId: item.id,
                        startDate: new Date(item.start_date),
//                        startDateLocal: new Date(item.start_date_local),
                        startLat: item.start_latitude,
                        startLong: item.start_longitude,
                        mapPolyline: item.map.summary_polyline,
                        averageSpeed: item.average_speed,
                        maxSpeed: item.max_speed,
                        averageCadence: item.average_cadence,
                        maxCadence: item.max_cadense,
                        averageHeartrate: item.average_heartrate,
                        maxHeartRate: item.max_heartrate,
                        elevationHighest: item.elev_high,
                        elevationLowest: item.elev_low,
                        user: userData._id,
                        userStravaId: userStravaId,
                        title: startTime,
                        ol: 0,
                        night: 0, // Natt-OL
                        quality: 0,
                        lsd: lsd, // Långpass,
                        strength: strength,
                        alternative: alternative,
                        forest: 0,
                        path: 0
                    }
                );
                activity.save();
            } catch(err) {
                console.log(err);
                res.status(400).json({ success: false, message: err.message });
            }        
        })
        // ******** UPPDATERA MED HTTPS **********
        res.redirect('https://trbok.niklasking.com');
    })
    .catch( err => res.send([]));

});
app.get('/api/v1/strava/activities/before', (req, res) => {
    const before = req.query.before;
    const userStravaId = req.query.stravaId;
    authorize(userStravaId)
    .then( accessToken => getAdditionalBeforeStravaActivities(accessToken, before))
    .then( result => {
        result.map( item => {
            try {
                const startTime = moment(item.start_date).format('HH:mm');
                const lsd = item.moving_time > 5400 ? 1 : 0;
                const strength = item.type === 'WeightTraining' ? 1 : 0;
                const alternative = item.type === 'Swim' || item.type === 'Ride' || item.type === 'VirtualRide' || item.type === 'Walk' || item.type === 'Workout' ? 1 : 0;
                const activity = new Activity(
                    {
                        name: startTime + ' ' + item.name,
                        distance: item.distance,
                        movingTime: item.moving_time,
                        totalElevationGain: item.total_elevation_gain,
                        type: item.type,
                        stravaId: item.id,
                        startDate: new Date(item.start_date),
//                        startDateLocal: new Date(item.start_date_local),
                        startLat: item.start_latitude,
                        startLong: item.start_longitude,
                        mapPolyline: item.map.summary_polyline,
                        averageSpeed: item.average_speed,
                        maxSpeed: item.max_speed,
                        averageCadence: item.average_cadence,
                        maxCadence: item.max_cadense,
                        averageHeartrate: item.average_heartrate,
                        maxHeartRate: item.max_heartrate,
                        elevationHighest: item.elev_high,
                        elevationLowest: item.elev_low,
                        user: userData._id,
                        userStravaId: userStravaId,
                        title: startTime,
                        ol: 0,
                        night: 0, // Natt-OL
                        quality: 0,
                        lsd: lsd, // Långpass,
                        strength: strength,
                        alternative: alternative,
                        forest: 0,
                        path: 0
                    }
                );
                activity.save();
            } catch(err) {
                console.log(err);
                res.status(400).json({ success: false, message: err.message });
            }        
        })
        // ******** UPPDATERA MED HTTPS **********
        res.redirect('https://trbok.niklasking.com');
    })
    .catch( err => res.send([]));

});
app.get('/api/v1/strava/activities/between', async (req, res) => {
    const before = req.query.before;
    const after = req.query.after;
    const userStravaId = req.query.stravaId;
    authorize(userStravaId)
    .then( accessToken => getAdditionalBetweenStravaActivities(accessToken, before, after))
    .then( result => {
        result.map( item => {
            try {
                // Get laps
                const laps = await getStravaLaps(item.id);
                console.log(laps);
                // Save activity
                const startTime = moment(item.start_date).format('HH:mm');
                const lsd = item.moving_time > 5400 ? 1 : 0;
                const strength = item.type === 'WeightTraining' ? 1 : 0;
                const alternative = item.type === 'Swim' || item.type === 'Ride' || item.type === 'VirtualRide' || item.type === 'Walk' || item.type === 'Workout' ? 1 : 0;
                const activity = new Activity(
                    {
                        name: startTime + ' ' + item.name,
                        distance: item.distance,
                        movingTime: item.moving_time,
                        totalElevationGain: item.total_elevation_gain,
                        type: item.type,
                        stravaId: item.id,
                        startDate: new Date(item.start_date),
//                        startDateLocal: new Date(item.start_date_local),
                        startLat: item.start_latitude,
                        startLong: item.start_longitude,
                        mapPolyline: item.map.summary_polyline,
                        averageSpeed: item.average_speed,
                        maxSpeed: item.max_speed,
                        averageCadence: item.average_cadence,
                        maxCadence: item.max_cadense,
                        averageHeartrate: item.average_heartrate,
                        maxHeartRate: item.max_heartrate,
                        elevationHighest: item.elev_high,
                        elevationLowest: item.elev_low,
                        user: userData._id,
                        userStravaId: userStravaId,
                        title: startTime,
                        ol: 0,
                        night: 0, // Natt-OL
                        quality: 0,
                        lsd: lsd, // Långpass,
                        strength: strength,
                        alternative: alternative,
                        forest: 0,
                        path: 0,
                        laps: [laps]
                    }
                );
                activity.save();
            } catch(err) {
                console.log(err);
                res.status(400).json({ success: false, message: err.message });
            }        
        })
//        res.redirect('https://trbok.niklasking.com');
        res.status(200).send('Ok');
    })
    .catch( err => res.status(400).send([]));

});
app.get('/api/v1/days', async (req, res) => {
    try {
        const dateStart = req.query.dateStart;
        const dateEnd = req.query.dateEnd;
        const result = await Day.find({ user: req.query.user, startDate: {$gte: dateStart, $lte: dateEnd } }).sort({startDate: 1});
        res.status(200).send(result);
    } catch(err) {
//        console.log('Find error: ' + err);
        res.status(400).send("Day events error: " + err);
    }
});
app.post('/api/v1/days', async (req, res) => {
    try {
        const day =
            {
                startDate: new Date(req.body.startDate),
                skada: req.body.skada,
                sjuk: req.body.sjuk,
                user: req.body.user
            };
        const query = { startDate: day.startDate, user: day.user };
        const options = { upsert: true, new: true };
//        const options = { upsert: true, new: true, setDefaultsOnInsert: true };
 //       const result = await Day.findOneAndReplace(query, day, options);
        const result = await Day.updateOne(query, day, options);
        res.status(200).send(result);
    } catch(err) {
        console.log('Save error: ' + err);
        res.status(400).send("Det gick inte att spara dagen. " + err);
    }
});

// Creates the endpoint for our webhook
app.post('/stravaWebhook', async (req, res) => {
    console.log("webhook event received!", req.query, req.body);
    if (req.body.object_type === 'activity' && req.body.aspect_type === 'create') {
        try {
            const userStravaId = req.body.owner_id;
            const activityId = req.body.object_id;
            const accessToken = await authorize(userStravaId);
            const result = await getStravaActivity(accessToken, activityId);
            if (result !== null) {
                const item = result;
                const startTime = moment(item.start_date).format('HH:mm');

                const startOfDay = moment(item.start_date).format('YYYY-MM-DD 00:00:00');
                const endOfDay = moment(item.start_date).format('YYYY-MM-DD 23:59:59');
                const dayActivities = await Activity.find({ userStravaId: userStravaId, startDate: {$gte: startOfDay, $lte: endOfDay } });
                console.log("****** Found for day *******");
                console.log(dayActivities);
                let namePlanned = '';
                let typePlanned = '';
                let movingTimePlanned = 0;
                let distancePlanned = 0;
                if (dayActivities.length > 0) {
                    if (dayActivities.length > 1) {
                        let found = false;
                        for (let i = 0; i < dayActivities.length; i++) {
                            if (!found) {
                                if (dayActivities[i].typePlanned === item.type) {
                                    found = true;
                                    namePlanned = dayActivities[i].namePlanned;
                                    typePlanned = dayActivities[i].typePlanned;
                                    movingTimePlanned = dayActivities[i].movingTimePlanned;
                                    distancePlanned = dayActivities[i].distancePlanned;
                                    await Activity.findByIdAndRemove(dayActivities[i]._id);
                                }
                            }
                        }
                        if (!found) {
                            namePlanned = dayActivities[0].namePlanned;
                            typePlanned = dayActivities[0].typePlanned;
                            movingTimePlanned = dayActivities[0].movingTimePlanned;
                            distancePlanned = dayActivities[0].distancePlanned;
                            await Activity.findByIdAndRemove(dayActivities[0]._id);    
                        }
                    } else {
                        namePlanned = dayActivities[0].namePlanned;
                        typePlanned = dayActivities[0].typePlanned;
                        movingTimePlanned = dayActivities[0].movingTimePlanned;
                        distancePlanned = dayActivities[0].distancePlanned;
                        await Activity.findByIdAndRemove(dayActivities[0]._id);
                    }
                }
                console.log("****** Found for day *******");
                
                const lsd = item.moving_time > 5400 ? 1 : 0;
                const strength = item.type === 'WeightTraining' ? 1 : 0;
                const alternative = item.type === 'Swim' || item.type === 'Ride' || item.type === 'VirtualRide' || item.type === 'Walk' || item.type === 'Workout' ? 1 : 0;
                const activity = new Activity(
                    {
                        name: startTime + ' ' + item.name,
                        distance: item.distance,
                        movingTime: item.moving_time,
                        totalElevationGain: item.total_elevation_gain,
                        type: item.type,
                        stravaId: item.id,
                        startDate: new Date(item.start_date),
//                        startDateLocal: new Date(item.start_date_local),
                        startLat: item.start_latitude,
                        startLong: item.start_longitude,
                        mapPolyline: item.map.summary_polyline,
                        averageSpeed: item.average_speed,
                        maxSpeed: item.max_speed,
                        averageCadence: item.average_cadence,
                        maxCadence: item.max_cadense,
                        averageHeartrate: item.average_heartrate,
                        maxHeartRate: item.max_heartrate,
                        elevationHighest: item.elev_high,
                        elevationLowest: item.elev_low,
                        user: userData._id,
                        title: startTime,
                        ol: 0,
                        night: 0, // Natt-OL
                        quality: 0,
                        lsd: lsd, // Långpass,
                        strength: strength,
                        alternative: alternative,
                        forest: 0,
                        path: 0,
                        userStravaId: userStravaId,
                        namePlanned: namePlanned,
                        typePlanned: typePlanned,
                        movingTimePlanned: movingTimePlanned,
                        distancePlanned: distancePlanned
                    }
                );
//                console.log('Denna ska sparas: ' + activityId); 
                await activity.save();
            }
            res.status(200).send('EVENT_RECEIVED');
        } catch(err) {
            console.log("Det gick inte att skapa en aktivitet: " + err);
            res.status(200).send('EVENT_RECEIVED');
        }
    }
});



// Adds support for GET requests to our webhook
app.get('/stravaWebhook', (req, res) => {
    // Your verify token. Should be a random string.
    const VERIFY_TOKEN = "niklaskingstravatrbok";
    // Parses the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Verifies that the mode and token sent are valid
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {     
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.json({"hub.challenge":challenge});  
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
});
app.get('/', (req, res) => {
  res.send('Hello Kingen!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});