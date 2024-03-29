
//todo : ids might break @ coeffient input if something is a product and reactant on the same reaction;
//I know the names make no sense and are misleading. I blame a total lack of planning. 
//this file contains most of the code for the calculations.
//batch.js sets up some content after loading, ux.js is mostly UX related, mostly forms etc. solver.js is the rkf45 solver

const board = JXG.JSXGraph.initBoard('jxgbox', {
    boundingbox: [-0.5, 11, 11, -0.5],
    axis: true,
    showCopyright: false,
    defaultAxes: {
    	x : {
        name: 't',
      	withLabel: true,
        label: {
            position: "rt",
            offset: [-10, 10]
        }
        
      },
    	y : {
      	withLabel:true,
        name: 'N',
        label: {
            position: "rt",
            offset: [10, 0]
        }
      }
    }
  });

var runcounter = 0;
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

let uplotopts = {
    id: "volplot",
    class: "extraplot",
    width: 500,
    height: 300,
    scales: {
        x: {time: false}
    },
    series: [
        {
            label: "time"
        },
        {
            label: "Volume",
            stroke: "red"
        },
        {
            label: "V in",
            stroke: "blue"
        },
        {
            label: "V out",
            stroke: "green"
        }
    ]
}

let uplotopts2 = {
    id: "coutplot",
    class: "extraplot",
    width: 500,
    height: 300,
    scales: {
        x: {time: false}
    },
    series: [
        {
            label: "time"
        }
    ]
}

var uplotdata = [[],[],[],[]];
var uplotdata2 = [[]]
let plotelement = document.getElementById("vplot");
let vplot = new uPlot(uplotopts,uplotdata, plotelement)
let plotelement2 = document.getElementById("coutplot");
let cplot = new uPlot(uplotopts2,uplotdata2, plotelement2)

var componentArray = [];
var componentidmap = new Map();
var reactionArray = [];
var reactionidmap = new Map();
let plotmap = new WeakMap()
var calctracker = 0;
var toleranceinput = 0.015;
var hinitinput = 0.1;
var hmininput = 0.0001;
var hmaxinput = 0.5;
var cmaxinput = 100000;
let currentresult

var reactor = {
    reactortype: 'cstr1',
    initialvolume: 1,
    vin: 0,
    vout: 0,
    voljcvarstr: "t,V",
    fvin: board.jc.snippet("0",true,"t, V"),
    fvout: board.jc.snippet("0",true,"t, V"),
    dvdt: function(t, V) {
        let deltav = reactor.fvin(t, V[0]) - reactor.fvout(t,V[0])
        let resultdelta = []
        resultdelta.push(deltav)
        return deltav
    }
    


}

function updatejcfvin(str) {
    reactor.fvin = board.jc.snippet(str, true, "t, V");
    board.update();
}

function updatejcfvout(str) {
    reactor.fvout = board.jc.snippet(str, true, "t, V");
    board.update();
}

// Component class is used to create components that can be used to set up reactions give it a name like 'A', a cx0 for where you want the point to start on the Y axis, and a color :)
class Component {
  constructor(componentName, initialval, color) {
    this.componentlocation = componentArray.length;
    this.componentName = componentName;
    this.color = color;
    this.Nx0 = board.create('glider', [0,initialval,board.defaultAxes.y], {name:componentName, color:this.color});
    
    this.rx = [];
    this.rxreactionids = [];
    this.id = getRandomInt(1,100000).toString().padStart(5,"0");
    this.Nx = this.Nx0.Y();
    this.cx = this.Nx/reactor.volume;
    this.Nx0.on('out', function() {
        //adds an event handeler to update the cx0 on the page when the glider is moved. 
        for(let i=0; i< componentArray.length; i++) {
            document.getElementById(componentArray[i].id + 'cx0').value = ~~(componentArray[i].getcx0() * 100) / 100
        }
        return 0
    })
    this.cin = 0;
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
      return this.Nx0.Y()
  }

  getcin() {
      return this.cin;
  }

  setcin(value) {
      this.cin = Number(value);
      board.update();
  }

