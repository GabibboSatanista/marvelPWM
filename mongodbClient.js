const { type } = require('os');
const { resourceUsage } = require('process');

module.exports = {
    startMongoDBConnection: startMongoDBConnection,
    insertUserIntoDB: insertUserIntoDB,
    searchingByEmailEPAss: searchingByEmailEPAss,
    deleteUserById: deleteUserById,
    getUserFromDB: getUserFromDB,
    changePassword: changePassword,
    changeUsername: changeUsername,
    removeCredits: removeCredits,
    addCardsToUser: addCardsToUser
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
    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
        data.credits = '0';
        let resp = await users.insertOne(data);

        return;
    } catch (error) {
        console.log(error);
        return null;
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
        console.log(error);
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
        return await collection.find({ _id: objectId }).toArray();
    } catch (error) {
        console.log(error);
        return undefined;
    } finally {
        await closeClientConnection(client);
    }
}



async function deleteUserById(id, client) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_users;
    const { ObjectId } = require('mongodb');
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const objectId = new ObjectId(id);
        res = await collection.deleteOne({ _id: objectId });
        console.log(res);
        if (res.deletedCount == 0) { return false; } else { return true; }
    } catch (error) {
        console.log(error);
        return false;
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
        // Trova l'utente nel database
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
        console.log(error);
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

        //check username giá esistente
        if (await doesUsernameExist(collection, newUsr)) return { success: false, message: "Nome utente giá esistente." }

        const objectId = new ObjectId(id);
        // Trova l'utente nel database
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
        console.log(error);
        return { success: false, message: "Errore durante l'aggiornamento della username." };
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
        console.log(id);
        const usr = await collection.findOne({ _id: objectId });

        // Se l'utente non esiste, restituisci un errore
        if (!usr) {
            return { success: false, message: "Utente non trovato." };
        }

        // Verifica che il campo credits esista e sia un numero
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
        console.log(error);
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

        // Se l'utente non esiste, restituisci un errore
        if (!usr) { return { success: false, message: "Utente non trovato." }; }

        const cards = usr.collection;

        newCards.forEach(el => {
            let id = el.id;
            let card = cards.find(card => card.id === id);
            if (card) {
                // Incrementa il valore di count di 1
                card.count = (parseInt(card.count) + 1).toString();
            }else{
                cards.push({id: id, count: "1"})
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
        console.log(error);
        return { success: false, message: error };
    } finally {
        await closeClientConnection(client);
    }
}

async function doesUsernameExist(collection, username) {
    try {
        // Usa findOne per cercare il nome utente
        const exists = await collection.findOne({ username: username });
        return exists ? true : false; // Ritorna true se esiste, false altrimenti
    } catch (error) {
        console.error("Errore durante il controllo del nome utente:", error);
        return false; // Considera false in caso di errore per sicurezza
    }
}

async function doesEmailExist(collection, email) {
    try {
        // Usa findOne per cercare il email utente
        const exists = await collection.findOne({ email: email });
        return exists ? true : false; // Ritorna true se esiste, false altrimenti
    } catch (error) {
        console.error(error);
        return false; // Considera false in caso di errore per sicurezza
    }
}

//----------------------------------------------------------
//ARTICOLI
/*
async function getArticoli(client, genere, tipo_articolo) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_catalogue;
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        filtro = {}
        if (genere !== undefined && genere !== 'n') { filtro.genere = genere }
        if (tipo_articolo !== undefined && tipo_articolo !== 'n') { filtro.tipo_articolo = tipo_articolo }
        return await collection.find(filtro).toArray();
    } catch (error) {
        console.log(error);
        return false;
    } finally {
        await closeClientConnection(client);
    }
}

async function getArticoliByDataDecrescente(client, genere, limit) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_catalogue;
    try {
        collection = await connectingToTestServer(client, dbName, collectionName);
        const filter = genere ? { genere: genere } : {};
        const results = await collection.find(filter)
            .sort({ data: -1 }) // Ordina per data decrescente
            .limit(limit)           // Limita i risultati a 5 documenti
            .toArray();

        return results;
    } catch (error) {
        console.log(error);
        return false;
    } finally {
        await closeClientConnection(client);
    }
}

async function postArticoli(client, body) {
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_catalogue;

    try {
        collection = await connectingToTestServer(client, dbName, collectionName);

        const words = body.split('+');

        const filteredWords = words.filter(word => word.length > 3);


        const regexArray = filteredWords.map(word => {
            return { descrizione: { $regex: word, $options: 'i' } };
        });


        const filter = { $or: regexArray };

        return await collection.find(filter).toArray();
    } catch (error) {
        console.log(error);
        return false;
    } finally {
        await closeClientConnection(client);
    }
}

async function getArticoloById(client, id){
    const { ObjectId } = require('mongodb');
    require("dotenv").config();
    const dbName = process.env.db_name;
    const collectionName = process.env.collection_catalogue;
    try{
        collection = await connectingToTestServer(client, dbName, collectionName);
        return await collection.findOne({_id: new ObjectId(id)});
    }catch(error){
        console.log(error);
        return undefined;
    }finally{
        await closeClientConnection(client);
    }
}
    */