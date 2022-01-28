// First create the board and arrays to store the reactions and components in
//todo : maybe replace with weakmap / map oid, not sure - dont think I will 
//todo : ids might break @ coeffient input if something is a product and reactant on the same reaction;. oh well \

const board = JXG.JSXGraph.initBoard('jxgbox', {
    boundingbox: [-0.5, 11, 11, -0.5],
    axis: true,
    showCopyright: false
  });

var runcounter = 0;
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}


var componentArray = [];
var componentidmap = new Map();
var reactionArray = [];
var reactionidmap = new Map();
let plotmap = new WeakMap()
var calctracker = 0;
let currentresult

// Component class is used to create components that can be used to set up reactions give it a name like 'A', a cx0 for where you want the point to start on the Y axis, and a color :)
class Component {
  constructor(componentName, initialcx0, color) {
    this.componentlocation = componentArray.length;
    this.componentName = componentName;
    this.color = color;
    this.cx0 = board.create('glider', [0,initialcx0,board.defaultAxes.y], {name:componentName, color:this.color});
    
    this.rx = [];
    this.rxreactionids = [];
    this.id = getRandomInt(1,100000).toString().padStart(5,"0");
    this.cx = this.cx0.Y();
    this.cx0.on('out', function() {
        for(let i=0; i< componentArray.length; i++) {
            document.getElementById(componentArray[i].id + 'cx0').value = ~~(componentArray[i].getcx0() * 100) / 100
        }
        return 0
    })
  }

  rxsum() {
      let sumrx = 0;
      let dimension = this.rx.length
      for(let i=0;i <dimension; i++ ) {
          sumrx = this.rx[i](this) + sumrx
      }
      return sumrx
  }

  getcx0() {
      return this.cx0.Y()
  }

  setcx0(y) {
      this.cx0.setPosition(JXG.COORDS_BY_USER, [0,y])
      board.update();
  }

  
}

//use this class to create new reactions, give the component objects in an array, and an array of coefficients, negative for the reactants, positive for products, and a k value.

class Reaction {
    constructor(reactioncomponents, coeffiencts, kvalue) {
        
        this.k = kvalue;
        this.number = reactionArray.length;
        this.reactioncomponents = reactioncomponents;
        this.reactionmap = new Map();
        this.reactants = [];
        this.products = [];
        this.inert =[];
        this.id = getRandomInt(1,100000).toString().padStart(5,"0");

        let defaultf =  "k"+this.number;
        let jcvarstr = 'k' + this.number;
        for (let i = 0; i < reactioncomponents.length; i++) {
            jcvarstr= jcvarstr+', c' +reactioncomponents[i].componentName.toLowerCase()
            this.reactionmap.set(reactioncomponents[i],coeffiencts[i])
            if (coeffiencts[i] < 0) {
                this.reactants.push(reactioncomponents[i]);
                defaultf = defaultf + ' * '+'c'+reactioncomponents[i].componentName.toLowerCase();
            } else if (coeffiencts[i] > 0) {
                this.products.push(reactioncomponents[i]);
                

            }
            
        }

        this.jcvars = jcvarstr;
        this.jcfstr = defaultf;
        this.jcf = board.jc.snippet(this.jcfstr,true,this.jcvars);
        function createRxFunction (component, reactants){
            function f(){
                let cx = 1;
                for(let i=0;i<this.reactants.length;i++) {
                    cx = cx * this.reactants[i].cx
                }
                
                let rate = this.k * this.reactionmap.get(component) * cx;
                return rate
            }
            return f
        }

        function createjcf (component) {
            
            function f() {
                let args = [this.k];
                for(let i=0;i<this.reactioncomponents.length;i++) {
                    args.push(this.reactioncomponents[i].cx)
                }
            
            let rate = this.jcf.apply(null,args); 
            let coef = this.reactionmap.get(component);
            rate = coef * rate
            return rate
            }
            return f

        }

        for (let i = 0; i < reactioncomponents.length;i++) {
            
            var rxfunc = createRxFunction(reactioncomponents[i]).bind(this);
            var rxjcf = createjcf(reactioncomponents[i]).bind(this);
            reactioncomponents[i].rx.push(rxjcf);
            reactioncomponents[i].rxreactionids.push(this.id);
            
        }
        
    }

