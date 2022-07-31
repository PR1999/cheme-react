
board.suspendUpdate()
let A = createandstorecomponent("A", 10,'#1abc9c');
let B = createandstorecomponent("B",8,'#2ecc71');
let C = createandstorecomponent("C",0, '#3498db');
let D = createandstorecomponent("D", 0, '#e74c3c');
let E = createandstorecomponent("E", 0, '#e67e22');
const R1 = createreaction([A, B,C,D],[-1,-1,1,1], 0.1); //A + B > C+ D
const R2 = createreaction([D,B,E],[-1,-1,2],0.05); //D +B >E
let R3 = createreaction([E,C,A],[-1,-1,2],0.1); 

board.unsuspendUpdate();
