
let A = createandstorecomponent("A", 10,'#1abc9c');
let B = createandstorecomponent("B",8,'#2ecc71');
let C = createandstorecomponent("C",0, '#3498db');
let D = createandstorecomponent("D", 0, '#e74c3c');
let E = createandstorecomponent("E", 0, '#e67e22');
const R1 = createreaction([A, B,C,D],[-1,-1,1,1], 0.1); //A + B > C+ D
const R2 = createreaction([D,B,E],[-1,-1,2],0.05); //D +B >E
let R3 = createreaction([E,C,A],[-1,-1,2],0.1); 

let tf = 10
let interval = [0,tf];
let steps = 100;
let stepsize = (interval[1]-interval[0]) / steps;

let resultdynode = dynode(componentArray, interval, steps);
let plots = [];
var calctracker = 0;
let currentresult
for (let j=0; j < componentArray.length; j++) {
    let plt = board.create('curve', [resultdynode.time, resultdynode.results[j]], { strokeColor: componentArray[j].color, strokeWidth: 2, name: componentArray[j].componentName});
    plt.updateDataArray = function() {
        
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
    plots.push(plt);
}

