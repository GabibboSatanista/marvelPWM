module.exports = {
    loginAuth: loginAuth,
    addUser: addUser,
    getUser: getUser,
    deleteUser: deleteUser,
    changePassword: changePassword,
    changeUsername: changeUsername
}

const mdb = require('../mongodbClient.js');
const client = mdb.startMongoDBConnection();

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