  setcx0(y) {
      this.Nx0.setPosition(JXG.COORDS_BY_USER, [0,y])
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

function rsidewithvol(t, xval) {
    //dNxdt = Fxin -Fxout  + ra*V
    //Fin and out are 0 for now //todo
    let results = [];
    let volume = [xval[0]];
    reactor.volume = xval[0];
    reactor.vin = reactor.fvin(t,volume[0])
    reactor.vout = reactor.fvout(t, volume[0])
    results.push(reactor.dvdt(t, volume));

    const dimensioncomponents = componentArray.length;
    const dimensioncx = xval.length - 1;
    if(dimensioncomponents !== dimensioncx) {
        console.log("dimensions in function right dont match")
    }

    for(let i = 1; i < dimensioncx + 1; i++) {
        componentArray[i - 1].Nx = xval[i]
        componentArray[i - 1].cx = componentArray[i -1].Nx/reactor.volume
        Fin = componentArray[i - 1].cin * reactor.vin;
        Fout = componentArray[i -1].cx * reactor.vout;
        results.push((Fin - Fout) + componentArray[i - 1].rxsum()*reactor.volume)
        
    }
    return(results)

}

function dynodeRKF45(components, interval, tolerance) {
    
    let initialvalues = [];
    initialvalues.push(reactor.initialvolume);
    const dimension = components.length;
    let cx = [];

    for(let i = 0; i < dimension; i++) {
        initialvalues.push(components[i].Nx0.Y())
    }

    let data = runrkf45(rsidewithvol,interval,initialvalues,hinitinput, toleranceinput, hmininput, hmaxinput);
    runcounter++;
    let time = data.t_res;
    let results = [];

    for(let j = 0; j< dimension + 1; j++) {
        results.push([]);
    }


    for (let i = 0; i < time.length; i++) {
        for(let j = 0; j< dimension + 1; j++) {
        results[j][i] = data.y_res[i][j];
        }
    }

return {
  time,
  results
};
}

function dynodeRK4(components, interval, steps) {
    let stepsize = (interval[1]-interval[0]) / steps;
    let initialvalues = []
    initialvalues.push(reactor.initialvolume);
    const dimension = components.length;
    let cx = [];

    for(let i = 0; i < dimension; i++) {
        initialvalues.push(components[i].Nx0.Y())
    }

    let data = JXG.Math.Numerics.rungeKutta('rk4', initialvalues, interval, steps, rsidewithvol);
    runcounter++;
    let time = [];
    let results = [];

    for(let j = 0; j< dimension + 1; j++) {
        results.push([]);
    }


    for (let i = 0; i < data.length; i++) {
        time[i] = i * stepsize;
        for(let j = 0; j< dimension + 1; j++) {
        results[j][i] = data[i][j];
        }
    }

return {
  time,
  results
};
}
/*
function dynodeRKF45(components, interval, tolerance) {
    
    let initialvalues = []
    const dimension = components.length;
    let cx = [];

    for(let i = 0; i < dimension; i++) {
        initialvalues.push(components[i].Nx0.Y())
    }

    let data = runrkf45(righthandside,interval,initialvalues);
    runcounter++;
    let time = data.t_res;
    let results = [];

    for(let j = 0; j< dimension; j++) {
        results.push([]);
    }


    for (let i = 0; i < time.length; i++) {
        for(let j = 0; j< dimension; j++) {
        results[j][i] = data.y_res[i][j];
        }
    }

return {
  time,
  results
};
}
*/
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
    
    showhide.innerHTML = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eye" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></svg>';
    showhide.setAttribute('onclick', `showhideplot('${component.id}');`);

    let inputcx0 = document.createElement('input');
    inputcx0.id = component.id+'cx0';
    inputcx0.type = 'Number';
    inputcx0.classList.add('numberinput');
    inputcx0.classList.add('cx0input');
    inputcx0.value = component.getcx0();
    inputcx0.setAttribute('oninput', `componentidmap.get('${component.id}').setcx0(this.value)`);
    let labelcx0 = document.createElement('label');
    labelcx0.innerText = 'Nx0';

    let inputcin = document.createElement('input');
    inputcin.id = component.id+'cin';
    inputcin.type = 'Number';
    inputcin.classList.add('numberinput');
    inputcin.classList.add('cx0input');
    inputcin.value = component.getcin();
    inputcin.setAttribute('oninput', `componentidmap.get('${component.id}').setcin(this.value)`);
    let labelcin = document.createElement('label');
    labelcin.innerText = 'C in';

    let trash = document.createElement('button');
    trash.classList.add('button')
    trash.classList.add('trash')
    trash.setAttribute('onclick', `deletecomponent('${component.id}')`);
    trash.innerHTML = `
    <svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
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
    innerdiv.appendChild(labelcin);
    labelcin.appendChild(inputcin);
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
    addplotRKF45(newcomponent);
    console.log(`created new component ${newcomponent.componentName}`);
    componentdiv(newcomponent);
    let math = document.createElement('p');
    math.id = 'math_' + newcomponent.id
    mathstr = `\\frac{dN_{${componentname}}}{dt}=r_{${componentname.substr(0,4).toLowerCase()}}V + F_{${componentname.substr(0,4).toLowerCase()}\\,in} - F_{${componentname.substr(0,4).toLowerCase()}\\,uit}`;
    math.innerText = mathstr
    mathbox = document.querySelector('#math');
    mathbox.appendChild(math);
    katex.render(mathstr, math);
    
    addseriesuplot(newcomponent,cplot)
    return newcomponent

}

let tf = 10
let interval = [0,tf];

function settf(value) {
    let newtf = Number(value);
    tf = newtf;
    interval = [0,tf];
    board.setBoundingBox([-1*(tf/20), 11, tf + 1, -0.5])
    board.update();
}
let steps = 100;

function addplotRK4(component) {
    //rk45
    let j = component.componentlocation;
    
    

    let resultdynode = dynodeRK4(componentArray, interval, steps);
    let plt = board.create('curve', [resultdynode.time, resultdynode.results[j + 1]], { strokeColor: component.color, strokeWidth: 2, name: component.componentName});
    plt.updateDataArray = function() {
        let j = component.componentlocation;
        let data
        if (calctracker === 0) {
        currentresult = dynodeRK4(componentArray, interval, steps);
        }
        data = currentresult;
        calctracker++;
        if (calctracker === componentArray.length) {
            calctracker = 0;
            let flowdata = calcflow(data)
            vplot.setData([data.time,data.results[0], flowdata.vindata, flowdata.voutdata])
            let concentrationdata = calcconcentration(data)
            //seriesarr(componentArray, cplot)
            cplot.setData(concentrationdata)
        }
        this.dataX = data.time;
        this.dataY = data.results[j + 1];
    }
    plotmap.set(component, plt);

}

function calcconcentration(data) {
    let arr1 = data.results[0]
    let concentration = [];
    concentration.push(data.time)
    for (let i = 1; i <data.results.length; i++){
        concentration.push(data.results[i].map((e,index) => e / arr1[index]))

    }

    return concentration
}

function calcflow(data) {
    let time = data.time
    let vol = data.results[0]

    let vindata = []
    let voutdata = []

    for(let i =0; i < time.length; i++) {
        vindata.push(reactor.fvin(time[i],vol[i]))
        voutdata.push(reactor.fvout(time[i], vol[i]))
    }

    return {
        vindata,
        voutdata
    }
}

function addseriesuplot(component, plot) {
    let series = {
        label: null,
        stroke: null
    }
    let sidx = component.componentlocation + 1;
    series.label = component.componentName;
    series.stroke = component.color;
    plot.addSeries(series, sidx)
}

function addplotRKF45(component) {
    //rkf45
    let j = component.componentlocation;
    let tolerance = 0.02
    let newname = component.componentname + 'NEW'
    let resultdynode = dynodeRKF45(componentArray, interval, tolerance);
    let plt = board.create('curve', [resultdynode.time, resultdynode.results[j + 1]], { strokeColor: component.color, strokeWidth: 2, name: component.componentname});
    plt.updateDataArray = function() {
        let j = component.componentlocation;
        let data
        if (calctracker === 0) {
        currentresult = dynodeRKF45(componentArray, interval, tolerance);
        }
        data = currentresult;
        calctracker++;
        if (calctracker === componentArray.length) {
            calctracker = 0;
            let flowdata = calcflow(data)
            vplot.setData([data.time,data.results[0], flowdata.vindata, flowdata.voutdata])
            let concentrationdata = calcconcentration(data)
            //seriesarr(componentArray, cplot)
            cplot.setData(concentrationdata)
        }
        this.dataX = data.time;
        this.dataY = data.results[j + 1];
        

        

        
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
    arrow.innerHTML = `<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-narrow-right" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round" style="
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
    <svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
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

function deletereaction(id, isreset=false) {
    /*side effects to be removed when the reaction is removed:
        - a function gets stored in the rx array for all the components in the reaction
        -a reaction div element is created
        - reaction is stored in reaction array
        -reaction is stored in reactionidmap (why are these not removed? //todo)

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
    if (reactiondiv !== null) {
    reactiondiv.innerHTML = ""
    reactiondiv.parentNode.removeChild(reactiondiv);
    }
    if (!isreset){
        board.update()
    }
    


    
}

function deletecomponent(id) {
    /* side effects 
    reactions : delete using the ids stored in rxreactionids
    componentArray: verwijder en update de locaties voor de andere componenten
    verwijder uit de componentIDmap 
    Verwijder glider van board
    verwijder plot van board
    verwijder plot uit plotmap
    verwijder vergelijking uit math
    verwijder series uit uplot

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
     
    cplot.delSeries(location + 1)
    board.removeObject(component.Nx0);
    let plot = plotmap.get(component)
    plotmap.delete(component)
    board.removeObject(plot);
    board.unsuspendUpdate();

    

    let div = document.getElementById(id);
    div.parentNode.removeChild(div);

    document.getElementById('math_' + id).remove();
}

function testupdate() {
    board.update();
}

function resetboard(){
    reactionidmap.forEach(e => {
        let id = e.id;
        deletereaction(id, true)
    });
    reactor.initialvolume = 1;
    document.getElementById('initialvolume').value = 1;
    reactor.vin = 0;
    updatejcfvin("0", true, reactor.voljcvarstr)
    document.getElementById('vin').value = 0;
    reactor.vout = 0;
    updatejcfvout("0", true, reactor.voljcvarstr)
    document.getElementById('vout').value = 0;
    board.update();
    alert("Error\n Page was reset");
}

function changesolver(solver) {
    board.suspendUpdate();
    for(let i = 0; i < componentArray.length;i++) {
        let oldplot = plotmap.get(componentArray[i]);
        board.removeObject(oldplot.id);
        plotmap.delete(componentArray[i]);
        switch (solver) {
            case 'rkf45' :
                addplotRKF45(componentArray[i]);
                break;
            
            case 'rk4' :
                addplotRK4(componentArray[i]);
                break;
            
            default:
                addplotRK4(componentArray[i])
                break;
        }
    }
    board.unsuspendUpdate();
    board.update();
}