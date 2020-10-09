"use strict";
// @ts-ignore
const rt = 5000;
let afsluitenGaatDoor = true;
// @ts-ignore
const na = document.getElementById('nietAfsluiten');
// @ts-ignore
const ahtml = document.getElementById('afsluit-html');
na.addEventListener('click', () => {
    afsluitenGaatDoor = false;
    ahtml.parentNode.removeChild(ahtml);
});
// @ts-ignore
document.getElementsByTagName('body')[0].addEventListener('keydown', (e) => {
    if (e.code.toLowerCase() === 'space') {
        afsluitenGaatDoor = false;
    }
});
setTimeout(() => {
    if (afsluitenGaatDoor) {
        //close(); //TODO tijdelijk niet meer afsluiten
    }
}, rt);
