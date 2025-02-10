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
    changeFavouteSuperhero: changeFavouteSuperhero,
    getActiveTrade: getActiveTrade,
    makeTrade: makeTrade,
    postTrade: postTrade
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

async function getUser(res, id) {
    try {
        const r = await mdb.getUserFromDB(id, client);
        if (r !== undefined) {
            for (const el of r.collection) {
                const sh = await getCharacterByIdInner(el.id);
                el.name = sh.name;
                el.description = sh.description;
                el.url = sh.thumbnail.url;
                el.comics = sh.comics,
                el.series = sh.series,
                el.events = sh.events
            }
            return res.status(200).send(r);
        } else {
            res.status(400).send("No buono");
            return null;
        }
    } catch (error) {
        console.error("Errore durante la richiesta dell'utente:", error);
        res.status(500).send("Internal error");
        return null;
    }
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

function changeFavouteSuperhero(res, id, fs) {
    mdb.changeFavouteSuperhero(id, fs, client).then(r => {
        if (r.success == false) {
            return res.status(404).send(r.message)
        } else {
            return res.status(200).send(r.message);
        }
    });
}

async function getCharacterById(res, characterId) {
    const timestamp = Date.now();
    const hash = CryptoJS.MD5(timestamp + privateKey + publicKey).toString(CryptoJS.enc.Hex);
    const url = `https://gateway.marvel.com/v1/public/characters/${characterId}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
    console.log(url)
    try {

        const response = await fetch(url);


        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }


        const data = await response.json();
        

        if (data.code === 200) {
            const character = data.data.results[0];
            const essentials = {
                name: character.name,
                description: character.description,
                thumbnail: {
                    url: `${character.thumbnail.path}.${character.thumbnail.extension}`,
                },
                comics: character.comics.items.slice(0,3),
                series: character.series.items.slice(0,3),
                events: character.events.items.slice(0,3)
            };
            res.status(data.code).send(JSON.stringify(essentials));
        } else {
            res.status(data.code).send(JSON.stringify(data.message));
        }

    } catch (error) {

        console.error('Error fetching character data:', error);
        res.status(500).send('Internal server error');
    }
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
                comics: character.comics.items.slice(0,3),
                series: character.series.items.slice(0,3),
                events: character.events.items.slice(0,3)
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

        data.data.results.forEach(character => {
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
            res.status(data_out.code).send('Il personaggio non esiste.');
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

async function getActiveTrade(res, userId, limit, offset) {
    try {
        const r = await mdb.getActiveTrade(userId, limit, offset, client);

        if (r.success == false) {
            res.status(404).send(r.message);
            return;
        } else {
            
            for (const el of r.message) {
                const user = await getUserInner(el.from); 
                el.username = user.username;
                const fs = await getCharacterByIdInner(user.favourite_superhero); 
                el.favourite_superhero_image = fs.thumbnail.url;
                for (const character of el.for) {
                    if(character.id !== '#credits'){
                        const c = await getCharacterByIdInner(character.id); 
                        character.name = c.name;
                    }
                }
                for (const character of el.want) {
                    if(character.id !== '#credits'){
                        const c = await getCharacterByIdInner(character.id);
                        character.name = c.name;
                    }
                }
            }

            res.status(200).send(r.message);
        }
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(500).send('Internal error');
    }
}

async function makeTrade(res, tradeId, userId) {
    try {
        const r = await mdb.makeTrade(tradeId, userId, client);
        console.log(r.message)
        if (!r.success) {
            res.status(404).send(r.message);
        } else {
            res.status(200).send(r.message);
        }
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(500).send('Internal error');
    }
}

async function postTrade(res, userId, give, wants) {
    try {
        for (const { id, count } of give) {
            if(id != '#credits'){
                await getCharacterByIdInner(id);
            }
        }

        for (const { id, count } of wants) {
            if(id != '#credits'){
                await getCharacterByIdInner(id);
            }
        }

        const r = await mdb.postTrade(userId, give, wants, client);
        if (r.success == false) {
            res.status(404).send(r.message);
        } else {
            res.status(200).send(r.message);
        }
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(500).send('Internal error');
    }
}

async function getCharacterByIdInner(characterId) {
    const timestamp = Date.now();
    const hash = CryptoJS.MD5(timestamp + privateKey + publicKey).toString(CryptoJS.enc.Hex);
    const url = `https://gateway.marvel.com/v1/public/characters/${characterId}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
    
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.code === 200) {
            const character = data.data.results[0];

            const essentials = {
                name: character.name,
                description: character.description,
                thumbnail: {
                    url: `${character.thumbnail.path}.${character.thumbnail.extension}`,
                },
                comics: character.comics.items.splice(0,3),
                series: character.series.items.splice(0,3),
                events: character.events.items.splice(0,3)
            };
            return essentials;
        } else {
            return data.message;
        }

    } catch (error) {
        console.error('Error fetching character data:', error);
    }
}

async function getUserInner(userId) {
    try {
        const r = await mdb.getUserFromDB(userId, client);
        if (r !== undefined) {
            return r;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

