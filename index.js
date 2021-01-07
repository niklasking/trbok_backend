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
const secret = require('./secret');

const expressSession = require('express-session')({
    secret: 'Kingenvandraderuntsj#n64tre3varv',
    resave: false,
    saveUninitialized: false
});

const app = express();
const port = 3333;

//const stravaId = "16477224"; // Niklas Bratt
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
    res.setHeader('Access-Control-Allow-Origin', 'http://trbok.niklasking.com:3000');
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
    try {
        const user = await User.find({ stravaId: stravaUserId });
        if (user === null) {
            return null;
        } else if (user.length === 0) {
            return null;
        }
        console.log('** Found user: ' + user);
//        const reffe = 'f0e97136017441ba34d9f80fdc23e8a9026e9b21';
        const response = await axios.post('https://www.strava.com/api/v3/oauth/token', {
            client_id: secret.clientID,
            client_secret: secret.clientSecret,
            refresh_token: user[0].refreshToken,
//            refresh_token: reffe,
            grant_type: 'refresh_token'
        });
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
//        return (response.data.access_token);
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
}

app.get('/stravaCallback', async (req, res) => {
    if (req.query.error !== undefined) {
        console.log('Strava error: ' + req.query.error);
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
                expiresAt: req.body.expires_at,
                refreshToken: req.body.refresh_token,
                accessToken: req.body.access_token,
                stravaId: req.body.athlete.id
            }
            User.findByIdAndUpdate(userId, userDetails, { upsert: true });
        } catch(err) {
            console.log('Strava exchange error: ' + err);
        }
    }
    res.status(200).send('OK');
});
app.post('/api/v1/registerStrava', function (req, res) {
    axios.get('https://www.strava.com/oauth/authorize', {
        client_id: secret.clientID,
        redirect_uri: 'http://trbok_backend.niklasking.com:3333/stravaCallback',
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
                            console.log(user);
//                            const token =  jwt.sign({userId : user._id,  
//                            username:user.username}, secretkey,  
//                                {expiresIn: '24h'}) 
//                            res.json({success:true, message:"Authentication successful", token: token }); 
                            res.json({success:true, message:"Authentication successful", user: user }); 
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
})
app.get('/api/v1/users/add', async (req, res) => {
    const niklas = new User(
        {
            stravaId: null,
            name: "Niklas Bratt",
            refreshToken: null,
            accessToken: null,
            expiresAt: null,
            private: false
        }
    )
    try {
        await niklas.save();
        res.status(200).json({ success: true, data: niklas });
    } catch(err) {
        console.log(err);
        res.status(400).json({ success: false, message: err.message });
    }
});
app.get('/api/v1/users/updateNiklas', (req, res) => {
    const getUserByName = async (name) => {
        try {
            const user = await User.find({ name: name });
            return user;
        } catch(error) {
            console.log(error);
            return null;
        }
    }
    const updateUser = async (user) => {
        user.stravaId = '16477224';
        user.refreshToken = 'f0e97136017441ba34d9f80fdc23e8a9026e9b21';
        user.accessToken = 'f6bdd726d1e138a002a7e132b3966ccc326f150d';
        user.expiresAt = 1609619930;

        try {
            const updatedUser = await user.save();
            return updatedUser;
        } catch(error) {
            console.log(error);
            return null;
        }
    }
    (async () => {
        const foundUser = await getUserByName('Niklas Bratt');
        if (foundUser === null) {
            res.send('Hittade inte nån användare för det blev knas');
        } else if (foundUser.length === 0) {
            res.send('Hittade inte nån användare');
        }
        let result = await updateUser(foundUser[0]);
        if (result === null) {
            res.send('Det gick inte att uppdatera');
        } else {
            res.send('Användaren är uppdaterad');
        }

    })()
});
app.get('/api/v1/users', (req, res) => {
    const getUsers = async () => {
        try {
            const result = await User.find({}).lean();
            return result;
        } catch(error) {
            console.log(error);
            return null;
        }
    }
    (async () => {
        let users = await getUsers();
        if (users === null) {
            res.send('Något gick snett');
        } else {
            res.send('Hittade ' + users.length + ' användare');
        }
    })()
});
app.get('/api/v1/usersstrava', (req, res) => {
    const getUsers = async () => {
        try {
            const result = await User.find({}).lean();
            return result;
        } catch(error) {
            console.log(error);
            return null;
        }
    }
    (async () => {
        let users = await getUsers();
        if (users === null) {
            res.send('Något gick snett');
        } else {
            res.send('Hittade ' + users.length + ' användare');
        }
    })()
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
                name: req.body.name,
                distance: req.body.distance,
                movingTime: req.body.time,
//                totalElevationGain: item.total_elevation_gain,
//                type: item.type,
//                stravaId: item.id,
                startDate: new Date(req.body.date),
//                startLat: item.start_latitude,
//                startLong: item.start_longitude,
//                mapPolyline: item.map.summary_polyline,
//                averageSpeed: item.average_speed,
//                maxSpeed: item.max_speed,
//                averageCadence: item.average_cadence,
//                maxCadence: item.max_cadense,
//                averageHeartrate: item.average_heartrate,
//                maxHeartRate: item.max_heartrate,
//                elevationHighest: item.elev_high,
//                elevationLowest: item.elev_low,
                user: req.body.user._id
            }
        );
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
            path: req.body.path
        };
        const result = await Activity.findByIdAndUpdate(req.body._id, activity, { upsert: true });
        res.status(200).send(result);
    } catch(err) {
//        console.log('Save error: ' + err);
        res.status(400).send("Det gick inte att skapa en aktivitet. " + err);
    }
});
app.get('/api/v1/strava/activities', (req, res) => {
    authorize(req.query.stravaId)
    .then( accessToken => getStravaActivities(accessToken))
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
                        path: 0
                    }
                );
                activity.save();
            } catch(err) {
                console.log(err);
                res.status(400).json({ success: false, message: err.message });
            }        
        })
        res.send(result);
    })
    .catch( err => res.send([]));

});
app.get('/', (req, res) => {
  res.send('Hello Kingen!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});