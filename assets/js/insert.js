//const { response } = require("express");

const offerCardsPage = document.getElementById('offerCardsPage');
const receiveCardsPage = document.getElementById('receiveCardsPage');

const offeredCards = new Map()
const wantedCards = new Map()

const count_up = document.getElementsByClassName('bi bi-chevron-up')[0]
const count_down = document.getElementsByClassName('bi bi-chevron-down')[0]
const inputNumber = document.getElementById('inputNumber')

count_up.addEventListener('click', function (event) {
    event.preventDefault()

    if (parseInt(inputNumber.value) < parseInt(inputNumber.max)) {
        let val = parseInt(inputNumber.value) + 1
        inputNumber.value = val
    }

})

count_down.addEventListener('click', function (event) {
    event.preventDefault()
    if (parseInt(inputNumber.value) > 0) {
        let val = parseInt(inputNumber.value) - 1
        inputNumber.value = val
    }
})

const input_group_receive = document.getElementById('input_group_receive')
const count_up_receive = input_group_receive.getElementsByClassName('bi bi-chevron-up')[0]
const count_down_receive = input_group_receive.getElementsByClassName('bi bi-chevron-down')[0]
const inputNumber_receive = document.getElementById('numberOfWantedCards')

count_up_receive.addEventListener('click', function (event) {
    event.preventDefault()

    if (parseInt(inputNumber_receive.value) < parseInt(inputNumber_receive.max)) {
        let val = parseInt(inputNumber_receive.value) + 1
        inputNumber_receive.value = val
    }

})

count_down_receive.addEventListener('click', function (event) {
    event.preventDefault()
    if (parseInt(inputNumber_receive.value) > 0) {
        let val = parseInt(inputNumber_receive.value) - 1
        inputNumber_receive.value = val
    }
})


window.onpopstate = function (event) {
    pageActivator(event.state.page === undefined ? 'offerCardsPage' : event.state.page, true);
};

function pageActivator(page, callFunction) {
    if (page === 'offer') {
        offerCardsPage.classList.remove('d-none');
        receiveCardsPage.classList.add('d-none');
        if (callFunction) { loadOfferCardsPage() }
    } else if (page === 'receive') {
        receiveCardsPage.classList.remove('d-none');
        offerCardsPage.classList.add('d-none');
        if (callFunction) { loadReceiveCardsPage() }
    } else {
        offerCardsPage.classList.remove('d-none');
        receiveCardsPage.classList.add('d-none');
        if (callFunction) { loadOfferCardsPage() }
    }
}

async function postTrade() {
    await fetch('http://localhost:8080/trades/create', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), give: Array.from(offeredCards, ([id,count]) => ({id, count})), wants: Array.from(wantedCards, ([id,count]) => ({id, count})) }),
        redirect: "follow"
    }).then(response => response.text())
        .then(data => {
            console.log(data)
            res = document.getElementById('resultOperationInsertTrade');
            res.classList.remove('d-none')
            setTimeout(function () {
                res.classList.add('d-none');
                window.location.href = '/index.html';
            }, 10000);
            res.innerText = data
        })
        .catch(error => console.error(error))
}

document.addEventListener('DOMContentLoaded', async function () {
    await loadOfferCardsPage();
});

function getUserId() {
    if (sessionStorage.getItem('user_id')) {
        return sessionStorage.getItem('user_id');
    } else if (localStorage.getItem('user_id')) {
        return localStorage.getItem('user_id');
    }
    console.error('Utente non loggato');
    return null;
}

async function getUserProfile(id_user) {
    try {
        const resp = await fetch('http://localhost:8080/user', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id_user }),
            redirect: "follow"
        })
        const data = await resp.json();
        return data;
    }catch(error){
        console.log(error)
        window.location.href= '/';
    }
}

async function getPersonalActiveTrade(id_user){
    try {
        const resp = await fetch('http://localhost:8080/trades/personal', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id_user, limit: "100", offset: "0" }),
            redirect: "follow"
        })
        const data = await resp.json();
        return data;
    }catch(error){
        console.log(error)
        window.location.href= '/';
    }
}

