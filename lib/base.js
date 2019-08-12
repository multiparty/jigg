/*
 *  Setup Connections
 */
var role = 'whoever';
join(role);
hear('whoami').then((msg) => role = msg);
hear('go').then(main);

/*
 *  2PC code here
 */
function main() {
  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    let g = 1;

    var labels = shuffle([[0,0], [0,1], [1,0], [1,1]]);
    let W0G = labels[0];
    let W1G = labels[1];
    let W0E = labels[2];
    let W1E = labels[3];
    var gate = [null, null, null, null];
    gate[0] = encrypt(keyderive(W0G, W0E), 0);
    gate[1] = encrypt(keyderive(W0G, W1E), 0);
    gate[2] = encrypt(keyderive(W1G, W0E), 0);
    gate[3] = encrypt(keyderive(W1G, W1E), 1);
    gate = shuffle(gate);

    give('gate', JSON.stringify(gate));
    give('WgG', g ? W1G : W0G);

    obliviousT(W0E, W1E);//.then(console.log.bind(null, 'WeE'));
    console.log('W0G', W0G);
    console.log('W1G', W1G);
    console.log('W0E', W0E);
    console.log('W1E', W1E);
  }

  if (role === 'evaluator') {
    let e = 1;

    get('gate').then(console.log.bind(null, 'garbled gate'));
    get('WgG').then(console.log.bind(null, 'WgG'));

    obliviousT(e).then(console.log.bind(null, 'WeE'));
  }
}












;
