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


async function loadActiveTrades(){
    await fetch(`http://localhost:8080/trades/active?userId=${getUserId()}&limit=100&offset=0`, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
        redirect: "follow"
    })
    .then(resp => resp.json())
    .then(data => {
        const main = document.getElementsByTagName('main')[0];
        while(main.childElementCount > 1){ main.removeChild(main.lastChild); }
        const toClone = main.getElementsByClassName('card')[0];
        data.forEach(trade => {
            console.log(trade);
            let clone = toClone.cloneNode(true);
            clone.getElementsByTagName('h5')[0].innerText = trade.username;
            clone.getElementsByTagName('img')[0].src = trade.favourite_superhero_image;
            const giveCards = clone.getElementsByClassName("giveCards")[0];
            trade.for.forEach(el => {
                const li = document.createElement('li');
                li.innerText = el.name + " x" + el.count;
                giveCards.appendChild(li); 
            })
            const wantsCards = clone.getElementsByClassName("wantsCards")[0];
            trade.want.forEach(el => {
                const li = document.createElement('li');
                li.innerText = el.name + " x" + el.count;
                wantsCards.appendChild(li); 
            })
            clone.classList.remove('d-none');
            toClone.after(clone);
        })
    });
}