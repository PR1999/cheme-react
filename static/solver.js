function rkf45(f, t, y, h) {
    dimension = y.length
    const A = [0, 1.0 / 4.0, 3.0 / 8.0, 12.0 / 13.0, 1.0, 0.5];
    const B1 = [1.0/ 4.0, 3.0 / 32.0, 1932.0 / 2197.0, 439.0 / 216.0, -8.0/27.0 ];
    const B2 = [9.0 /32.0, -7200.0 / 2197.0, -8.0, 2.0];
    const B3 = [7296.0/2197.0, 3680.0 / 513.0, -3544.0/2565.0];
    const B4 = [-845.0/4104.0, 1859.0 / 4104.0];
    const B5 = [-11.0 / 40.0];
    const CH = [47.0/450.0, 0.0, 12.0/25.0, 32.0/225.0, 1.0 / 30.0, 6.0/25.0];
    const C = [25.0/216.0, 0, 1408.0/2565.0, 2197.0/4104.0, -1.0/5.0];
    let tnew = A.map(a => t + h*a); //t+A(s)*h

    
    //compute step 1
    let k1 = f(tnew[0],y);
    k1 = k1.map(k => k*h);
    
    //step 2
    let b1k1 = B1.map(b => k1.map(k => k*b));
    let k2 = f(tnew[1], y.map((y,i) => y + b1k1[0][i])); 
	k2 = k2.map(k => k*h);
    
    //step 3
    let b2k2 = B2.map(b => k2.map(k => k*b));
    let k3 = f(tnew[2], y.map((y,i) => y + b1k1[1][i] + b2k2[0][i])); 
	k3 = k3.map(k => k*h);
    
    //step 4
    let b3k3 = B3.map(b => k3.map(k => k*b));
    let k4 = f(tnew[3], y.map((y,i) => y + b1k1[2][i] + b2k2[1][i] + b3k3[0][i])); 
	k4 = k4.map(k => k*h);

    //step 6
    let b4k4 = B4.map(b => k4.map(k => k*b));
    let k5 = f(tnew[4], y.map((y,i) => y + b1k1[3][i] + b2k2[2][i] + b3k3[1][i] + b4k4[0][i])); 
	k5 = k5.map(k => k*h);

    //step 6
    let b5k5 = B5.map(b => k5.map(k => k*b));
    let k6 = f(tnew[5], y.map((y,i) => y + b1k1[4][i] + b2k2[3][i] + b3k3[2][i] + b4k4[1][i] + b5k5[0][i])); 
	k6 = k6.map(k => k*h);

    //calculate new y at t + h
    y5 = y.map((y, i) => y + k1[i]*CH[0] + k2[i]*CH[1] + k3[i]*CH[2] + k4[i]*CH[3] + k5[i]*CH[4] + k6[i]*CH[5]);
    y4 = y.map((y, i) => y + k1[i]*C[0] + k2[i]*C[1] + k3[i]*C[2] + k4[i]*C[3] + k5[i]*C[4]);

    return {
        y4,
        y5 };
}


function runrkf45(f, interval, y_init, h_init = 0.1, tol = 0.015) {
    let t = interval[0];
    const tf = interval[1];
    let h = h_init;
    let y = y_init;
    let hmin = 0.0001
    let hmax = 0.5
    let c = 0;

    t_res = [t];
    y_res = [y];

    while (t < tf) {
        c++
        if (!(c % 100000)) {
            console.log(c);
            alert('calculation took to long')
            break;
            
        }
        let {y4, y5} = rkf45(f, t, y, h )
        //local error estimate
        let e = y5.map((y5,i) => Math.abs(y5- y4[i]));

        //working based on the largest error would be best i think
        let maxe = Math.max.apply(null, e);
        //reference error
        let R = maxe/h
        
        if (R < tol) {
            t = t + h
            t_res.push(t)
            y = y4
            y_res.push(y)
        }
        //new step size
        delta = 0.9 * (tol/R)**(1.0/5.0);
        h = h*delta
        if(h > hmax) {h = hmax;}
        else if (h < hmin) {h = hmin;}
    }

    return {
        t_res, y_res
    };



}

function test(t,y) {
    let ynew = y.map(yi => 0.95 * yi);
    return ynew
}




/* K	A(K)	B(K,L)	C(K)	CH(K)	CT(K)
L=1	L=2	L=3	L=4	L=5
1	0						25/216	16/135	1/360
2	1/4	1/4	0	0	0
3	3/8	3/32	9/32	1408/2565	6656/12825	-128/4275
4	12/13	1932/2197	-7200/2197	7296/2197	2197/4104	28561/56430	-2197/75240
5	1	439/216	-8	3680/513	-845/4104	-1/5	-9/50	1/50
6	1/2	-8/27	2	-3544/2565	1859/4104	-11/40		2/55	2/55 */
