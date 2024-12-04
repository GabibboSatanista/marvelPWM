const express = require('express');
const path = require('path');

const utils = require('./utils/serverFunctions.js');
var bodyParser = require('body-parser');

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require('./swagger_output.json');

var cors = require('cors');

// Configure dotenv package
require("dotenv").config();
const mongo_db_url = process.env.mongo_db_url;
const port = process.env.PORT || 8080;

const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/assets'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

app.get('/signin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/signin.html'));
});

//----------------------------------------------------------------------------
app.post("/login", (req, res) => {
    utils.loginAuth(res, req.body);
})

app.post("/register", function (req, res) {
    utils.addUser(res, req.body);
})

//SISTEMARE POI
app.post("/user", function (req, res) {
    let id = req.body.id;
    utils.getUser(res, id);
});

app.delete("/user", function (req, res) {
    let id = req.body.id;
    utils.deleteUser(res, id);
});

app.post("/user/changePassword", function(req, res){
    let id = req.body.id;
    let newPsw = req.body.password
    utils.changePassword(res, id, newPsw);
})


app.post("/user/changeUsername", function(req, res){
    let id = req.body.id;
    let newUsr = req.body.username
    utils.changeUsername(res, id, newUsr);
})

//----------------------------------------------------------------------------
app.listen(port);
console.log('Server start at http://localhost:' + port);
