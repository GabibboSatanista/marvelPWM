module.exports = {
    loginAuth: loginAuth,
    addUser: addUser,
    getUser: getUser,
    deleteUser: deleteUser,
    changePassword: changePassword,
    changeUsername: changeUsername,
    getCharacterById: getCharacterById,
    openPack: openPack,
    addCredits: addCredits,
    searchSuperHero: searchSuperHero,
    changeFavouteSuperhero: changeFavouteSuperhero
}

const { response } = require('express');
const CryptoJS = require("crypto-js");
const mdb = require('../mongodbClient.js');
const client = mdb.startMongoDBConnection();

require("dotenv").config();
const baseUrlMarvel = process.env.baseUrlMarvel;
const privateKey = process.env.privateKey;
const publicKey = process.env.publicKey;

function loginAuth(res, body) {
    email = body.email;
    password = body.password;
    mdb.searchingByEmailEPAss(email, password, client).then(r => {
        if (r == undefined) {
            return res.status(404).send("");
        }
        return res.json(r);
    });
}

function addUser(res, user) {
    if (user.email.length < 3) {
        res.status(400).send("Nome troppo corto o mancante");
        return;
    }
    if (user.password.length < 8) {
        res.status(400).send("Password troppo corta o mancante");
        return;
    }
    mdb.insertUserIntoDB(user, client).then(r => {
        if (r !== null) {
            res.status(200).send(user['_id']);
        } else {
            res.status(400).send(r.message);
        }
    }
    );
}

function getUser(res, id) {
    mdb.getUserFromDB(id, client).then(r => {
        if (r !== undefined) {
            return res.json(r);
        } else {
            return res.status(400).send("No buono");
        }
    });
}

function deleteUser(res, id) {
    mdb.deleteUserById(id, client).then(r => {
        if (r == false) {
            return res.status(404).send("Account Inesistente")
        } else {
            return res.status(200).send("OK");
        }
    });
}

function changePassword(res, id, newPsw) {
    if (newPsw.length < 8) {
        res.status(400).send("Password troppo corto o mancante");
        return;
    }

    mdb.changePassword(id, newPsw, client).then(r => {
        if (r.success == false) {
            return res.status(404).send(r.message)
        } else {
            return res.status(200).send(r.message);
        }
    });
}

function changeUsername(res, id, newUsr) {
    if (newUsr.length < 3) {
        res.status(400).send("Password troppo corto o mancante");
        return;
    }

    mdb.changeUsername(id, newUsr, client).then(r => {
        if (r.success == false) {
            return res.status(404).send(r.message)
        } else {
            return res.status(200).send(r.message);
        }
    });
}

function changeFavouteSuperhero(res, id, fs){
    mdb.changeFavouteSuperhero(id, fs, client).then(r => {
        if (r.success == false) {
            return res.status(404).send(r.message)
        } else {
            return res.status(200).send(r.message);
        }
    });
}

function getCharacterById(res, characterId) {
    const timestamp = Date.now();
    const hash = CryptoJS.MD5(timestamp + privateKey + publicKey).toString(CryptoJS.enc.Hex);
    const url = `https://gateway.marvel.com/v1/public/characters/${characterId}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
    fetch(url)
        .then(response => {
            if (response.ok) { return response.json(); }
            else { throw new Error(`${response.status}`) }
        })
        .then(data => {
            if (data.code === 200) {
                const character = data.data.results[0];
                const essentials = {
                    name: character.name,
                    description: character.description,
                    thumbnail: {
                        url: `${character.thumbnail.path}.${character.thumbnail.extension}`,
                    },
                };
                res.status(data.code).send(JSON.stringify(essentials));
            } else {
                res.status(data.code).send(JSON.stringify(data.message));
            }
        })
        .catch();
}

async function openPack(res, userId) {
    try {
        let out = [];
        let data_out;
        for (let i = 0; i < 5; i++) {
            const timestamp = Date.now();
            const hash = CryptoJS.MD5(timestamp + privateKey + publicKey).toString(CryptoJS.enc.Hex);

            const baseURL = "https://gateway.marvel.com/v1/public/characters";
            const limit = 1; // Numero di eroi da ottenere
            const totalAvailable = 1500; // Numero massimo stimato di personaggi
            const randomOffset = Math.floor(Math.random() * totalAvailable);

            const url = `${baseURL}?limit=${limit}&offset=${randomOffset}&apikey=${publicKey}&ts=${timestamp}&hash=${hash}`;
            const response = await fetch(url);
            if (!response.ok) {
                data_out = data;
                break;
            }
            const data = await response.json();
            const character = data.data.results[0];
            let essentials = {
                id: character.id.toString(),
                name: character.name,
                description: character.description,
                thumbnail: {
                    url: `${character.thumbnail.path}.${character.thumbnail.extension}`,
                },
            };
            data_out = data;
            out.push(essentials);
        }

        if (data_out.code === 200) {

            const r = await mdb.removeCredits(userId, 1, client);
            if (r.success == false) {
                res.status(404).send(r.message);
                return;
            } else {
                const rAdding = await mdb.addCardsToUser(userId, out, client);
                if (rAdding.success == false) { res.status(404).send(rAdding.message); return; }
                else { res.status(200).send(out); return; }
                return;
            }
        } else {
            console.error("Errore API Marvel:", data_out);
            res.status(data_out.code).send('Marvel Error');
            return;
        }
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(500).send('Internal error');
    }
}

async function searchSuperHero(res, nameSH) {
    try {
        let out = [];
        let data_out;
        const timestamp = Date.now();
        const hash = CryptoJS.MD5(timestamp + privateKey + publicKey).toString(CryptoJS.enc.Hex);

        const baseURL = "https://gateway.marvel.com/v1/public/characters";
        const limit = 5; // Numero di eroi da ottenere
        const url = `${baseURL}?nameStartsWith=${nameSH}&orderBy=name&limit=${limit}&apikey=${publicKey}&ts=${timestamp}&hash=${hash}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        data.data.results.forEach(character =>  {
            let essentials = {
                id: character.id.toString(),
                name: character.name,
                description: character.description,
                thumbnail: {
                    url: `${character.thumbnail.path}.${character.thumbnail.extension}`,
                },
            };
            data_out = data;
            out.push(essentials);
        })

        if (data_out.code === 200) {
            res.status(200).send(out);
            return;
        } else {
            console.error("Errore API Marvel:", data_out);
            res.status(data_out.code).send('Marvel Error');
            return;
        }
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(400).send('Nessun super eroe trovato');
    }
}

async function addCredits(res, numberOfCredits, userId) {
    try {
        const r = await mdb.addCredits(userId, numberOfCredits, client);
        if (r.success == false) {
            res.status(404).send(r.message);
            return;
        } else {
            res.status(200);
        }
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(500).send('Internal error');
    }
}


