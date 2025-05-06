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
    if (req.session.authenticated) {
        res.redirect('/members');
    } else {
        res.send(`<a href="/signup"><button>Sign up</button></a><br>
        <a href="/login"><button>Login</button></a>`);
    }
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
    if (!req.session.authenticated) {
        return res.redirect('/');
    }

    const randomNum = Math.floor(Math.random() * 3) + 1;

    res.send(`<h1>Hello, ${req.session.name}</h1>
    <img src="/public/cat${randomNum}.jpg" alt="picture of cat" style="width: 50%;"/><br>
    <a href="/logout"><button>Sign out</button></a>`);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.post('/signupSubmit', async (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    const schema = joi.object({
        name: joi.string().max(20).required(),
        email: joi.string().email().required(),
        password: joi.string().max(20).required()
    });

    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
        return res.send(`Something went wrong. <a href="/signup">Try again</a>`);
    }

    const existingUser = await userCollection.findOne({ email: email });
    if (existingUser) {
        return res.send(`Email already exists
            <a href="/signup">Try again</a>`);
    }

    const hashedPassword = await bCrypt.hash(password, 10);

    const newUser = {
        name: name,
        email: email,
        password: hashedPassword
    };

    await userCollection.insertOne(newUser);

    req.session.authenticated = true;
    req.session.name = name;
    req.session.email = email;
    res.redirect('/members');
});

app.post('/loginSubmit', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
        return res.send(`Something went wrong. <a href="/login">Try again</a>`);
    }

    const user = await userCollection.findOne({ email: email });

    if (user && await bCrypt.compare(password, user.password)) {
        req.session.authenticated = true;
        req.session.name = user.name;
        req.session.email = user.email;
        res.redirect('/members');
    } else {
        res.send(`Invalid email/password combination.
            <a href="/login">Try again</a>`);
    }
});

app.use((req, res) => {
    res.status(404);
    res.send(`Page not found - 404`);
});

app.listen(3000);