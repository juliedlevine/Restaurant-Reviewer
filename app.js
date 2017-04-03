/*jshint esversion: 6 */
const express = require('express');
const app = express();
var Promise = require('bluebird');
var pgp = require('pg-promise')({
    promiseLib: Promise
});
const bodyParser = require('body-parser');
const db = pgp({database: 'restaurant_db_2'});


// Home route path
app.get('/', function(req, res) {
    res.render('home.hbs');
});

// Submit handler
app.get('/search', function(req, res, next) {
    let search = "'%" + req.query.searchTerm + "%'";
    db.any(`SELECT name, address, category, restaurant.id FROM restaurant WHERE restaurant.name ilike ${search} order by name`)
        .then(function(restaurantArray) {
            res.render('search_results.hbs', {
                restaurants: restaurantArray
            });
        })
        .catch(next);
});

// Restaurant route path
app.get('/restaurant/:id', function(req, res, next) {
    let id = req.params.id;
    db.any(`SELECT review, restaurant.name, restaurant.address, restaurant.category FROM restaurant LEFT OUTER JOIN review on review.restaurant_id = restaurant.id WHERE restaurant.id = ${id}`)
        .then(function(data) {
            console.log(data);
            res.render('restaurant.hbs', {
                name: data[0].name,
                address: data[0].address,
                category: data[0].category,
                reviews: data
            });
        })
        .catch(next);
});

app.use(express.static('public'));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({extended: false}));
app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});
