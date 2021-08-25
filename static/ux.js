function setadvkinetics() {
    let advKineticsCheckbox = document.querySelector('input[value="adv"]');
    let n1slider = document.getElementById("n1sliderbox");
    let n2slider = document.getElementById("n2sliderbox")
    if(advKineticsCheckbox.checked) {
        n1slider.style.visibility = 'visible';
        n1slider.style.display = 'flex';
        n2slider.style.visibility = 'visible';
        n2slider.style.display = 'flex';
        document.getElementById('func1').value = "k1 *(ca^n1)*(cb^n2)";
        document.getElementById('func1box').style.visibility = 'visible';
        document.getElementById('func1box').style.display = 'flex';
        document.getElementById('func1dropdownbox').style.visibility = 'hidden';
        document.getElementById('func1dropdownbox').style.display = 'none';
    }
     else {
        n1slider.style.visibility = 'hidden';
        n1slider.style.display = 'none';
        n2slider.style.visibility = 'hidden';
        n2slider.style.display = 'none';
        document.getElementById('func1').value = "k1 * ca * cb";
        document.getElementById('func1box').style.visibility = 'hidden';
        document.getElementById('func1box').style.display = 'none';
        document.getElementById('func1dropdownbox').style.visibility = 'visible';
        document.getElementById('func1dropdownbox').style.display = 'flex';
    }
}