    updatejcf(str) {
        
        this.jcf = board.jc.snippet(str,true,this.jcvars);
    }

    label() {
        let labelreactants = this.reactants.map(x => (this.reactionmap.get(x)* -1).toString()+ ' ' + x.componentName).join(' + ');
        let labelproducts = this.products.map(x => this.reactionmap.get(x).toString()+ ' ' + x.componentName).join(' + ');
        let label = labelreactants + ' → ' + labelproducts;
        return label
    }
}

//creates one function for the right hand side of the ode we want to solve in the dynode function
function righthandside(t, cx) {
    const dimensioncomponents = componentArray.length;
    const dimensioncx = cx.length;
    if(dimensioncomponents !== dimensioncx) {
        console.log("dimensions in function right dont match")
    }
    let rx = [];

    for(let i = 0; i < dimensioncx; i++) {
        componentArray[i].cx = cx[i]
        rx.push(componentArray[i].rxsum())
        
    }

    return rx

}

function dynode(components, interval, steps) {
    let stepsize = (interval[1]-interval[0]) / steps;
    let cx0 = []
    const dimension = components.length;
    let cx = [];

    for(let i = 0; i < dimension; i++) {
        cx0.push(components[i].cx0.Y())
    }

    let data = JXG.Math.Numerics.rungeKutta('rk4', cx0, interval, steps, righthandside);
    runcounter++;
    let time = [];
    let results = [];

    for(let j = 0; j< dimension; j++) {
        results.push([]);
    }


    for (let i = 0; i < data.length; i++) {
        time[i] = i * stepsize;
        for(let j = 0; j< dimension; j++) {
        results[j][i] = data[i][j];
        }
    }

return {
  time,
  results
};
}

