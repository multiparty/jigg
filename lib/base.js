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
    let secret = 1;

    give('num', '3');
  }

  if (role === 'evaluator') {
    let secret = 1;

    get('num').then(console.log.bind(null, 'number'));
  }
}
