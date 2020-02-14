const { spawn } = require('child_process');

function MyChildProcess(command, args, callback, done) {
  const self = this;
  if (callback == null) {
    callback = function (data) {};
  }

  this.data = [];
  this._promise = new Promise(function (resolve) {
    self._resolve = resolve;
  });

  this.process = spawn(command, args);
  this.process.stdout.on('data', function (data) {
    self.data.push(data.toString());
    callback(data.toString());
  });

  this.process.stderr.on('data', function (data) {
    self.data.push(data.toString());
    console.log('stderr in', command, args);
    console.log(data.toString());
  });

  this.process.on('error', function (error) {
    console.log('ERROR in', command, args);
    console.log(error);
    if (done == null) {
      process.exit(1);
    } else {
      done(error);
    }
  });

  this.process.on('close', function () {
    self._resolve(self.data);
  });
}

MyChildProcess.prototype.kill = function () {
  this.process.kill();
};

MyChildProcess.prototype.promise = function () {
  return this._promise;
};

module.exports = MyChildProcess;