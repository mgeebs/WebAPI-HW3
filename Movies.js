//var ActorSchema = require('./Actors');//actor schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GENRES = ['Action','Adventure','Horror','Comedy','Drama','Fantasy','Mystery','Thriller','Western'];

// movie schema
var MovieSchema = new Schema({
    title: {type: String, required: true, unique: true},
    year: {type: Number, require: true},
    genre: {type: String, enum: GENRES, require: true},
    actors: {type: [{
            actorName: {type: String, required: true},
            characterName: {type: String, required: true}
        }],
            required: true}
});

MovieSchema.pre('save', function(next) {
    if(this.Actors.length < 3) {
        return next(new Error('Fewer than 3 Actors'));
    }
        next();
    
    });

// return the model
module.exports = mongoose.model('Movie', MovieSchema);


///USE THIS TO MAKE THE MOVIE MODEL, COPY IT AND ALTER FOR MOVIES