function componentdiv(component) {
    let topdiv = document.getElementById('Components');
    let newdiv = document.createElement('div');
    newdiv.id = component.id;
    let namep = document.createElement('p');
    namep.innerText = component.componentName;
    namep.style.backgroundColor = component.color +'80';
    newdiv.appendChild(namep);

    let innerdiv = document.createElement('div');
    innerdiv.id = component.id+'inner';
    innerdiv.classList.add('innerComponentDiv');

    let showhide = document.createElement('div');
    showhide.id = component.id + 'show';
    showhide.checked = true;
    showhide.classList.add('button')
    
    showhide.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eye" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></svg>';
    showhide.setAttribute('onclick', `showhideplot('${component.id}');`);

    let inputcx0 = document.createElement('input');
    inputcx0.id = component.id+'cx0';
    inputcx0.type = 'Number';
    inputcx0.classList.add('numberinput');
    inputcx0.classList.add('cx0input');
    inputcx0.value = component.getcx0();
    inputcx0.setAttribute('oninput', `componentidmap.get('${component.id}').setcx0(this.value)`);
    let labelcx0 = document.createElement('label');
    labelcx0.innerText = 'Cx0';

    let trash = document.createElement('button');
    trash.classList.add('button')
    trash.classList.add('trash')
    trash.setAttribute('onclick', `deletecomponent('${component.id}')`);
    trash.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <line x1="4" y1="7" x2="20" y2="7" />
  <line x1="10" y1="11" x2="10" y2="17" />
  <line x1="14" y1="11" x2="14" y2="17" />
  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
</svg>`

    

    innerdiv.appendChild(showhide);
    innerdiv.appendChild(labelcx0);
    labelcx0.appendChild(inputcx0);
    innerdiv.appendChild(trash);
    newdiv.appendChild(innerdiv);
    topdiv.appendChild(newdiv);
}

function createandstorecomponent(componentname, initialcx0, color) {
    if (!/^[a-z0-9]+$/i.test(componentname)) {
        console.log('invalid componentname! Please only use letters and numbers');
        var componentname = Math.random().toString(36).substr(2, 5);
        console.log(`new name ${componentname}`);
    }
    let newcomponent = new Component(componentname, initialcx0, color);
    componentArray.push(newcomponent);
    componentidmap.set(newcomponent.id, newcomponent);
    addPlot(newcomponent);
    console.log(`created new component ${newcomponent.componentName}`);
    componentdiv(newcomponent);
    let math = document.createElement('p');
    mathstr = `\\frac{dC_{${componentname}}}{dt}=r_{${componentname.substr(0,4).toLowerCase()}}`;
    math.innerText = mathstr
    mathbox = document.querySelector('#math');
    mathbox.appendChild(math);
    katex.render(mathstr, math);
    return newcomponent

}

let tf = 10
let interval = [0,tf];
let steps = 100;

function addPlot(component) {
    let j = component.componentlocation;
    
    

    let resultdynode = dynode(componentArray, interval, steps);
    let plt = board.create('curve', [resultdynode.time, resultdynode.results[j]], { strokeColor: component.color, strokeWidth: 2, name: component.componentName});
    plt.updateDataArray = function() {
        let j = component.componentlocation;
        let data
        if (calctracker === 0) {
        currentresult = dynode(componentArray, interval, steps);
        }
        data = currentresult;
        calctracker++;
        if (calctracker === componentArray.length) {
            calctracker = 0;
        }
        this.dataX = data.time;
        this.dataY = data.results[j];
    }
    plotmap.set(component, plt);

}

function newreactionDiv(reaction) {
    
    let newdiv = document.createElement('div');
    
    newdiv.id = reaction.id;
    newdiv.classList.add('reactiondiv');

    topdiv = document.querySelector('#reaction');
    topdiv.appendChild(newdiv);

    let newdiv2 = document.createElement('div')
    newdiv2.id = reaction.id + 'reaction'
    newdiv2.classList.add('wrapcomponentgroup')
    newdiv.appendChild(newdiv2)

    for(let i = 0;i < reaction.reactants.length;i++) {
        let wrapcomponent = document.createElement('div')
        wrapcomponent.classList.add('wrapcomponent');
        wrapcomponent.style.backgroundColor = reaction.reactants[i].color +'80';
        newdiv2.appendChild(wrapcomponent);

        let input1 = document.createElement('input');
        input1.type = 'Number';
        input1.min = 1;
        input1.max = 99;
        input1.id = reaction.reactants[i].id + '_' + reaction.id;
        input1.value = -1*reaction.reactionmap.get(reaction.reactants[i]);
        input1.classList.add('coefInput');
        input1.setAttribute('onchange', `reactionidmap.get('${reaction.id}').reactionmap.set(componentidmap.get('${reaction.reactants[i].id}'), -1 * parseInt(this.value)); board.update();`);
        wrapcomponent.appendChild(input1);

        let label = document.createElement('label');
        label.setAttribute('for', reaction.reactants[i].id + '_' + reaction.id);
        label.classList.add('coefInput');
        label.innerText = reaction.reactants[i].componentName;
        wrapcomponent.appendChild(label);
        
    }


    let arrow = document.createElement('div');
    arrow.classList.add('arrow');
    arrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-narrow-right" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round" style="
    stroke: hsl(0deg 0% 35%);
    ">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
  <line x1="5" y1="12" x2="19" y2="12"></line>
  <line x1="15" y1="16" x2="19" y2="12"></line>
  <line x1="15" y1="8" x2="19" y2="12"></line>
    </svg>`
    newdiv2.appendChild(arrow);

    for(let i = 0;i < reaction.products.length;i++) {
        let wrapcomponent = document.createElement('div')
        wrapcomponent.classList.add('wrapcomponent');
        wrapcomponent.style.backgroundColor = reaction.products[i].color +'80';
        newdiv2.appendChild(wrapcomponent);
        let input1 = document.createElement('input');
        input1.type = 'Number';
        input1.min = 1;
        input1.max = 99;
        input1.id = reaction.products[i].id + '_' + reaction.id;
        input1.value = 1*reaction.reactionmap.get(reaction.products[i]);
        input1.classList.add('coefInput');
        input1.setAttribute('onchange', `reactionidmap.get('${reaction.id}').reactionmap.set(componentidmap.get('${reaction.products[i].id}'), parseInt(this.value)); board.update()`);

        
        wrapcomponent.appendChild(input1);
        let label = document.createElement('label');
        label.setAttribute('for', reaction.products[i].id + '_' + reaction.id);
        label.classList.add('coefInput');
        label.innerText = reaction.products[i].componentName;
        wrapcomponent.appendChild(label);
        
    }
    let newdiv3 = document.createElement('div');
    newdiv3.classList.add('reactionsettingsgroup');
    newdiv.appendChild(newdiv3);
    let kslider = document.createElement('input');
    kslider.classList.add('slider');
    kslider.classList.add('k-slider');
    kslider.type = 'range';
    kslider.min = 0;
    kslider.max = 0.5;
    kslider.step =0.01;
    kslider.value = reaction.k;

    kslider.id = 'k-'+reaction.id;
    kslider.setAttribute("oninput", `reactionidmap.get('${reaction.id}').k = parseFloat(this.value); board.update(); document.getElementById('kval-${reaction.id}').innerHTML = this.value;`);
    newdiv3.appendChild(kslider);
    let kval = document.createElement('p')
    kval.id = 'kval-'+reaction.id;
    kval.innerHTML = reaction.k;
    newdiv3.appendChild(kval)
    let finput = document.createElement('input');
    finput.type = 'text'
    finput.value = reaction.jcfstr;
    finput.setAttribute('onchange',  `reactionidmap.get('${reaction.id}').updatejcf(this.value); board.update();`)
    newdiv3.appendChild(finput);

    let trash = document.createElement('button');
    trash.setAttribute('onclick', `deletereaction('${reaction.id}')`);
    trash.classList.add('button')
    trash.classList.add('trash')
    trash.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <line x1="4" y1="7" x2="20" y2="7" />
  <line x1="10" y1="11" x2="10" y2="17" />
  <line x1="14" y1="11" x2="14" y2="17" />
  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
</svg>`

    newdiv2.appendChild(trash)

    

    
}


function createreaction(reactioncomponents, coeffiencts, kvalue) {
    
    
    let newreaction = new Reaction(reactioncomponents, coeffiencts, kvalue);
    reactionArray.push(newreaction);
    reactionidmap.set(newreaction.id, newreaction);
    console.log('created new reaction:  ' + newreaction.label());
    newreactionDiv(newreaction);
    return newreaction

}

function deletereaction(id) {
    /*side effects to be removed when the reaction is removed:
        - a function gets stored in the rx array for all the components in the reaction
        -a reaction div element is created
        - reaction is stored in reaction array
        -reaction is stored in reactionidmap

    */

    let reaction = reactionidmap.get(id)
    reactionArray.splice(reaction.number, 1)

    for(let i = reaction.number; i < reactionArray.length; i++) {
        reactionArray[i].number = i;
    }

    let reactiondiv = document.getElementById(reaction.id);
    for(let i = 0; i< reaction.reactioncomponents.length; i++) {
        let index = reaction.reactioncomponents[i].rxreactionids.indexOf(reaction.id);
        if (index !== -1) {
        reaction.reactioncomponents[i].rxreactionids.splice(index, 1);
        reaction.reactioncomponents[i].rx.splice(index, 1);
        }

    }

    reactiondiv.innerHTML = ""
    reactiondiv.parentNode.removeChild(reactiondiv);
    board.update()


    
}

function deletecomponent(id) {
    /* side effects 
    reactions : delete using the ids stored in rxreactionids
    componentArray: verwijder en update de locaties voor de andere componenten
    verwijder uit de componentIDmap 
    Verwijder glider van board
    verwijder plot van board
    verwijder plot uit plotmap

    */
    let component = componentidmap.get(id);
    let reactions = [...component.rxreactionids];
    let location = component.componentlocation;
    board.suspendUpdate();

    if (reactions.length !== 0) {
    for(let i = 0; i<reactions.length; i++) {
        deletereaction(reactions[i])
    }}

    

    componentArray.splice(location, 1);
    componentidmap.delete(id)

    for(let i = 0; i < componentArray.length;i++) {
        componentArray[i].componentlocation = i;
    }
     
    
    board.removeObject(component.cx0);
    let plot = plotmap.get(component)
    plotmap.delete(component)
    board.removeObject(plot);
    board.unsuspendUpdate();

    

    let div = document.getElementById(id);
    div.parentNode.removeChild(div);
}

function testupdate() {
    board.update();
}