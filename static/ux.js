let colorlist = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c']
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

function showhideplot(id) {
    let plot = plotmap.get(componentidmap.get(id))
    let label = document.getElementById(id + 'show')
    if (plot.getAttribute('visible')) {
        plot.hideElement();
        label.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eye-off" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><line x1="3" y1="3" x2="21" y2="21" /><path d="M10.584 10.587a2 2 0 0 0 2.828 2.83" /><path d="M9.363 5.365a9.466 9.466 0 0 1 2.637 -.365c4 0 7.333 2.333 10 7c-.778 1.361 -1.612 2.524 -2.503 3.488m-2.14 1.861c-1.631 1.1 -3.415 1.651 -5.357 1.651c-4 0 -7.333 -2.333 -10 -7c1.369 -2.395 2.913 -4.175 4.632 -5.341" /></svg>'

    }
    else {
    plot.showElement();
    label.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eye" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></svg>';
    }
}

function userCreateReaction() {
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
    let content = document.getElementById('overlaycontent');
    let components = document.createElement('div');
    components.id = "componentbox";
    components.classList.add('optionbox');
    components.classList.add('dropzone');
    components.addEventListener('dragenter', doDragEnter);
    components.addEventListener('drop', doDrop);
    components.addEventListener('dragover', doDragOver);

    let dropicon = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-drag-drop" width="36" height="36" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9e9e9e" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M19 11v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
    <path d="M13 13l9 3l-4 2l-2 4l-3 -9" />
    <line x1="3" y1="3" x2="3" y2="3.01" />
    <line x1="7" y1="3" x2="7" y2="3.01" />
    <line x1="11" y1="3" x2="11" y2="3.01" />
    <line x1="15" y1="3" x2="15" y2="3.01" />
    <line x1="3" y1="7" x2="3" y2="7.01" />
    <line x1="3" y1="11" x2="3" y2="11.01" />
    <line x1="3" y1="15" x2="3" y2="15.01" />
  </svg>`
    
    for (let i =0; i < componentArray.length; i++) {
        let dragcomponent = document.createElement('div');
        dragcomponent.classList.add('dragcomponent');
        dragcomponent.classList.add('wrapcomponent');
        dragcomponent.style.backgroundColor = componentArray[i].color +'80';
        dragcomponent.id = componentArray[i].id + 'dragcomponent'
        dragcomponent.innerHTML = componentArray[i].componentName;
        dragcomponent.setAttribute('draggable', 'true');
        dragcomponent.setAttribute('data-id', componentArray[i].id);
        dragcomponent.addEventListener('dragstart', doDragStart)
        components.appendChild(dragcomponent);
    }
    content.appendChild(components);

    let reactants = document.createElement('div')
    reactants.id = "reactantbox";
    
    reactants.innerHTML = "<p>Reactants</p>";
    let reactantdropzone = document.createElement('div');
    reactantdropzone.classList.add('dropzone');
    reactantdropzone.id ='reactantdropzone';
    reactantdropzone.addEventListener('dragenter', doDragEnter);
    reactantdropzone.addEventListener('drop', doDrop);
    reactantdropzone.addEventListener('dragover', doDragOver);
    reactants.appendChild(reactantdropzone);
    
    content.appendChild(reactants);
    reactants.style.width = '50%';




    let products = document.createElement('div')
    products.id = "productbox";
    
    products.innerHTML = "<p>Products</p>";
    let productdropzone = document.createElement('div');
    productdropzone.classList.add('dropzone');
    productdropzone.id = 'productdropzone'
    productdropzone.addEventListener('dragenter', doDragEnter);
    productdropzone.addEventListener('drop', doDrop);
    productdropzone.addEventListener('dragover', doDragOver);
    products.appendChild(productdropzone);
    products.style.width = '50%';
    content.appendChild(products);

    let next = document.createElement('button');
    next.innerText = 'Next'
    next.classList.add('formbutton')
    next.id = 'reactionformstep1'
    next.disabled = true;
    next.addEventListener('click', reactionstep2)
    content.appendChild(next)
    
    
    
}

function closeoverlay() {
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    let content = document.getElementById('overlaycontent')
    content.innerHTML = ""

    
    
}

function doDragEnter(event) {
    event.preventDefault()
}

function doDrop(event) {
    event.preventDefault();
    let id = event.dataTransfer.getData("text/id");
    let newelement = document.getElementById(id+'dragcomponent')
    event.target.appendChild(newelement);
    reactionValidStep1()
    
    
    
}

function reactionValidStep1() {
    let productbox = document.getElementById('productdropzone');
    let reactantbox = document.getElementById('reactantdropzone');
    let products = productbox.children;
    let reactants = reactantbox.children;
    if (products.length > 0 && reactants.length > 0) {
        reactionformstep1.disabled = false;
    }
    else {
        reactionformstep1.disabled = true;
    }
}

function reactionstep2() {
    let productbox = document.getElementById('productdropzone');
    let reactantbox = document.getElementById('reactantdropzone');
    let products = productbox.children;
    let reactants = reactantbox.children;
    let reactioncomponents = [];
    let reactioncoeffiencts =[];
    for (let i = 0; i < reactants.length;i++) {
        reactioncomponents.push(componentidmap.get(reactants[i].dataset.id));
        reactioncoeffiencts.push(-1);
    }
    for (let i = 0; i < products.length;i++) {
        reactioncomponents.push(componentidmap.get(products[i].dataset.id));
        reactioncoeffiencts.push(1);
    }

    

    createreaction(reactioncomponents, reactioncoeffiencts, 0.1);
    closeoverlay();
    board.update();
    
    
}

function doDragStart(event) {
    event.dataTransfer.setData("text/id", event.target.dataset.id);
}

function doDragOver(event) {
    event.preventDefault();
}

function userCreateComponent() {
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
    let content = document.getElementById('overlaycontent');
    let name = document.createElement('div');
    name.id = 'namediv'
    let color = document.createElement('div');
    color.id = 'colordiv'
    let cx0 = document.createElement('div');
    cx0.id = 'cx0div'

    let labelname = document.createElement('label')
    labelname.id = 'labelname'
    labelname.appendChild(document.createTextNode('Name'))
    let labelcolor = document.createElement('label')
    labelcolor.id = 'labelcolor'
    labelcolor.appendChild(document.createTextNode('Color'))
    let labelcx0 = document.createElement('label')
    labelcx0.id = 'labelcx0'
    labelcx0.appendChild(document.createTextNode('Initial Concentration'))

    let inputname = document.createElement('input')
    inputname.id = 'inputname'
    inputname.type = 'text'
    let inputcolor = document.createElement('input')
    inputcolor.id = 'inputcolor'
    inputcolor.type = 'color'
    inputcolor.value = colorlist[getRandomInt(0, colorlist.length)];
    let inputcx0 = document.createElement('input')
    inputcx0.id = 'inputcx0'
    inputcx0.type = 'number'
    inputcx0.value = 0

    let next = document.createElement('button');
    next.innerText = 'Next'
    next.classList.add('formbutton')
    next.id = 'componentformbutton'
    next.addEventListener('click', componentForm)
    

    name.appendChild(labelname)
    name.appendChild(inputname)
    color.appendChild(labelcolor)
    color.appendChild(inputcolor)
    cx0.appendChild(labelcx0)
    cx0.appendChild(inputcx0)

    content.appendChild(name)
    content.appendChild(color)
    content.appendChild(cx0)
    content.appendChild(next)
}

function componentForm() {
    inputname = document.getElementById('inputname').value;
    inputcolor = document.getElementById('inputcolor').value;
    inputcx0 = document.getElementById('inputcx0').value;

    console.log(`input = name: ${inputname}, color: ${inputcolor}, cx0: ${inputcx0}`)
    let validname =  (/^[a-z0-9]+$/i.test(inputname))
    
    let validcolor = (/^#([0-9A-F]{3}){1,2}$/i.test(inputcolor))
    let validcx0 = (Number.isNaN(Number(inputcx0)) ? false : Number.isFinite(Number(inputcx0)) && Number(inputcx0) >= 0)
    console.log(`valid = name: ${validname}, color: ${validcolor}, cx0: ${validcx0}`)
    console.log(Number(inputcx0))
    let validinput = validcx0 && validcolor && validname

    if (validinput) {
        createandstorecomponent(inputname, Number(inputcx0), inputcolor)
    }
}

