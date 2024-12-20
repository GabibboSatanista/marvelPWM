let typingTimer;
const debounceTime = 2000;

loadUserData();

async function loadUserData() {
    // Seleziona tutti gli input con la classe .fake-disabled
    const inputs = document.querySelectorAll('.fake-disabled');
    const userData = await getUserProfile(getUserId());
    const fs = await getDataMarvelById(userData.favourite_superhero);
    inputs.forEach(input => {
        switch (input.id) {
            case "inputName":
                input.value = userData.username;
                break;
            case "inputEmail":
                input.value = userData.email;
                break;
            case "inputPassword":
                input.value = userData.password.slice(0, userData.password.length / 2);
                break;
            case "fs":
                input.value = fs.name;
                break;
        }
        input.addEventListener('dblclick', () => {
            // Rimuove la classe .fake-disabled per attivare l'input
            input.classList.remove('fake-disabled');
            input.classList.add('active');
            input.removeAttribute('readonly')
        });
    });
}


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
    const resp = await fetch('http://localhost:8080/user', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id_user }),
        redirect: "follow"
    })
    const data = await resp.json();
    return data;
}

document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');

    // Check if the click happened outside the dropdown
    if (!dropdown.contains(event.target)) {
        dropdownMenu.classList.remove('show'); // Close the dropdown
    }
});

async function getDataMarvelById(id) {
    let r = await fetch('http://localhost:8080/characters/' + id).then(resp => resp.json()).then(data => { return data; });
    return r;
}

document.getElementById('fs').addEventListener('input', (event) => {
    const newValue = event.target.value;
    const dropdownFS = document.getElementById('dropdownFS');
    while(dropdownFS.childElementCount > 0 ){
        dropdownFS.removeChild(dropdownFS.lastChild);
    }
    clearTimeout(typingTimer);

    if(newValue !== ''){
        typingTimer = setTimeout(async () => {
            await fetch(`http://localhost:8080/characters/search/${newValue}`, {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                redirect: "follow"
            })
                .then(resp => resp.json())
                .then(data => {
                    data.forEach(sp => {
                        let li = document.createElement('li');
                        let a = document.createElement('a');
                        a.id = sp.id;
                        a.innerText = sp.name;
                        a.classList.add('dropdown-item');
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
    }
});

async function modify() {
    const id_user = getUserId();
    const inputs = document.querySelectorAll('.active');
    let error_flag = false;
    inputs.forEach(async input => {
        if(!error_flag && input.classList.contains('active') && (input.value !== '' || input.getAttribute('placeholder') !== '')){
            switch (input.id) {
                case "inputName":
                    await fetch('http://localhost:8080/user/changeUsername', {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id_user, username: input.value }),
                        redirect: "follow"
                    }).catch(error => {
                        error_flag = true;
                        console.log(error)
                    });
                    break;
                case "inputPassword":
                    await fetch('http://localhost:8080/user/changePassword', {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id_user, password: input.value }),
                        redirect: "follow"
                    }).catch(error => {
                        error_flag = true;
                        console.log(error)
                    });
    
                    break;
                case "fs":
                    await fetch('http://localhost:8080/user/changeFavouteSuperhero', {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id_user, fs: input.getAttribute('placeholder') }),
                        redirect: "follow"
                    }).catch(error => {
                        error_flag = true;
                        console.log(error)
                    });
                    break;
            }
        }
        const alert = document.getElementById('error_alert');
        if(error_flag){
            alert.innerText = 'Errore in fase di aggiornamento';
            alert.classList.add('alert-danger');
            alert.classList.remove('d-none');
            setInterval(function(){
                alert.classList.remove('alert-danger')
                alert.classList.add('d-none')
            }, 2000);
        }else{
            alert.innerText = 'Aggiornamento avvenuto con successo';
            alert.classList.add('alert-success');
            alert.classList.remove('d-none');
            setInterval(function(){
                alert.classList.remove('alert-success')
                alert.classList.add('d-none')
            }, 2000);
        }

    });
}
