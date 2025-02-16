const user_id = getUserId();

function getUserId() {
    if (sessionStorage.getItem('user_id')) {
        return sessionStorage.getItem('user_id');
    } else if (localStorage.getItem('user_id')) {
        return localStorage.getItem('user_id');
    }
    console.error('Utente non loggato');
    return null;
}


document.addEventListener('DOMContentLoaded', async function () {
    await loadActiveTrades();
});



async function loadActiveTrades() {
    await fetch(`http://localhost:8080/trades/active`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), limit: 100, offset: 0 }),
        redirect: "follow"
    })
        .then(resp => resp.json())
        .then(data => {
            const main = document.getElementsByTagName('main')[0];
            while (main.childElementCount > 1) { main.removeChild(main.lastChild); }
            const toClone = main.getElementsByClassName('card')[0];
            data.forEach(trade => {
                console.log(trade);
                let clone = toClone.cloneNode(true);
                clone.id = trade['_id']
                clone.getElementsByTagName('h5')[0].innerText = trade.username;
                clone.getElementsByTagName('img')[0].src = trade.favourite_superhero_image;

                clone.classList.remove('d-none');

                clone.addEventListener('click', (event) => {
                    event.preventDefault()
                    const offcanvas = document.getElementById('offcanvas');
                    const offcanvasInstance = new bootstrap.Offcanvas(offcanvas);
                    const giveCards = document.getElementsByClassName("giveCards")[0];
                    document.getElementById('offcanvasLabel').innerText = event.currentTarget.getElementsByTagName('h5')[0].innerText
                    document.getElementById('resultTrade').innerText = ""
                    giveCards.replaceChildren()
                    trade.for.forEach(el => {
                        const li = document.createElement('li');
                        li.innerText = el.name + " x" + el.count;
                        giveCards.appendChild(li);
                    })
                    const wantsCards = document.getElementsByClassName("wantsCards")[0];
                    wantsCards.replaceChildren()
                    trade.want.forEach(el => {
                        const li = document.createElement('li');
                        li.innerText = el.name ? el.name : (el.id == "#credits" ? "credits" : el.id)  + " x" + el.count;
                        wantsCards.appendChild(li);
                    })

                    const btn = document.getElementsByClassName('acceptTradeButton')[0]
                    btn.id = "id-" + event.currentTarget.id

                    offcanvasInstance.show()
                })
                toClone.after(clone);
            })
        });
}


const acceptButton = document.getElementsByClassName('acceptTradeButton')[0]
acceptButton.addEventListener('click', async function (event) {
    event.preventDefault()
    id_trade = event.currentTarget.id.split("id-")[1]
    await fetch('http://localhost:8080/trades', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId: id_trade, userId: getUserId() }),
        redirect: "follow"
    }).then(response => response.text())
        .then(data => {
            const resTrade = document.getElementById('resultTrade')
            resTrade.innerText = data
        })
        .catch(error => {
            console.log(error)
        })
})
