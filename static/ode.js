
/*
var A = 1;
var B = 2;
var C = 1;
var timefinal = 10;
var sliderk = board.create('slider', [[1, 8], [8, 8], [0, 0.1, 1]], { name: 'k' })
var ca0 = board.create('glider', [0,10,board.defaultAxes.y], {name:"Ca"})
var cb0 = board.create('glider', [0,9,board.defaultAxes.y], {name : 'Cb', fillColor:'blue', strokeColor:'blue'})
var cc0 = board.create('glider', [0,0,board.defaultAxes.y], {name : 'Cc', fillColor:'green', strokeColor:'green'})

var inputfunc1 = document.getElementById("func1").value;

var fk1 = board.jc.snippet(inputfunc1,true,'ra, ca, cb, cc');
*/



function ode(){
  var tf = document.getElementById('tf').value;
  var inputfunc1 = document.getElementById("func1").value;
  var fk1 = board.jc.snippet(inputfunc1,true,'ra, ca, cb, cc');
  var interval = [0,tf];
  var steps = 100;
  var stepsize = (interval[1]-interval[0]) / steps;
  
  var cx0 = [ca0.Y(), cb0.Y(), cc0.Y()];
  
  var b = B/A;
  var c = C/A;
  
  function right(t, cx) {
    var k1 = -1 * sliderk.Value();
    var ca = cx[0];
    var cb = cx[1];
    var cc = cx[2];
  
    var ra = fk1(1,ca,cb,cc); //moet dit A * FK1 zijn? of /A .. 
    var rb = b * ra;
    var rc = -c * ra;
  
    var rx = [ra, rb, rc];
    return rx
  
  }
  
  var data = JXG.Math.Numerics.rungeKutta('rk4', cx0, interval, steps, right);

  var time = [];
  var datca = [];
  var datcb = [];
  var datcc = [];


for (var i = 0; i < data.length; i++) {
  time[i] = i * stepsize;
  datca[i] = data[i][0];
  datcb[i] = data[i][1];
  datcc[i] = data[i][2];
}

let a = [datca,datcb,datcc]

return {
  time,
  a
};

}
/*
var result = ode();
var time = result.time;
//var datca = result.datca;
//var datcb = result.datcb;
//var datcc = result.datcc;
//
let names = ['ca','cb','cc']
for (let j=0; j < 3; j++) {
  let plt = board.create('curve', [result.time, result.a[j]], { strokeColor: 'green', strokeWidth: 2, name: names[j]});
  plt.updateDataArray = function() {
      let data = ode(componentArray);
      let result = data.a
      this.dataX = data.time;
      this.dataY = result[j]
  }
}


//var pltca = board.create('curve', [time, datca], { strokeColor: 'red', strokeWidth: 2, name: 'Ca' });
//var pltcb = board.create('curve', [time, datcb], { strokeColor: 'blue', strokeWidth: 2, name: 'Cb'});
//var pltcc = board.create('curve', [time, datcc], { strokeColor: 'green', strokeWidth: 2, name: 'Cc'});

//pltca.updateDataArray = function() {
//  var result = ode();
//  var time = result.time;
//  var datca = result.datca;
//  this.dataX = time;
//  this.dataY = datca;
////}
//
////pltcb.updateDataArray = function() {
//  var result = ode();
//  var time = result.time;
//  var datcb = result.datcb;
//  this.dataX = time;
//  this.dataY = datcb;
//}
//
//pltcc.updateDataArray = function() {
//  var result = ode();
//  var time = result.time;
//  var datcc = result.datcc;
//  this.dataX = time;
//  this.dataY = datcc;
//}*/