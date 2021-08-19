const board = JXG.JSXGraph.initBoard('jxgbox', {
    boundingbox: [-0.5, 11, 11, -0.5],
    axis: true
  });
  

var componentArray = [];
var reactionArray = [];
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

var Reactor = {
    
}

function getcx(Component) {
    return Component.cx
};

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



var X = new Component("X", 10,'#54b3d5');
componentArray.push(X);
var Y = new Component("Y",5,'#54b3d5');
componentArray.push(Y);


var Z = new Component("Z",8, '#54b3d5');
componentArray.push(Z);
const XY = new Reaction([X, Z,Y],[-1,-1,2], 0.1); //X + Z -> Y
const YX = new Reaction([X,Y],[1,-1],0.05); //Y -> X

const test1 = Y.rx[0]()
const boundfuny = Y.rx[0].bind(XY);
const resy = boundfuny();
if (test1 !== resy) {
    console.log("function for reaction rate is not bound correct")
}

let A = new Component("A", 10, '#82E0AA')
componentArray.push(A)
let B = new Component("B", 10, '#82E0AA')
componentArray.push(B)
let C = new Component("C", 10, '#82E0AA')
componentArray.push(C)

let ABC = new Reaction([A,B,C],[-1,-2,2],0.1)

componentArray.forEach(element => {
    console.log(element.componentName);
  });

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

let resultdynode = dynode(componentArray)
let plots = []
for (let j=0; j < componentArray.length; j++) {
    let plt = board.create('curve', [resultdynode.time, resultdynode.results[j]], { strokeColor: componentArray[j].color, strokeWidth: 2, name: componentArray[j].componentName});
    plt.updateDataArray = function() {
        let data = dynode(componentArray);
        this.dataX = data.time;
        this.dataY = data.results[j]
    }
}
