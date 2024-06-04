const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

// MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'ayu',
    password: 'Prachi@123',
    database: 'login_system'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database.');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;            // Extract username and password from the request body
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    // Insert new user into the database
    connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
        if (err) throw err;                             // If there's an error, throw it
        res.redirect('/');                              // Redirect to the login page
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;            // Extract username and password from the request body

    // Query the database for the user
    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) throw err;                             // If there's an error, throw it
        if (results.length > 0) {                       // If a user is found
            const comparison = await bcrypt.compare(password, results[0].password); // Compare the entered password with the stored hash
            if (comparison) {                           // If the password matches
                req.session.loggedin = true;            // Set the session as logged in
                req.session.username = username;        // Store the username in the session
                res.redirect('/home');                  // Redirect to the home page
            } else {
                res.send('Incorrect Username and/or Password!'); // If the password doesn't match, send an error message
            }
        } else {
            res.send('Incorrect Username and/or Password!');     // If no user is found, send an error message
        }
    });
});

app.get('/home', (req, res) => {
    if (req.session.loggedin) {                         // Check if the user is logged in
        res.sendFile(path.join(__dirname, 'public', 'home.html')); // Serve the home page
    } else {
        res.send('Please login to view this page!');    // If not logged in, send an error message
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
