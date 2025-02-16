const { type } = require('os');
const { resourceUsage, off } = require('process');

module.exports = {
    startMongoDBConnection: startMongoDBConnection,
    insertUserIntoDB: insertUserIntoDB,
    searchingByEmailEPAss: searchingByEmailEPAss,
    deleteUserById: deleteUserById,
    getUserFromDB: getUserFromDB,
    changePassword: changePassword,
    changeUsername: changeUsername,
    removeCredits: removeCredits,
    addCardsToUser: addCardsToUser,
    addCredits: addCredits,
    changeFavouteSuperhero: changeFavouteSuperhero,
    getActiveTrade: getActiveTrade,
    getPersonalTrade: getPersonalTrade,
    makeTrade: makeTrade,
    postTrade: postTrade
}

//SISTEMARE
function encrypt(text) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const iv = Buffer.from('intrecciamentocosmico', 'utf8').slice(0, 16);
    const password = 'passwordantisgamo';
    let key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function startMongoDBConnection() {
    const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
    require("dotenv").config();
    const mongo_db_url = process.env.mongo_db_url;
    const client = new MongoClient(mongo_db_url, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    return client;
}

async function connectingToTestServer(client, dbName, collectionName) {
    await client.connect();
    return client.db(dbName).collection(collectionName);

}

async function closeClientConnection(client) {
    await client.close();
}

async function insertUserIntoDB(data, client) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collection_users = process.env.collection_users;
    const collection_album = process.env.collection_album;
    try {
        users = await connectingToTestServer(client, dbName, collection_users);
        if (await doesUsernameExist(users, data.username)) return { success: false, message: "Nome utente giá esistente." }
        if (await doesEmailExist(users, data.email)) return { success: false, message: "Email giá esistente." }

        data.password = encrypt(data.password);
        data.collection = [];
        data.credits = Number('0');
        let resp = await users.insertOne(data);
        return { success: true, id: resp.insertedId.toString() };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Errore in fase di registrazione." };
    } finally {
        await closeClientConnection(client)
    }
}

async function searchingByEmailEPAss(email, password, client) {
    const { ObjectId } = require('mongodb');
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        return await collection.findOne({ email: email, password: encrypt(password) });
    } catch (error) {
        console.error(error);
        return undefined;
    } finally {
        await closeClientConnection(client);
    }
}

async function getUserFromDB(id, client) {
    const { ObjectId } = require('mongodb');
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(id);
        return await collection.findOne({ _id: objectId });
    } catch (error) {
        console.error(error);
        return undefined;
    } finally {
        await closeClientConnection(client);
    }
}



async function deleteUserById(id, client) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionTrades = process.env.collection_trades;
    const collectionUsers = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        const usersCollection = await connectingToTestServer(client, dbName, collectionUsers);
        const tradesCollection = await connectingToTestServer(client, dbName, collectionTrades);
        const objectId = new ObjectId(id);
        resUser = await usersCollection.deleteOne({ _id: objectId });
        resTrades = await tradesCollection.deleteOne({from: id})
        if (resUser.deletedCount == 0) { return {success: false, message: "Utente inesistente"} } else { return {success: true, message: "Utente eliminato con successo"}; }
    } catch (error) {
        console.error(error);
        return {success: false, message: "Errore in fase di eliminazione"};
    } finally {
        await closeClientConnection(client);
    }
}

async function changePassword(id, newPsw, client) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(id);
        const user = await collection.findOne({ _id: objectId });

        if (!user) {
            return { success: false, message: "Utente non trovato" };
        }

        const result = await collection.updateOne(
            { _id: objectId },
            { $set: { password: encrypt(newPsw) } }
        );

        if (result.modifiedCount === 1) {
            return { success: true, message: "Password aggiornata con successo" };
        } else {
            return { success: false, message: "Errore durante l'aggiornamento della password" };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Errore durante l'aggiornamento della password" };
    } finally {
        await closeClientConnection(client);
    }
}


async function changeUsername(id, newUsr, client) {
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        if (await doesUsernameExist(collection, newUsr)) return { success: false, message: "Nome utente giá esistente." }

        const objectId = new ObjectId(id);
        const user = await collection.findOne({ _id: objectId });

        if (!user) {
            return { success: false, message: "Utente non trovato." };
        }

        const result = await collection.updateOne(
            { _id: objectId },
            { $set: { username: newUsr } }
        );

        if (result.modifiedCount === 1) {
            return { success: true, message: "Username aggiornata con successo." };
        } else {
            return { success: false, message: "Errore durante l'aggiornamento dell'username." };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Errore durante l'aggiornamento della username." };
    } finally {
        await closeClientConnection(client);
    }
}

