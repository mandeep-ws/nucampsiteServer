const express = require('express');
const bodyParser = require('body-parser');
const Favorite = require('../models/favorite');
const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());
const authenticate = require('../authenticate');
const verifyAdmin = require('../authenticate').verifyAdmin;
const cors = require('./cors');


favoriteRouter.route('/')
.options(cors.corsWithOptions,authenticate.verifyUser,(req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .populate('user')
    .populate('campsites')
    .then(favorite => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.json(favorite)
    }).catch(err => next(err))
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorite => {
            if (favorite) {
                for (let i =0; i < req.body.length; i ++){
                    if (favorite.campsites.indexOf(req.body[i]._id) === -1){
                        favorite.campsites.push(req.body[i]._id)
                    }
                }
                favorite.save()
                .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({status:'added campsite to favorites', favorite: favorite})
                })
                .catch(err => next(err))
            } else {
                Favorite.create({ campsites: req.body, user: req.user._id})
                .then(response => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({status: 'added campsite to favorites', favorite: response})
                    }
                ).catch(err => next(err))
            }
        }
    )
    }
)
.put(cors.corsWithOptions,authenticate.verifyUser,(req, res) => {
    res.statusCode = 403;
    res.end('Put operation not supported on /favorites')
})
.delete(cors.corsWithOptions,authenticate.verifyUser, (req,res,next) => {
    Favorite.findOneAndDelete({user: req.user._id})
    .then(response => {
        if (response){
        res.statusCode = 200;
        res.send('Deleted your favorite campsites!')
        } else {
            res.statusCode = 200;
            res.send('You do not have any favorite campsites to be deleted!')
        }
    })
    .catch(err => next(err))
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions,authenticate.verifyUser,(req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`Status code: ${res.statusCode}! Get requests are not supported on this route`)
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorite => {
        if (favorite) {
            if (!favorite.campsites.includes(req.params.campsiteId)){
                favorite.campsites.push(req.params.campsiteId)
                favorite.save()
                .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({status:'added campsite to favorites', favorite: favorite})
                })
                .catch(err => next(err))
            } else {
                res.statusCode = 200;
                res.send('You have already added that campsite to your favorites')
            } 
        } else {
            Favorite.create({
                user: req.user._id,
                campsites: req.params.campsiteId
            })
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({status: 'added campsite to favorites', favorite: response})
            }
        ).catch(err => next(err))
        }
    }).catch(err => next(err))
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req, res) => {
    res.statusCode = 403;
    res.end('Put operation not supported on /favorites')
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
    Favorite.findOne({user: req.user._id})
    .then(response => {
        if (response) {
            let filteredList = response.campsites.filter(campsite => campsite != req.params.campsiteId)
            response.campsites = filteredList
            response.save()
            res.statusCode = 200;
            res.send(`Deleted campsite ${req.params.campsiteId} from your favorites!`)
        } else {
            res.statusCode = 401;
            res.send('User not found. Make sure you are logged in')
        }
    }).catch(err => next(err))
    }
)

module.exports = favoriteRouter;