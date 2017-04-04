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
    let search = "'%" + req.query.searchTerm + "%'";
    db.any(`SELECT name, address, category, restaurant.id FROM restaurant WHERE restaurant.name ilike ${search} or restaurant.category ilike ${search} order by name`)
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
    db.any(`SELECT review, stars, reviewer.name as reviewer_name, restaurant.name, review.title, restaurant.address, restaurant.category FROM restaurant LEFT OUTER JOIN	review on review.restaurant_id = restaurant.id LEFT OUTER JOIN reviewer on review.reviewer_id = reviewer.id WHERE restaurant.id = ${id}`)
        .then(function(data) {
            res.render('restaurant.hbs', {
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
    db.one(`insert into restaurant values (default, '${req.body.name}', '${req.body.address}', '${req.body.category}') returning restaurant.id`)
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