async function changeFavouteSuperhero(id, fs, client) {
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(id);
        const user = await collection.findOne({ _id: objectId });

        if (!user) {
            return { success: false, message: "Utente non trovato." };
        }

        const result = await collection.updateOne(
            { _id: objectId },
            { $set: { favourite_superhero: fs } }
        );

        if (result.modifiedCount === 1) {
            return { success: true, message: "super erore preferito aggiornato con successo." };
        } else {
            return { success: false, message: "Errore durante l'aggiornamento del super erore preferito." };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Errore durante l'aggiornamento del super erore preferito." };
    } finally {
        await closeClientConnection(client);
    }
}

async function removeCredits(id, credits_to_remove, client) {
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(id);
        const usr = await collection.findOne({ _id: objectId });
        if (!usr) {
            return { success: false, message: "Utente non trovato." };
        }

        const credits = usr.credits;
        if (credits === undefined || credits === null) {
            return { success: false, message: "I crediti dell'utente non sono stati trovati." };
        }

        const result = await collection.updateOne(
            { _id: objectId },
            { $set: { credits: credits - credits_to_remove } }
        );

        if (result.modifiedCount === 1) {
            return { success: true, message: "Aggiornamento crediti riuscito" };
        } else {
            return { success: false, message: "Errore durante l'aggiornamento crediti." };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Errore durante l'aggiornamento crediti." };
    } finally {
        await closeClientConnection(client);
    }
}

async function addCredits(id, credits_to_add, client) {
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(id);
        const usr = await collection.findOne({ _id: objectId });

        
        if (!usr) {
            return { success: false, message: "Utente non trovato." };
        }

        
        const credits = usr.credits;
        if (credits === undefined || credits === null) {
            return { success: false, message: "I crediti dell'utente non sono stati trovati." };
        }

        const result = await collection.updateOne(
            { _id: objectId },
            { $set: { credits: credits + credits_to_add } }
        );

        if (result.modifiedCount === 1) {
            return { success: true, message: "Aggiornamento crediti riuscito" };
        } else {
            return { success: false, message: "Errore durante l'aggiornamento crediti." };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Errore durante l'aggiornamento crediti." };
    } finally {
        await closeClientConnection(client);
    }
}

async function addCardsToUser(userId, newCards, client) {
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(userId);
        const usr = await collection.findOne({ _id: objectId });

        if (!usr) { return { success: false, message: "Utente non trovato." }; }

        const cards = usr.collection;

        newCards.forEach(el => {
            let id = el.id;
            let card = cards.find(card => card.id === id);
            if (card) {
                card.count = (parseInt(card.count) + 1).toString();
            } else {
                cards.push({ id: id, count: 1 })
            }
        });


        const result = await collection.updateOne(
            { _id: objectId },
            { $set: { collection: cards } }
        );

        if (result.modifiedCount === 1) {
            return { success: true, message: "Aggiornamento carte collezione riuscito" };
        } else {
            return { success: false, message: "Errore durante l'aggiornamento delle carte." };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: error };
    } finally {
        await closeClientConnection(client);
    }
}

async function doesUsernameExist(collection, username) {
    try {
        const exists = await collection.findOne({ username: username });
        return exists ? true : false; 
    } catch (error) {
        console.error("Errore durante il controllo del nome utente:", error);
        return false; 
    }
}

async function doesEmailExist(collection, email) {
    try {
        const exists = await collection.findOne({ email: email });
        return exists ? true : false; 
    } catch (error) {
        console.error(error);
        return false; 
    }
}


async function getActiveTrade(userId, limit, offset, client) {
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_trades;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(userId);
        const trades = await collection.find({ from: { $ne: userId } }).skip(parseInt(offset, 10)).limit(parseInt(limit, 10)).toArray();

        if (!trades) { return { success: false, message: "Nessuno scambio disponibile" } };
        return { success: true, message: trades };
    } catch (error) {
        console.error(error);
        return { success: false, message: error };
    } finally {
        await closeClientConnection(client);
    }
}

async function getPersonalTrade(userId, limit, offset, client){
    require("dotenv").config(); changeUsername
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_trades;
    const { ObjectId } = require('mongodb');
    try {   
        collection = await connectingToTestServer(client, dbName, collectionName);
        const trades = await collection.find({ from: userId }).skip(parseInt(offset, 10)).limit(parseInt(limit, 10)).toArray();
        if (!trades) { return { success: false, message: "Nessuno scambio disponibile" } };
        return { success: true, message: trades };
    } catch (error) {
        console.error(error);
        return { success: false, message: error };
    } finally {
        await closeClientConnection(client);
    }
}