async function loadOfferCardsPage() {
    let card_collection = document.getElementById('card_collection');
    card_collection.classList.add('d-none');
    while (card_collection.childElementCount > 1) {
        card_collection.removeChild(card_collection.lastChild);
    }
    let toClone = card_collection.firstElementChild;
    pageActivator('offer', false);
    history.pushState('offer', '', '#offer');
    userData = await getUserProfile(getUserId());
    userTrade  = await getPersonalActiveTrade(getUserId());
    
    cardsAlreadyOnTrade = new Map()
    userTrade.forEach(el =>{
        el.for.forEach(c => {
            cardsAlreadyOnTrade.set(c.id, cardsAlreadyOnTrade.has(c.id) ? cardsAlreadyOnTrade.get(c.id) + c.count : c.count)
        })
    })

    const offcanvas = document.getElementById('offcanvas');

    userData.collection.map(el => {
        el.count = el.count - (cardsAlreadyOnTrade.has(el.id) ? cardsAlreadyOnTrade.get(el.id) + 1 : 1)
        if (el.count > 0) {
            let clone = toClone.cloneNode(true);
            clone.id = el.id;
            clone.getElementsByClassName('card-img')[0].src = el.url;
            clone.getElementsByClassName('card-title')[0].innerText = el.name;
            clone.getElementsByClassName('card-text')[0].innerText = el.count;
            clone.classList.remove('d-none');
            clone.addEventListener('click', function (event) {
                event.preventDefault();
                const offcanvasInstance = new bootstrap.Offcanvas(offcanvas);
                let img = offcanvas.getElementsByClassName('img-fluid')[0];
                img.src = el.url;
                let title = offcanvas.getElementsByClassName('offcanvas-title')[0];
                title.innerText = el.name;
                inputNumber.max = el.count
                if (offeredCards.has(el.id)) {
                    inputNumber.value = offeredCards.get(el.id)
                } else {
                    inputNumber.value = 0
                }

                const addOfferCard = document.getElementById('addOfferCard')
                addOfferCard.addEventListener('click', function (event) {
                    event.preventDefault()
                    if (offeredCards.has(el.id) && parseInt(inputNumber.value) == 0) {
                        offeredCards.delete(el.id)
                    }
                    if (parseInt(inputNumber.value) > 0) {
                        offeredCards.set(el.id, parseInt(inputNumber.value))
                    }
                })
                offcanvasInstance.show();

            });
            toClone.after(clone);
        }
    });

    card_collection.classList.remove('d-none');
}


async function loadReceiveCardsPage() {
    pageActivator('receive', false);
    history.pushState('receive', '', '#receive');
}

let typingTimer;
const debounceTime = 2000;

document.getElementById('fs').addEventListener('input', (event) => {
    const newValue = event.target.value;
    const dropdownFS = document.getElementById('dropdownFS');
    while (dropdownFS.childElementCount > 0) {
        dropdownFS.removeChild(dropdownFS.lastChild);
    }
    clearTimeout(typingTimer);
    if (!newValue.includes('#')) {
        typingTimer = setTimeout(async () => {
            await fetch(`http://localhost:8080/characters/search/${newValue}`, {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                redirect: "follow"
            })
                .then(resp => resp.json())
                .then(data => {
                    console.log(data);
                    data.forEach(sp => {
                        let li = document.createElement('li');
                        let a = document.createElement('a');
                        a.id = sp.id;
                        a.innerText = sp.name;
                        a.classList.add('dropdown-item', 'text-truncate');
                        li.appendChild(a);
                        a.addEventListener('click', function (event) {
                            event.preventDefault();
                            document.getElementById('fs').value = sp.name;
                            document.getElementById('fs').setAttribute('placeholder', sp.id);
                        })
                        document.getElementById('dropdownFS').appendChild(li);
                    });
                    dropdownFS.classList.add('show');
                })
                .catch(error => console.error(error));
        }, 2000);
    }else if(newValue.includes('#credits')){
        document.getElementById('fs').setAttribute('placeholder', '#credits');
    }
});

document.getElementById('receiveAddingButton').addEventListener('click', function (event) {
    event.preventDefault()
    const hero = document.getElementById('fs')
    const qt = document.getElementById('numberOfWantedCards').value
    const tableBody = document.getElementById('tableBody')

    if (hero.placeholder && qt > 0 && !wantedCards.has(hero.placeholder)) {
        wantedCards.set(hero.placeholder, parseInt(qt))

        const tr = document.createElement('tr')

        const th = document.createElement('th')
        th.setAttribute('scope', "row")
        th.innerText = wantedCards.size

        const tdID = document.createElement('td')
        tdID.innerText = hero.placeholder

        const tdName = document.createElement('td')
        tdName.innerText = hero.value

        const tdQt = document.createElement('td')
        tdQt.innerText = qt
        tr.appendChild(th)
        tr.appendChild(tdID)
        tr.appendChild(tdName)
        tr.appendChild(tdQt)
        tableBody.appendChild(tr)

        console.log(wantedCards)
    }
})

document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');

    if (!dropdown.contains(event.target)) {
        dropdownMenu.classList.remove('show'); 
    }
});

async function getImageMarvelById(id) {
    let r = await fetch('http://localhost:8080/characters/' + id).then(resp => resp.json()).then(data => { return data.thumbnail.url; });
    return r;
}

async function getDataMarvelById(id) {
    let r = await fetch('http://localhost:8080/characters/' + id).then(resp => resp.json()).then(data => { return data; });
    return r;
}

function activateSpinner(doc) {
    let spinner = doc.getElementsByClassName('spinner-border')[0];
    spinner.classList.remove('d-none');
}

function deactivateSpinner(doc) {
    let spinner = doc.getElementsByClassName('spinner-border')[0];
    spinner.classList.add('d-none');
}
