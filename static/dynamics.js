// First create the board and arrays to store the reactions and components in
//todo : maybe replace with weakmap / map oid, not sure - dont think I will 
//todo : ids might break @ coeffient input if something is a product and reactant on the same reaction;. oh well \
const board = JXG.JSXGraph.initBoard('jxgbox', {
    boundingbox: [-0.5, 11, 11, -0.5],
    axis: true
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

// Component class is used to create components that can be used to set up reactions give it a name like 'A', a cx0 for where you want the point to start on the Y axis, and a color :)
class Component {
  constructor(componentName, initialcx0, color) {
    this.componentlocation = componentArray.length;
    this.componentName = componentName;
    this.color = color;
    this.cx0 = board.create('glider', [0,initialcx0,board.defaultAxes.y], {name:componentName, color:this.color});
    this.rx = [];
    this.id = getRandomInt(1,100000).toString().padStart(5,"0");
    this.cx = this.cx0.Y();
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

function createandstorecomponent(componentname, initialcx0, color) {
    if (!/^[a-z0-9]+$/i.test(componentname)) {
        console.log('invalid componentname! Please only use letters and numbers');
        var componentname = Math.random().toString(36).substr(2, 5);
        console.log(`new name ${componentname}`);
    }
    let newcomponent = new Component(componentname, initialcx0, color);
    componentArray.push(newcomponent);
    componentidmap.set(newcomponent.id, newcomponent);
    
    console.log(`created new component ${newcomponent.componentName}`);
    let math = document.createElement('p');
    mathstr = `\\frac{dC_{${componentname}}}{dt}=r_{${componentname.substr(0,4).toLowerCase()}}`;
    math.innerText = mathstr
    mathbox = document.querySelector('#math');
    mathbox.appendChild(math);
    katex.render(mathstr, math);
    return newcomponent

}

function newreactionDiv(reaction) {
    
    let newdiv = document.createElement('div');
    
    newdiv.id = reaction.id;
    newdiv.classList.add('reactiondiv');

    topdiv = document.querySelector('#reaction');
    topdiv.appendChild(newdiv);

    for(let i = 0;i < reaction.reactants.length;i++) {
        let wrapcomponent = document.createElement('div')
        wrapcomponent.classList.add('wrapcomponent');
        wrapcomponent.style.backgroundColor = reaction.reactants[i].color +'80';
        newdiv.appendChild(wrapcomponent);

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
    newdiv.appendChild(arrow);

    for(let i = 0;i < reaction.products.length;i++) {
        let wrapcomponent = document.createElement('div')
        wrapcomponent.classList.add('wrapcomponent');
        wrapcomponent.style.backgroundColor = reaction.products[i].color +'80';
        newdiv.appendChild(wrapcomponent);
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
    newdiv.appendChild(kslider);
    let kval = document.createElement('p')
    kval.id = 'kval-'+reaction.id;
    kval.innerHTML = reaction.k;
    newdiv.appendChild(kval)
    let finput = document.createElement('input');
    finput.type = 'text'
    finput.value = reaction.jcfstr;
    finput.setAttribute('onchange',  `reactionidmap.get('${reaction.id}').updatejcf(this.value); board.update();`)
    newdiv.appendChild(finput);

    
}

function createreaction(reactioncomponents, coeffiencts, kvalue) {
    
    
    let newreaction = new Reaction(reactioncomponents, coeffiencts, kvalue);
    reactionArray.push(newreaction);
    reactionidmap.set(newreaction.id, newreaction);
    console.log('created new reaction:  ' + newreaction.label());
    newreactionDiv(newreaction);
    return newreaction

}
