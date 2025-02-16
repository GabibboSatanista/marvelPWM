const mainPage = document.getElementById('mainPage');
const collectionPage = document.getElementById('collectionPage');
const openingPage = document.getElementById('openingPage');

loadUserData();

async function loadUserData() {
    mainPage.classList.add('d-none');
    activateSpinner(mainPage);
    const offcanvas_username = document.getElementById('offcanvas_username');
    const img_thumbnail = document.getElementsByClassName('img-thumbnail');
    const number_credits = document.getElementById('number_credits');
    const id_user = getUserId();
    if (id_user === null) {
        console.error('Utente non loggato');
        return;
    }

    const userData = await getUserProfile(id_user);
    offcanvas_username.innerText = userData.username;
    number_credits.value = userData.credits
    img = await getImageMarvelById(userData.favourite_superhero);
    Array.from(img_thumbnail).forEach(thumb => {
        thumb.src = img;
    })
    deactivateSpinner(mainPage);
    mainPage.classList.remove('d-none');
    return userData;
}



function getUserId() {
    if (sessionStorage.getItem('user_id')) {
        return sessionStorage.getItem('user_id');
    } else if (localStorage.getItem('user_id')) {
        return localStorage.getItem('user_id');
    }

    console.error('Utente non loggato');
    window.location.href = '/';
    return null;
}

async function getUserProfile(id_user) {
    try {
        const resp = await fetch('https://marvelpwm.onrender.com/user', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id_user }),
            redirect: "follow"
        })
        const data = await resp.json();
        return data;
    } catch (error) {
        if (sessionStorage.getItem('user_id')) {
            sessionStorage.removeItem('user_id');
        } else if (localStorage.getItem('user_id')) {
            localStorage.removeItem('user_id');
        }
        window.location.href = '/';
    }
}


window.onpopstate = function (event) {
    pageActivator(event.state.page === undefined ? 'home' : event.state.page, true);
};

function pageActivator(page, callFunction) {
    if (page === 'collection') {
        collectionPage.classList.remove('d-none');
        mainPage.classList.add('d-none');
        openingPage.classList.add('d-none');
        const fakeEvent = { currentTarget: { id: page } };
        updateIcons(fakeEvent)
        //if (callFunction) { loadCollectionPage() }
    } else if (page === 'trades') {

        mainPage.classList.add('d-none');
        collectionPage.classList.add('d-none');

        if (callFunction) { loadTradesPage() }
    } else if (page === 'shop') {

        mainPage.classList.add('d-none');
        collectionPage.classList.add('d-none');


    } else if (page === 'opening') {
        openingPage.classList.remove('d-none');
        collectionPage.classList.add('d-none');
        mainPage.classList.add('d-none');
    } else {
        mainPage.classList.remove('d-none');
        collectionPage.classList.add('d-none');
        openingPage.classList.add('d-none');
        const fakeEvent = { currentTarget: { id: page } };
        updateIcons(fakeEvent)
        if (callFunction) { loadMainPage() }
    }
}

const anchors = document.querySelectorAll("#home, #collection");
function updateIcons(event) {
    anchors.forEach(anchor => {
        const icon = anchor.querySelector("i");
        if (icon) {
            if (anchor.id === "home") {
                icon.classList.remove("bi-house-door-fill");
                icon.classList.add("bi-house-door");
            } else if (anchor.id === "collection") {
                icon.classList.remove("bi-collection-fill");
                icon.classList.add("bi-collection");
            }
        }
    });

    const clickedIcon = document.getElementById(event.currentTarget.id).querySelectorAll('i')[0];
    if (clickedIcon) {
        if (event.currentTarget.id === "home") {
            clickedIcon.classList.remove("bi-house-door");
            clickedIcon.classList.add("bi-house-door-fill");
        } else if (event.currentTarget.id === "collection") {
            clickedIcon.classList.remove("bi-collection");
            clickedIcon.classList.add("bi-collection-fill");
        }
    }

}

// Aggiungi l'event listener a ciascun anchor
anchors.forEach(anchor => {
    anchor.addEventListener("click", updateIcons);
});


async function loadMainPage() {
    pageActivator('home', false);
    history.pushState('home', '', '#home');
}

