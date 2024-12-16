const express = require('express');
const path = require('path');

const utils = require('./utils/serverFunctions.js');
var bodyParser = require('body-parser');

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require('./swagger_output.json');

var cors = require('cors');

// Configure dotenv package
require("dotenv").config();
const baseUrlMarvel = process.env.baseUrlMarvel;
const port = process.env.PORT || 8080;

const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/assets'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(cors());

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

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/profile.html'));
});

app.get('/shop.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/shop.html'));
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

app.get("/characters/:characterId", function(req, res){
    let id = req.params.characterId;
    utils.getCharacterById(res, id);
})

app.get("/characters/search/:name", function(req, res){
    let name = req.params.name;
    utils.searchSuperHero(res, name);
})

app.post("/pack/open", function(req, res){
    let id = req.body.id;
    utils.openPack(res, id);
})

app.post("/credits/add/4", function(req, res){
    let id = req.body.id;
    utils.addCredits(res, 4,id);
})

//----------------------------------------------------------------------------

app.listen(port);
console.log('Server start at http://localhost:' + port);
