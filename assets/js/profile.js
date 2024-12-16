let typingTimer;
const debounceTime = 2000;


document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');

    // Check if the click happened outside the dropdown
    if (!dropdown.contains(event.target)) {
        dropdownMenu.classList.remove('show'); // Close the dropdown
    }
});

document.getElementById('fs').addEventListener('input', (event) => {
    const newValue = event.target.value;
    const dropdownFS = document.getElementById('dropdownFS');
    clearTimeout(typingTimer);

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
});

const inputs = document.querySelectorAll('input');

inputs.forEach(el => {
    console.log(el);
    el.addEventListener('dblclick', event=>{
        event.preventDefault();
        console.log('ok');
        event.currentTarget.removeAttribute('disabled');
    })
})