const express = require('express');
const session = require('express-session');
const bCrypt = require('bcrypt');
const MongoStore = require('connect-mongo');
const joi = require('joi');
require('dotenv').config();
require('./utils.js');
var { database } = include('databaseConnection');

const app = express();
const node_session = process.env.NODE_SESSION_SECRET;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const userCollection = database.db(mongodb_database).collection('users');
var mongoDB = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: node_session,
    saveUninitialized: false,
    resave: true,
    save: mongoDB
}));
app.use('/public', express.static('public'));


app.get('/', (req, res) => {
    const html = `<a href="/signup"><button>Sign up</button></a><br>
    <a href="/login"><button>Login</button></a>`;
    res.send(html);
});

app.get('/signup', (req, res) => {
    const html = `<form action="/signupSubmit" method="post">
        create user
        <br>
        <input name = "name" type='text' placeholder="name"><br>
        <input name = "email" type='email' placeholder="email"><br>
        <input name = "password" type='password' placeholder="password"><br>
        <button>Submit</button>
    </form>`;
    res.send(html);
});

app.get('/login', (req, res) => {
    const html = `<form action="/loginSubmit" method="post">
        login
        <br>
        <input name = "email" type='email' placeholder="email"><br>
        <input name = "password" type='password' placeholder="password"><br>
        <button>Submit</button>
    </form>`;
    res.send(html);
});

app.get('/members', (req, res) => {
    res.send(`<h1>Hello, user</h1>
    <img src="/public/cat3.jpg" alt="picture of cat" style="width: 50%;"/><br>
    <a href="/logout"><button>Sign out</button></a>`);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.use((req, res) => {
    res.status(404);
    res.send(`Page not found - 404`);
});

app.post('/signupSubmit', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    if (!name) {
        res.send(`Name is required
    <a href="/">Try again</a>`);
    } else if (!email) {
        res.send(`Email is required
            <a href="/">Try again</a>`);
    } else if (!password) {
        res.send(`Password is required
            <a href="/">Try again</a>`);
    }
});

app.post('/loginSubmit', (req, res) => {
    res.send(`hi`);
});

app.listen(3000);