// First create the board and arrays to store the reactions and components in
const board = JXG.JSXGraph.initBoard('jxgbox', {
    boundingbox: [-0.5, 11, 11, -0.5],
    axis: true
  });
  
var componentArray = [];
var reactionArray = [];

// Component class is used to create components that can be used to set up reactions give it a name like 'A', a cx0 for where you want the point to start on the Y axis, and a color :)
class Component {
  constructor(componentName, initialcx0, color) {
    this.componentlocation = componentArray.length + 1;
    this.componentName = componentName;
    this.color = color
    this.cx0 = board.create('glider', [0,initialcx0,board.defaultAxes.y], {name:componentName, color:this.color});
    this.rx = [];
    
    this.cx = this.cx0.Y();
  }

  rxsum() {
      let sumrx = 0;
      let dimension = this.rx.length
      for(let i=0;i <dimension; i++ ) {
          sumrx = this.rx[i]() + sumrx
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
        this.reactionmap = new Map();
        this.reactants = [];

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

        for (var i = 0; i < reactioncomponents.length;i++) {
            this.reactionmap.set(reactioncomponents[i],coeffiencts[i])
            if (coeffiencts[i] < 0) {
                this.reactants.push(reactioncomponents[i]);
            }
            var rxfunc = createRxFunction(reactioncomponents[i]).bind(this);
            reactioncomponents[i].rx.push(rxfunc);
            
        };
        
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

function dynode(components) {
    let tf = 10
    let interval = [0,tf];
    let steps = 100;
    let stepsize = (interval[1]-interval[0]) / steps;
    let cx0 = []
    const dimension = components.length;
    let cx = [];

    for(let i = 0; i < dimension; i++) {
        cx0.push(components[i].cx0.Y())
    }

    let data = JXG.Math.Numerics.rungeKutta('rk4', cx0, interval, steps, righthandside);
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

let X = new Component("X", 10,'#1abc9c');
componentArray.push(X);
let Y = new Component("Y",0,'#2ecc71');
componentArray.push(Y);
let Z = new Component("Z",8, '#3498db');
componentArray.push(Z);
let A = new Component("A", 10, '#e74c3c')
componentArray.push(A)
let B = new Component("B", 10, '#e67e22')
componentArray.push(B)
let C = new Component("C", 0, '#f1c40f')
componentArray.push(C)

const XY = new Reaction([X, Z,Y],[-1,-1,2], 0.1); //X + Z -> Y
const YX = new Reaction([X,Y],[1,-1],0.05); //Y -> X
let ABC = new Reaction([A,B,C],[-1,-2,2],0.1) //A + 2B -> 2C

const test1 = Y.rx[0]()
const boundfuny = Y.rx[0].bind(XY);
const resy = boundfuny();
if (test1 !== resy) {
    console.log("function for reaction rate is not bound correct")
}

let resultdynode = dynode(componentArray)
let plots = []
for (let j=0; j < componentArray.length; j++) {
    let plt = board.create('curve', [resultdynode.time, resultdynode.results[j]], { strokeColor: componentArray[j].color, strokeWidth: 2, name: componentArray[j].componentName});
    plt.updateDataArray = function() {
        let data = dynode(componentArray);
        this.dataX = data.time;
        this.dataY = data.results[j]
    }
    plots.push(plt);
}
