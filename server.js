var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport'); //authentication
var authJwtController = require('./auth_jwt'); //implements our model
var User = require('./Users'); //sign in, etc
var Movie = require('./Movies');//movie schema, etc
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var dotenv = require('dotenv').config();
var app = express();

mongoose.connect(process.env.DB , (err, database) => {
    if (err) throw err;
console.log("Connected to the database.");
db = database;
console.log("Database connected on " + process.env.DB);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/')
    .get(function (req, res) {
        res.json({success: true, message: "home page for Michael's movies db"});
    })
router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

// find a specific user id as a json object
router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

// get all the users, no limitations unless I add them
router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

// sign up a new user
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.status(400).json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ message: 'User created!' });
        });
    }
});

// sign in as an existing user
router.post('/signin', function(req, res) {
    var userNew = new User(); // a new user schema object to hold the credentials
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    // find the passed username, get the password for comparison, if good let them login
    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                // pass in the above json object, signed with the secret key
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).json({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        });
    });
});

router.route('/movies') //create a new movie
    .post(authJwtController.isAuthenticated, function (req, res) {
        var movieNew = new Movie(); // a new movie schema object

        movieNew.title = req.body.title;
        movieNew.year = req.body.year;
        movieNew.genre = req.body.genre;
        movieNew.actors = req.body.actors;

        movieNew.save(function (err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000) {
                    return res.status(400).json({
                        success: false,
                        message: 'A movie with that name already exists. '
                    });
                }
                else
                    return res.status(400).send(err);
            }
            else return res.status(201).send('movie created!');
            });
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function (err, movies) {
            if (err) res.status(404).send(err);
            // return the movies
            else res.json(movies);
        });
    });

router.route('/movies/:movieId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.movieId;
        Movie.findById(id, function(err, movie) {
            if (err) res.status(404).send(err);

            else res.json(movie);
        });
    });

router.route('/movies/:movieId')
    .delete(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.movieId;
        Movie.findById(id, function(err, movie) {
            if (err) res.status(400).send(err);

            else {
                movie.remove();
                res.json({message: 'Movie deleted!'});
            }
        });
    });

router.route('/movies/:movieId') //update a movie
    .put(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.movieId;
        Movie.findById(id, function(err, movie) {
            if (err) res.send(err);

            movie.genre = req.body.genre;

            movie.save(function (err) {
                if (err) res.status(400).send(err);
                else res.json({message: 'Movie updated!'});
            });
        });
    });
app.use('/', router);
app.listen(process.env.PORT || 8080);
