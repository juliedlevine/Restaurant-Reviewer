/*jshint esversion: 6 */
const express = require('express');
const app = express();
var Promise = require('bluebird');
var pgp = require('pg-promise')({
    promiseLib: Promise
});
const bodyParser = require('body-parser');
const config = require('./config.js');
const db = pgp(config);



// Home route path
app.get('/', function(req, res) {
    res.render('home.hbs');
});

// Add a restaurant route path
app.get('/restaurant/new', function(req, res) {
    res.render('new.hbs');
});


// Submit search route path
app.get('/search', function(req, res, next) {
    let search = '%' + req.query.searchTerm +'%';
    db.any(`
        SELECT
        	name,
        	address,
        	category,
        	restaurant.id,
        	round(avg(stars), 1) as stars
        FROM
        	restaurant
        INNER JOIN
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
    db.any("SELECT review, stars, reviewer.name as reviewer_name, restaurant.name, review.title, restaurant.address, restaurant.category FROM restaurant LEFT OUTER JOIN	review on review.restaurant_id = restaurant.id LEFT OUTER JOIN reviewer on review.reviewer_id = reviewer.id WHERE restaurant.id = $1", id)
        .then(function(data) {
            return [data, db.one("SELECT round(avg(stars), 1) as avg_stars FROM review WHERE review.restaurant_id = $1", id)];
        })
        .spread(function(data, stars) {
            res.render('restaurant.hbs', {
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


// Submit Review route path
app.use(bodyParser.urlencoded({extended: false}));
app.post('/addReview/:id', function(req, res, next) {
    db.one(`insert into review values (default, 1, ${req.body.stars}, '${req.body.title}', '${req.body.review}', ${req.params.id}) returning review.restaurant_id`)
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
    db.one("insert into restaurant values (default, $1, $2, $3) returning restaurant.id", [name, category, address])
        .then(function(result) {
            res.redirect('/restaurant/' + result.id);
        })
        .catch(next);
});




app.use(express.static('public'));
app.set('view engine', 'hbs');
app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});
