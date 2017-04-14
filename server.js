/*jshint esversion: 6 */
const express = require('express');
const app = express();
var Promise = require('bluebird');
var pgp = require('pg-promise')({promiseLib: Promise});
const bodyParser = require('body-parser');
const config = require('./config.js');
const db = pgp(config.database);
const session = require('express-session');
const bcrypt = require('bcrypt');
app.set('view engine', 'hbs');
app.use(session(config.session));


// Serve up public files at root
app.use(express.static('public'));

// Add to request object the body values from HTML
app.use(bodyParser.urlencoded({extended: false}));

// Make session automatically available to all hbs files
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// Log in
app.get('/', function(req, res) {
    res.render('login.hbs');
});

// Sign up
app.get('/sign_up', function(req, res) {
    res.render('sign_up.hbs');
});

// Log out
app.get('/logout', function(req, res) {
    req.session.user = null;
    res.redirect('/');
});

// Submit Log in details
app.post('/submit_login', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    console.log('username ' + username);
    console.log('password' + password);
    db.one("SELECT id, first, username, password FROM reviewer WHERE username = $1", username)
        .then(function(loginDetails) {
            return [loginDetails, bcrypt.compare(password, loginDetails.password)];
        })
        .spread(function(loginDetails, matched) {
            if (matched) {
                req.session.user = loginDetails.first;
                req.session.user_id = loginDetails.id;
                res.send('match');
            } else {
                res.send('fail');
            }
        })
        .catch(function(err) {
            console.log(err.message);
            res.send('fail');
        });
});

// Submit new user log in details
app.post('/add_user', function(req, res, next) {
    var first = req.body.first;
    var last = req.body.last;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var confirm = req.body.confirm;
    if (username === '' || email === '' || password === '' || confirm === '' || first === '' || last === '') {
        res.send('empty');
    } else if (password !== confirm) {
        res.send('not match');
    } else {
        bcrypt.hash(password, 10)
            .then(function(encrypted) {
                return db.one("INSERT into reviewer values(default, $1, $2, $3, $4, $5) returning reviewer.id as id", [username, email, encrypted, first, last]);
            })
            .then(function(result) {
                req.session.user = first;
                req.session.user_id = result.id;
                res.send('match');
            })
            .catch(function(err) {
                console.log(err.message);
                res.send('taken');
            });
    }

});

// Authenticate log in
app.use(function authentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
});

// Home route path
app.get('/user_home', function(req, res, next) {
    db.any(`
        SELECT
            restaurant.id,
        	restaurant.name as name,
        	restaurant.category,
        	restaurant.address

        FROM
        	restaurant,
        	favorites,
        	reviewer
        WHERE
        	favorites.restaurant_id = restaurant.id
        	and favorites.reviewer_id = reviewer.id
        	and reviewer.id = $1
        `, req.session.user_id)
        .then(function(favorites) {
            res.render('user_home.hbs', {
                restaurants: favorites
            });
        })
        .catch(next);
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
                search: req.query.searchTerm,
                restaurants: restaurantArray
            });
        })
        .catch(next);
});

// Add a restaurant page route path
app.get('/restaurant/new', function(req, res) {
    res.render('new.hbs');
});

// Restaurant page route path
app.get('/restaurant/:id', function(req, res, next) {
    let id = req.params.id;
    db.any(`
        SELECT
        	reviewer.first as reviewer_name,
            restaurant.name,
        	title,
        	stars,
        	review
        FROM
        	restaurant
        LEFT OUTER JOIN
        	review on review.restaurant_id = restaurant.id
        LEFT OUTER JOIN
        	reviewer on review.reviewer_id = reviewer.id
        WHERE
        	restaurant.id = $1
        `, id)
        .then(function(review_data) {
            return [review_data, db.one(`
                SELECT
                	restaurant.name,
                	address,
                	category,
                	restaurant.id,
                	round(avg(stars), 1) as stars
                FROM
                	restaurant
                LEFT OUTER JOIN
                	review on review.restaurant_id = restaurant.id
                WHERE
                	restaurant.id = $1
                GROUP BY
                	restaurant.id
                `, id)];
        })
        .spread(function(review_data, restaurant_data) {
            return [review_data, restaurant_data, db.any(`
                SELECT
                	*
                FROM
                	favorites
                WHERE
                	restaurant_id = $1 and reviewer_id = $2;
                `, [restaurant_data.id, req.session.user_id])];
        })
        .spread(function(review_data, restaurant_data, favorite) {
            res.render('restaurant.hbs', {
                favorite: favorite,
                reviews: review_data,
                name: restaurant_data.name,
                address: restaurant_data.address,
                category: restaurant_data.category,
                id: restaurant_data.id,
                avg_stars: restaurant_data.stars
            });
        })
        .catch(next);
});

// Form Submit - add new restaurant route path
app.post('/restaurant/submit_new', function(req, res, next) {
    let name = req.body.name;
    let category = req.body.category;
    let address = req.body.address;
    let favorite = req.body.favorite;

    db.one("insert into restaurant values (default, $1, $2, $3) returning restaurant.id", [name, address, category])
        .then(function(result) {
            if (favorite === "true") {
                return db.one("insert into favorites values($1, $2) returning restaurant_id as id", [result.id, req.session.user_id]);
            } else if (favorite === "false"){
                return result;
            }
        })
        .then(function(result) {
            res.redirect('/restaurant/' + result.id);
        })
        .catch(next);
});

// Click heart - add favorite route path
app.post('/restaurant/add_favorite/:id', function(req, res, next) {
    var id = req.params.id;
    var favorite = req.body.favorite;
    if (favorite === "true") {
        db.none("insert into favorites values ($1, $2)", [id, req.session.user_id]);
    } else if (favorite === "false") {
        db.none("delete from favorites where restaurant_id = $1 and reviewer_id = $2", [id, req.session.user_id]);
    }
});

// Form submit - add review route path
app.post('/restaurant/addReview/:id', function(req, res, next) {
    let stars = req.body.stars;
    let title = req.body.title;
    let review = req.body.review;
    let id = req.params.id;
    db.one(`insert into review values (default, $1, $2, $3, $4, $5) returning review.restaurant_id`, [req.session.user_id, stars, title, review, id])
        .then(function(result) {
            res.redirect('/restaurant/' + result.restaurant_id);
        })
        .catch(next);
});



// Start server
app.listen(5000, function() {
    console.log('Example app listening on port 5000!');
});
