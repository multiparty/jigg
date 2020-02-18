# Intro to Garbled Circuits with JIGG

This tutorial includes a brief introduction to Yao's garbled circuits for two parties and how to carry out a computation using JIGG.

# What are garbled circuits? and Why use them?
Garbled circuits are a specific construction of private function evaluation for boolean circuits.  A great introduction to the more in-depth math surrounding garbled circuits can be found at [here](http://web.mit.edu/sonka89/www/papers/2017ygc.pdf), however the absolute basics are as follows.

JIGG focuses on the two-party case.  Each computation involves a _garbler_, and an _evaluator_.  These two parties communicate through the help of a communications server.  This server does not contribute data nor computational power to the computation, but exists for the sole purpose of passing messages between the two participating parties.

The garbler and evaluator each know their own private inputs, as well as a public function (represented as a boolean circuit) that they both want to run on their private inputs and return a public output.  In JIGG, this boolean circuit is stored in a text file as a list of boolean logic gates.

The circuit for a 4-input bit NAND circuit looks like the following:
```ada
4 8            # 4 gates, 8 wires
2 2 2          # 2 parties, 2-bit inputs for both
1 1            # 1 output, 1 bit long
2 1 0 1 4 AND  # 2 in, 1 out, W4 := W0 && W1
2 1 2 3 5 AND  # 2 in, 1 out, W5 := W2 && W3
2 1 4 5 6 AND  # 2 in, 1 out, W6 := W4 && W5
1 1 6 7 INV    # 1 in, 1 out, W7 := ~W6
```
<!-- ![](/src/nand4.png | width=500) -->
<img src="/src/nand4.svg" width="300" />

**Note:**
If description seems too low-level, you may also write circuits on a macro level if preferred and compile down using [CASM](https://github.com/wyatt-howe/macro-circuit-assembler#readme).  Even ASCI C compilers exist that assemble JIGG compatible circuits, but we make no special note due to their generally lesser utility performance-wise.

<!-- ## Advantages over Arithmetic Circuits -->
All of the widely accepted solutions for secure function evaluation use either boolean circuits (and operate through garbled gates) or arithmetic circuits (and operate over secret shares).  One well-designed framework taking the arithmetic approach is [JIFF](https://github.com/MPC-SoK/frameworks/wiki/JIFF), however this section highlights the garbled variant.

__Advantages over Arithmetic Circuits__:
1. Latency: while protocols based upon secret sharing require a number of back-and-forth messages proportional to the size of their arithmetic circuit, the boolean circuit in JIGG only has to be sent once (after the garbling step done locally) and communication of initial inputs and the final outputs remain constant<!-- in time to the size of their circuits. -->—this means computation speed is more determined by the participating parties themselves, rather than slow networking.

2. Linearity: circuits don't have to be a composition of arithmetic operators only—anything programmable with boolean logic is computable.<!-- Mention C-to-boolean circuit compilers? -->

# A Simple Computation: 64-bit Equal-to-Zero
This circuit is as simple as it sounds.  Our two parties provide a total of 64 bits, and if they're all equal to zero we announce this is true, else, false.  In boolean logic for JIGG, 1 is synonymous with true and 0 is clearly then false.

The circuit itself is structured similar to one giant 64-bit NAND gate, similar to the one we looked at above.  It is a binary tree of 63 AND gates joining 64 negated 1-bit inputs into one final output bit.






<!-- **Note:** Sometimes the final result can itself reveal information about the inputs even if MPC is used. For example, if two parties jointly compute the sum of their inputs securely, each of them can learn the input
of the other, by simply subtracting their input out of the final output. In such case, it is recommended that output privacy mechanisms (such as [differential privacy](https://privacytools.seas.harvard.edu/differential-privacy)) are used in conjunction with MPC.

Common underlying assumptions can be split into two main categories:
1. Behavior: MPC protocols frequently make assumptions about what participating parties will and will not do. Parties that do not abide by these restrictions can cause the protocol to lose Confidentiality, Integrity, or both. Two common behavior models are:
     - **semi-honest security** where parties abide by the protocol but may try to learn private information by analyzing their messages or colluding with other parties.
     - **malicious security** where parties may deviate arbitrarily from the protocols.

   Choosing the appropriate security model for an application depends on the incentives between the participating parties and can involve performance tradeoffs.

2. Coalitions: MPC protocols may make assumptions about how many parties in the computation are **honest** (e.g. abide by the protocol or do not collude with others) or the size of the largest coalitions of parties. Two common assumptions are:
    - **honest majority**: the largest coalitions must be less than half of the parties
    - **dishonest majority**: coalitions may include all parties except one.

There are a variety of interesting theoretical results in the literature about what can be and cannot be done in any of these settings.

We focus on **semi-honest security** in these tutorials, since JIFF operates in the **semi-honest security** model.

## When should MPC be used?
MPC allows computation of functions over sensitive data. MPC is particularly useful in the following scenarios:

1. Sensitive Inputs: input parties are hesitant to provide their sensitive data to any single party.

2. Avoiding Liability: parties may be wiling to provide their data, but the compute party is unwiling to hold that data for liability reasons (e.g. in case the compute party was hacked).

3. Compliance: certain types of data may be subject to strict rules governing data sharing and privacy (e.g. HIPAA). MPC can perform interesting computation on several such data sets without
   having to move or share the data.

# How does it work?
Secret sharing is the backbone of MPC. A secret sharing scheme consists of two functions: a **share** function that creates seemingly-random shares from an input and a reconstruct or **open**
function that reconstructs the input from the shares.

There are a variety of secret sharing schemes, we will start with the simplest.

## Additive secret sharing

Given an input x, choose n random values x<sub>1</sub>, ..., x<sub>n</sub> such that their sum is equal to x.

```neptune[frame=1,title=Insecure&nbsp;Scheme]
function share(x, n) {
  var shares = [];
  var sum = 0;
  for (var i = 0; i < n-1; i++) {
    var sign = Math.random() < 0.5 ? 1 : -1;
    var r = sign * Math.floor(Math.random() * 100);
    sum += r;
    shares.push(r);
  }

  shares.push(x - sum);
  return shares;
}

function open(shares) {
  return shares.reduce(function (sum, share) { return sum + share }, 0);
}

var shares = share(5, 3);
Console.log(shares, open(shares));
shares = share(5, 2);
Console.log(shares, open(shares));
shares = share(10, 5);
Console.log(shares, open(shares));
```

```neptune[frame=1,title=Additive&nbsp;Secret&nbsp;Sharing&nbsp;mod&nbsp;Prime]
var prime = 127;

function mod(v) {
  return (v < 0 ? v + prime : v) % prime;
}

function share(x, n) {
  var shares = [];
  var sum = 0;
  for (var i = 0; i < n-1; i++) {
    var r = Math.floor(Math.random() * prime);
    sum = mod(sum + r);
    shares.push(r);
  }

  shares.push(mod(x - sum));
  return shares;
}

function open(shares, prime) {
  return shares.reduce(function (sum, share) { return mod(sum + share) }, 0);
}

var shares = share(5, 3);
Console.log(shares, open(shares));
shares = share(5, 2);
Console.log(shares, open(shares));
shares = share(10, 5);
Console.log(shares, open(shares));
```

```neptune[frame=1,title=Addition&nbsp;under&nbsp;MPC]
// A simple demo of addition under MPC using additive secret sharing!

// Each party's inputs
var input_party_0 = 10;
var input_party_1 = 13;
var input_party_2 = 22;

// Each party creates Secret Shares of their inputs
var shares_party_0 = share(input_party_0, 3);
var shares_party_1 = share(input_party_1, 3);
var shares_party_2 = share(input_party_2, 3);
Console.log(shares_party_0, shares_party_1, shares_party_2);

// Each party sends their ith share to the ith party
var received_shares_party_0 = [shares_party_0[0], shares_party_1[0], shares_party_2[0]]
var received_shares_party_1 = [shares_party_0[1], shares_party_1[1], shares_party_2[1]]
var received_shares_party_2 = [shares_party_0[2], shares_party_1[2], shares_party_2[2]]

// Each party computes the sum of their received shares and broadcasts this value to the other parties.
// These sums of received shares, neither individually nor in pairs, reveal nothing about any party's inputs.
var sum_received_shares_party_0 = received_shares_party_0.reduce((sum, share) => mod(sum + share), 0);
var sum_received_shares_party_1 = received_shares_party_1.reduce((sum, share) => mod(sum + share), 0);
var sum_received_shares_party_2 = received_shares_party_2.reduce((sum, share) => mod(sum + share), 0);

// When each party adds these sums with each other, they get the sum over all their original inputs!
Console.log(mod(sum_received_shares_party_0+sum_received_shares_party_1+sum_received_shares_party_2));

```

It is important that the domain of the shares exihibt some sort of _cyclicity_, so that knowing a single share cannot be used to determine some bound on the input, and that given a
set of shares, it is equally likely (with respect to the coins of the share function) that the original input is any value in the domain.

We achieve this cyclicity in the first scheme above by allowing shares to be either positive or negative. However, this causes another issue. The last share may fall
outside the domain. We fix these issues by setting our domain to be a field, as is shown in the second scheme above.

Additive secret sharing is interesting because it allows us to efficiently compute at least one function over shares, namely addition! Given two secret shared inputs between n parties,
with each party possessing a share of each inputs. When every party adds its two shares together (mod prime), this results in a new sharing of the sum of original inputs.

## Shamir secret sharing

[Shamir secret sharing](https://dl.acm.org/citation.cfm?id=359176) operates over polynomials in a field (mod prime). A random polynomial of desired degree is selected during sharing, such that the value of the polynomial at x=0 is equal to the input.
Each share is a unique point along the polynomial. Traditionally, the share of party i is set to be the value of the polynomial at x=i. This convention allows shares to be a single number instead of a pair,
as the x coordinate of every share is fixed.

Note that to reconstruct the value, the number of shares (i.e. points) that are known must be greater than the degree of the polynomial. Otherwise, we do not have enough points to interpolate the polynomial,
as the resulting system of linear equations has additional degrees of freedom, making every solution equally likely. This is the intuition behind the main security guarantee of Shamir secret sharing.

```neptune[inject=true]
var prime = 11;

function mod(x) {
  return x;
}

function polynomialPrint(polynomial) {
  var str = '';
  for (var i = 0; i < polynomial.length; i++) {
    str += polynomial[i];
    if (i > 0) {
      str += ' x^' + i;
    }
    if (i < polynomial.length - 1) {
      str += ' + ';
    }
  }
  return str;
}

function polynomialEval(x, coefficients) {
  var pow = 1;
  var y = 0;
  for (var p = 0; p < coefficients.length; p++) {
    y += coefficients[p] * pow;
    pow *= x;
  }
  return y;
}

function polynomialMult(polynomial1, polynomial2) {
  var polynomial = [];
  for (var l = 0; l < polynomial1.length + polynomial2.length - 1; l ++) {
    polynomial.push(0);
  }

  for (var i = 0; i < polynomial1.length; i++) {
    for (var j = 0; j < polynomial2.length; j++) {
      var v = polynomial1[i] * polynomial2[j];
      var pow = i+j;
      polynomial[pow] += v;
    }
  }

  return polynomial;
}

function __plot(points, coefficients, index) {
  var pointsTrace = {
    x: [0],
    y: [coefficients[0]],
    mode: 'markers',
    type: 'scatter',
    name: 'Shares ' + (index+1),
    text: ['Value']
  }

  var polyTrace = {
    x: [],
    y: [],
    mode: 'lines',
    type: 'scatter',
    name: 'Polynomial ' + (index+1)
  }

  for (var i = 0; i < points.length; i++) {
    pointsTrace.x.push(i+1);
    pointsTrace.y.push(points[i]);
    pointsTrace.text.push('Share ' + (i + 1));
  }

  for (var i = -6; i < 6; i += 0.1) {
    polyTrace.x.push(i);
    polyTrace.y.push(mod(polynomialEval(i, coefficients)));
  }
  return [polyTrace, pointsTrace];
}

function plot(pointsArr, coefficientsArr, id) {
  var traces = pointsArr.map(function (_, i) { return __plot(pointsArr[i], coefficientsArr[i], i) });
  traces = traces.reduce(function (arr, tra) { return arr.concat(tra) }, []);
  document.getElementById(id).innerHTML = '';
  document.getElementById(id).style.height = '500px';
  Plotly.newPlot(id, traces);
}
```

```neptune[frame=2,title=Shamir&nbsp;secret&nbsp;share,outputID=plot1,scope=2]
mod = function (x) { return x; }

function share(x, n) {
  var polynomial = [ x ]; // polynomial coefficients
  for (var i = 0; i < n-1; i++) {
    var r = Math.floor(Math.random() * prime);
    polynomial.push(r);
  }

  var shares = [];
  for (var k = 1; k <= n; k++) {
    shares.push(mod(polynomialEval(k, polynomial)));
  }

  return { shares: shares, polynomial: polynomial };
}

var result = share(5, 3);

Console.log(polynomialPrint(result.polynomial));
plot([result.shares], [result.polynomial], 'plot1');
```

```neptune[frame=2,title=Shamir&nbsp;secret&nbsp;share&nbsp;mod&nbsp;prime,outputID=plot2,scope=2]
mod = function (x) {
  while (x < 0) x += prime;
  return x % prime;
}

var result = share(5, 3);

Console.log(polynomialPrint(result.polynomial));
plot([result.shares], [result.polynomial], 'plot2');
```

## Operations on Shamir secret sharing

Shamir secret sharing directly supports both addition and multiplication and allows the number of required shares to reconstruct the value to be configurable.

Addition is direct, due to properties of polynomials. Adding two polynomials point-wise gives a new set of points that define a polynomial of the same degree
that is equivalent to the sum of the original polynomials.

```neptune[frame=3,title=Addition,outputID=plot3,scope=2]
mod = function (x) { return x; }

var shares1 = share(5, 3);
var shares2 = share(2, 3);

var result = {
  shares: shares1.shares.map(function (_, i) { return mod(shares1.shares[i] + shares2.shares[i]) }),
  polynomial: shares1.polynomial.map(function (_, i) { return mod(shares1.polynomial[i] + shares2.polynomial[i]) })
};

Console.log(polynomialPrint(shares1.polynomial));
Console.log(polynomialPrint(shares2.polynomial));
Console.log(polynomialPrint(result.polynomial));
plot([shares1.shares, shares2.shares, result.shares], [shares1.polynomial, shares2.polynomial, result.polynomial], 'plot3');
```

```neptune[frame=3,title=Addition&nbsp;mod&nbsp;prime,outputID=plot4,scope=2]
mod = function (x) {
  while (x < 0) x += prime;
  return x % prime;
}

var shares1 = share(5, 3);
var shares2 = share(2, 3);

var result = {
  shares: shares1.shares.map(function (_, i) { return mod(shares1.shares[i] + shares2.shares[i]) }),
  polynomial: shares1.polynomial.map(function (_, i) { return mod(shares1.polynomial[i] + shares2.polynomial[i]) })
};

Console.log(polynomialPrint(shares1.polynomial));
Console.log(polynomialPrint(shares2.polynomial));
Console.log(polynomialPrint(result.polynomial));
plot([shares1.shares, shares2.shares, result.shares], [shares1.polynomial, shares2.polynomial, result.polynomial], 'plot4');
```

Multiplication is trickier: multiplying two polynomials point wise does yield a polynomial with the correct values, however, the resulting
polynomial is of a higher degree. This means that we need more shares to reconstruct that value than we original possessed.

One way to avoid this problem is to secret share the original inputs using a polynomial of lower degree, so that the after multiplication, the
degree remains smaller than the number of parties, and thus less than the number of availabe shares. The BGW protocol provides a way to then
reduce the degree of a polynomial represented by secret shares under MPC, at the cost of a single round of communication, so that an unlimited number of multiplications can be performed consecutively.

The BGW protocol is an example of an **honest-majority** scheme, as all secrets can be reconstructed
by a majority coalition due to the low degree of the underlying polynomials. JIFF uses BGW protocol for certain
pre-processing tasks by default, making the preprocessing phase of JIFF secure only against honest-majority. This behavior
can be customized. More on this later.

```neptune[frame=4,title=Multiplication,outputID=plot5,scope=2]
mod = function (x) { return x; }

var shares1 = share(5, 2);
var shares2 = share(2, 2);

var result = {
  shares: shares1.shares.map(function (_, i) { return mod(shares1.shares[i] * shares2.shares[i]) }),
  polynomial: polynomialMult(shares1.polynomial, shares2.polynomial)
};

Console.log(polynomialPrint(shares1.polynomial));
Console.log(polynomialPrint(shares2.polynomial));
Console.log(polynomialPrint(result.polynomial));

plot([shares1.shares, shares2.shares, result.shares], [shares1.polynomial, shares2.polynomial, result.polynomial], 'plot5');
```

```neptune[frame=4,title=Threshold&nbsp;sharing,outputID=plot6,scope=2]
mod = function (x) { return x; }

function share(x, n, t) {
  var polynomial = [ x ]; // polynomial coefficients
  for (var i = 0; i < t-1; i++) {
    var r = Math.floor(Math.random() * prime);
    polynomial.push(r);
  }

  var shares = [];
  for (var k = 1; k <= n; k++) {
    shares.push(mod(polynomialEval(k, polynomial)));
  }

  return { shares: shares, polynomial: polynomial };
}

var shares1 = share(5, 3, 2);
var shares2 = share(2, 3, 2);

var result = {
  shares: shares1.shares.map(function (_, i) { return mod(shares1.shares[i] * shares2.shares[i]) }),
  polynomial: polynomialMult(shares1.polynomial, shares2.polynomial)
};

Console.log(polynomialPrint(shares1.polynomial));
Console.log(polynomialPrint(shares2.polynomial));
Console.log(polynomialPrint(result.polynomial));
plot([shares1.shares, shares2.shares, result.shares], [shares1.polynomial, shares2.polynomial, result.polynomial], 'plot6');
```

# What does MPC code look like traditionally?

Traditionally, parties in MPC perform identical instructions dictated by the MPC protocol on the shares they possess. In such scenarios,
MPC is very similar to the Single Instruction Multiple Data (SIMD) paradigm from parallel programming (e.g. Message Passing Interface (MPI)).
The main difference being that the data is shared in MPC (as opposed to split), for the purpose of security (as opposed to parallelization).

Below is an example of such code written in JIFF, where three parties and a server carry out an MPC computation that computes the sum of their inputs.
The JIFF API and the role of the server in JIFF is explained in more details in later tutorials.

```neptune[frame=jiff,scope=jiff,title=Server,env=server]
var JIFFServer = require('../../../../../lib/jiff-server.js');
var jiffServer = new JIFFServer(global.server, { logs:true });
Console.log('Started jiff server on port 9111');
```

```neptune[frame=jiff,scope=jiff,title=Party&nbsp;1]
var jiff_instance = new JIFFClient('http://localhost:9111', 'first-mpc-computation', {party_count: 3, crypto_provider: true});

jiff_instance.wait_for([1, 2, 3], function () {
  var shares = jiff_instance.share(10);
  var resultShare = shares[1].sadd(shares[2]).sadd(shares[3]);

  jiff_instance.open(resultShare).then(Console.log);
});
```

```neptune[frame=jiff,scope=jiff,title=Party&nbsp;2]
var jiff_instance = new JIFFClient('http://localhost:9111', 'first-mpc-computation', {party_count: 3, crypto_provider: true});

jiff_instance.wait_for([1, 2, 3], function () {
  var shares = jiff_instance.share(30);
  var resultShare = shares[1].sadd(shares[2]).sadd(shares[3]);

  jiff_instance.open(resultShare).then(Console.log);
});
```

```neptune[frame=jiff,scope=jiff,title=Party&nbsp;3]
var jiff_instance = new JIFFClient('http://localhost:9111', 'first-mpc-computation', {party_count: 3, crypto_provider: true});

jiff_instance.wait_for([1, 2, 3], function () {
  var shares = jiff_instance.share(50);
  var resultShare = shares[1].sadd(shares[2]).sadd(shares[3]);

  jiff_instance.open(resultShare).then(Console.log);
});
```


We will see later how JIFF supports more flexible and asymmetric computations, so that different parties can perform different instructions
for purposes of performance, reliability, or security.

```neptune[inject=true,language=html]
<br><br><br><br><br><br><br><br><br><br><br>
``` -->
