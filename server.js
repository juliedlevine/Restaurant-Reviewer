/*jshint esversion: 6 */
const express = require('express');
const app = express();
var Promise = require('bluebird');
var pgp = require('pg-promise')({promiseLib: Promise});
const bodyParser = require('body-parser');
const config = require('./config.js');
const db = pgp(config);
app.set('view engine', 'hbs');
app.use(express.static('public'));
// Middleware - add to request object the body values
app.use(bodyParser.urlencoded({extended: false}));



// GET ROUTES //

// Home route path
app.get('/', function(req, res) {
    db.any("select * from restaurant where favorite = true")
        .then(function(data) {
            res.render('home.hbs', {
                restaurants: data
            });
        });
});

// Add a restaurant route path
app.get('/restaurant/new', function(req, res) {
    res.render('new.hbs');
});

// Submit search route path
app.get('/search', function(req, res, next) {
    let search = "%" + req.query.searchTerm + "%";
    db.any(`
        SELECT
        	name,
        	address,
        	category,
        	restaurant.id,
        	round(avg(stars), 1) as stars
        FROM
        	restaurant
        LEFT OUTER JOIN
        	review on review.restaurant_id = restaurant.id
        WHERE
        	restaurant.name ilike $1
        	or restaurant.category ilike $1
        GROUP BY
        	restaurant.id
        order by
        	name
        `, search)
        .then(function(restaurantArray) {
            res.render('search_results.hbs', {
                restaurants: restaurantArray
            });
        })
        .catch(next);
});

// Restaurant Page route path
app.get('/restaurant/:id', function(req, res, next) {
    let id = req.params.id;
    db.any("SELECT favorite, review, stars, reviewer.name as reviewer_name, restaurant.name, review.title, restaurant.address, restaurant.category FROM restaurant LEFT OUTER JOIN	review on review.restaurant_id = restaurant.id LEFT OUTER JOIN reviewer on review.reviewer_id = reviewer.id WHERE restaurant.id = $1", id)
        .then(function(data) {
            return [data, db.one("SELECT round(avg(stars), 1) as avg_stars FROM review WHERE review.restaurant_id = $1", id)];
        })
        .spread(function(data, stars) {
            res.render('restaurant.hbs', {
                favorite: data[0].favorite,
                stars: stars.avg_stars,
                id: id,
                name: data[0].name,
                address: data[0].address,
                category: data[0].category,
                reviews: data
            });
        })
        .catch(next);
});



// POST ROUTES //

// Submit Review route path
app.post('/addReview/:id', function(req, res, next) {
    let stars = req.body.stars;
    let title = req.body.title;
    let review = req.body.review;
    let id = req.params.id;
    db.one(`insert into review values (default, 1, $1, $2, $3, $4) returning review.restaurant_id`, [stars, title, review, id])
        .then(function(result) {
            res.redirect('/restaurant/' + result.restaurant_id);
        })
        .catch(next);
});

// Submit New restaurant route path
app.post('/restaurant/submit_new', function(req, res, next) {
    let name = req.body.name;
    let category = req.body.category;
    let address = req.body.address;
    let favorite = req.body.favorite;
    db.one("insert into restaurant values (default, $1, $2, $3, $4) returning restaurant.id", [name, address, category, favorite])
        .then(function(result) {
            res.redirect('/restaurant/' + result.id);
        })
        .catch(next);
});

app.post('/restaurant/add_favorite/:id', function(req, res, next) {
    var id = req.params.id;
    var favorite = req.body.favorite;
    db.none("update restaurant set favorite = $1 where restaurant.id = $2", [favorite, id]);
});



// Start server
app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});