async function makeTrade(tradeId, userId, client) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionTrades = process.env.collection_trades;
    const collectionUsers = process.env.collection_users;
    const { ObjectId } = require("mongodb");

    try {
        const tradesCollection = await connectingToTestServer(client, dbName, collectionTrades);
        const trade = await tradesCollection.findOne({ _id: new ObjectId(tradeId) });

        if (!trade) {
            return { success: false, message: "Nessuno scambio disponibile" };
        }

        const usersCollection = client.db(dbName).collection(collectionUsers);

        const tradeCanBeMade = await validateTrade(usersCollection, trade, userId);
        if (!tradeCanBeMade) {
            return { success: false, message: "Non è possibile effettuare lo scambio" };
        }

        await executeTrade(usersCollection, trade, userId);
        tradesCollection.deleteOne({_id: new ObjectId(tradeId)})
        return { success: true, message: "Scambio eseguito con successo" };
    } catch (error) {
        console.error("Errore durante l'esecuzione dello scambio:", error);
        return { success: false, message: error.message };
    }
}


async function validateTrade(usersCollection, trade, userId) {
    const { ObjectId } = require("mongodb");

    const fromUser = await usersCollection.findOne({ _id: new ObjectId(trade.from) });
    const toUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!fromUser || !toUser) {
        throw new Error("Utente non trovato");
    }

    for (const { id, count } of trade.for) {
        if (id !== '#credits') {
            const card = fromUser.collection.find(item => item.id === id);
            if (!card || card.count == 1 || card.count < count) {
                return false; 
            }
        } else {
            if (fromUser.credits < count) {
                return false
            }
        }
    }

    for (const { id, count } of trade.want) {
        if (id !== '#credits') {
            const card = toUser.collection.find(item => item.id === id);
            if (!card || card.count == 1 || card.count < count) {
                return false;
            }
        } else {
            if (toUser.credits < count) {
                return false
            }
        }
    }

    return true;
}

async function executeTrade(usersCollection, trade, userId) {
    const { ObjectId } = require("mongodb");
    for (const { id, count } of trade.for) {
        if (id !== "#credits") {
            await usersCollection.updateOne(
                { _id: new ObjectId(trade.from), "collection.id": id },
                { $inc: { "collection.$.count": -count } }
            );

            const resultAdd = await usersCollection.updateOne(
                { _id: new ObjectId(userId), "collection.id": id },
                { $inc: { "collection.$.count": count } }
            );

            if (resultAdd.matchedCount === 0) {
                await usersCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    { $push: { collection: { id: id, count: count } } }
                );
            }
        } else {
            await usersCollection.updateOne(
                { _id: new ObjectId(trade.from) },
                { $inc: { "credits": + count } }
            );
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { "credits": - count } }
            );
        }
    }

    for (const { id, count } of trade.want) {
        if (id !== "#credits") {
            await usersCollection.updateOne(
                { _id: new ObjectId(userId), "collection.id": id },
                { $inc: { "collection.$.count": -count } }
            );

            const resultAdd = await usersCollection.updateOne(
                { _id: new ObjectId(trade.from), "collection.id": id },
                { $inc: { "collection.$.count": count } }
            );

            if (resultAdd.matchedCount === 0) {
                await usersCollection.updateOne(
                    { _id: new ObjectId(trade.from) },
                    { $push: { collection: { id: id, count: count } } }
                );
            }
        }else{
            await usersCollection.updateOne(
                { _id: new ObjectId(trade.from) },
                { $inc: { "credits": + count } }
            );
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { "credits": - count } }
            );
        }
    }
}


async function postTrade(userId, give, wants, client) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionTrades = process.env.collection_trades;
    const collectionUsers = process.env.collection_users;
    const { ObjectId } = require("mongodb");

    try {
        const usersCollection = await connectingToTestServer(client, dbName, collectionUsers);
        const tradesCollection = await connectingToTestServer(client, dbName, collectionTrades);
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        const userActiveTrades = await tradesCollection.find({ from: userId }).toArray();
        if (!user) { return { success: false, message: "Utente non trovato" }; }

        let activeTradesMap = new Map();
        userActiveTrades.forEach(el => {
            el.for.forEach(card => {
                activeTradesMap.set(card.id, activeTradesMap.has(card.id) ? activeTradesMap.get(card.id) + card.count : card.count)
            })
        })


        for (const { id, count } of give) {
            const card = user.collection.find(c => c.id === id);
            const alreadyInTradeCount = activeTradesMap.has(id) ? activeTradesMap.get(id) : 0
            if (!card || card.count - alreadyInTradeCount < 1) {
                return { success: false, message: "Non é possibile creare lo scambio" };
            }
        }

        let giveMap = new Map(give.map(obj => [obj.id, obj.count]))
        let wantsMap = new Map(wants.map(obj => [obj.id, obj.count]))

        for (let key of giveMap.keys()) {
            if (wantsMap.has(key)) {
                return { success: false, message: "Sono presenti carti uguali." };
            }
        }

        const result = await tradesCollection.insertOne({
            from: userId,
            for: give,
            want: wants
        });

        return { success: true, message: "Creazione dello scambio eseguita con successo" };
    } catch (error) {
        console.error("Errore durante l'esecuzione della creazione dello scambio:", error);
        return { success: false, message: error.message };
    }
}