async function loadCollectionPage() {
    let card_collection = document.getElementById('card_collection');
    card_collection.classList.add('d-none');
    while (card_collection.childElementCount > 1) {
        card_collection.removeChild(card_collection.lastChild);
    }
    let toClone = card_collection.firstElementChild;
    pageActivator('collection', false);
    history.pushState('collection', '', '#collection');
    userData = await getUserProfile(getUserId());
    const offcanvas = document.getElementById('offcanvas');
    activateSpinner(collectionPage);
    // Creazione di un array di promesse
    console.log(userData)
    userData.collection.map(el => {
        let clone = toClone.cloneNode(true);
        clone.id = el.id;
        clone.getElementsByClassName('card-img')[0].src = el.url;
        clone.getElementsByClassName('card-title')[0].innerText = el.name;
        clone.getElementsByClassName('card-text')[0].innerText = el.count;
        clone.classList.remove('d-none');
        clone.addEventListener('click', function (event) {
            event.preventDefault();
            const ct = event.currentTarget;
            const offcanvasInstance = new bootstrap.Offcanvas(offcanvas);
            const img = offcanvas.getElementsByClassName('img-fluid')[0];
            img.src = el.url;
            const title = offcanvas.getElementsByClassName('offcanvas-title')[0];
            title.innerText = el.name;
            const body = offcanvas.getElementsByClassName('offcanvas-body')[0];
            body.replaceChildren()

            const desc = document.createElement('p')         //FINIRE DI METTERE LE PARTI SERIES, COMICS E EVENTS + AGGIUNGERE SCAMBIO FIGURINE PER CREDITI
            desc.innerHTML = "<b>Descrizione</b><br>" + el.description

            const series = document.createElement('p')
            series.innerHTML = "<b>Serie</b><br><ul>"
            Array.from(el.series).forEach(e => {
                series.innerHTML += "<li class='mx-4'>" + e.name + "</li>"
            })
            series.innerHTML += "</ul>"
            const events = document.createElement('p')
            events.innerHTML += "<b>Eventi</b><br><ul class='mx-3'>"
            Array.from(el.events).forEach(e => {
                events.innerHTML += "<li class='mx-4'>" + e.name + "</li>"
            })
            events.innerHTML += "</ul>"
            const comics = document.createElement('p')
            comics.innerHTML += "<b>Fumetti</b><br><ul class='mx-3'>"
            Array.from(el.events).forEach(e => {
                comics.innerHTML += "<li class='mx-4'>" + e.name + "</li>"
            })
            comics.innerHTML += "</ul>"
            body.appendChild(desc)
            body.appendChild(series)
            body.appendChild(events)
            body.appendChild(comics)
            offcanvasInstance.show();
        });
        toClone.after(clone);
    });

    deactivateSpinner(collectionPage);
    card_collection.classList.remove('d-none');
}


async function getImageMarvelById(id) {
    let r = await fetch('https://marvelpwm.onrender.com/characters/' + id).then(resp => resp.json()).then(data => { return data.thumbnail.url; });
    return r;
}

async function getDataMarvelById(id) {
    let r = await fetch('https://marvelpwm.onrender.com/characters/' + id).then(resp => resp.json()).then(data => { return data; });
    return r;
}

document.getElementById('openingPacketButton').addEventListener('click', async function (event) {
    event.preventDefault();
    await openPack();
})

async function openPack() {
    user_id = getUserId();
    activateSpinner(openingPage);
    pageActivator('opening', false);
    history.pushState('opening', '', '#opening');
    const packCards = document.getElementById('packCards');
    packCards.classList.add('d-none');
    while (packCards.childElementCount > 1) {
        packCards.removeChild(packCards.lastChild);
    }
    fetch('https://marvelpwm.onrender.com/pack/open', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user_id }),
        redirect: "follow"
    }).then(response => response.json())
        .then(async data => {
            let toClone = packCards.firstElementChild;
            const offcanvas = document.getElementById('offcanvas');
            let i = 1;
            const promises = data.map(el => {
                let clone = toClone.cloneNode(true);
                clone.id = el.id;
                clone.getElementsByClassName('card-img')[0].src = el.thumbnail.url;
                clone.getElementsByClassName('card-title')[0].innerText = el.name;
                clone.getElementsByClassName('card-text')[0].innerText = 1;
                clone.classList.remove('d-none');
                toClone.after(clone);
                i++;
            })
            await Promise.all(promises);

            const number_credits = document.getElementById('number_credits');
            number_credits.value = number_credits.value - 1;
            deactivateSpinner(openingPage);
            packCards.classList.remove('d-none');
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const shopDiv = document.getElementById('shopDiv');
    const tradesDiv = document.getElementById('tradesDiv');
    if (shopDiv) {
        shopDiv.addEventListener('click', function () {
            window.location.href = '/shop.html';
        });
    }
    if (tradesDiv) {
        tradesDiv.addEventListener('click', function () {
            window.location.href = '/trades.html';
        });
    }

    const mainProfileImage = document.getElementById('mainProfileImage');
    if (mainProfileImage) {
        mainProfileImage.addEventListener('click', function () {
            window.location.href = '/profile.html';
        });
    }
});

function activateSpinner(doc) {
    let spinner = doc.getElementsByClassName('spinner-border')[0];
    spinner.classList.remove('d-none');
}

function deactivateSpinner(doc) {
    let spinner = doc.getElementsByClassName('spinner-border')[0];
    spinner.classList.add('d-none');
}


function logout() {
    if (sessionStorage.getItem('user_id')) {
        sessionStorage.removeItem('user_id');
    } else if (localStorage.getItem('user_id')) {
        return localStorage.removeItem('user_id');
    }
    window.location.href = '/';
}