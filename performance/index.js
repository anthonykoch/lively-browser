const { inspect } = require('util');

const usage = () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;

  return `${Math.round(used * 100) / 100}MB`;
};



console.log(`start - ${usage()}`);

const test = (times, log=true) => {
  log && console.time('enqueue');

  var values = {};
  var serialized = {};
  var coveredInsertions = {};
  var lastId = 0;

  for (let i = 0; i < times; i++) {
    const id = i;
    const obj = { id, insertion: { id, } };

    lastId = i;

    if (!values.hasOwnProperty(id)) {
      values[id] = [];
    }

    values[id].push(obj);

    if (i % 4 === 0) {
      values[id].push(id);
    } else if (i % 12 === 0) {
      values[id].push(Symbol('hey'));
    }

    if (!coveredInsertions.hasOwnProperty(i)) {
      coveredInsertions[i] = 0;
    }

    coveredInsertions[i] += 1;
  }

  log && console.timeEnd('enqueue');

  log && console.time('serialize');

  for (let id = 0; id < lastId + 1; id++) {
    if (values.hasOwnProperty(id)) {
      if (!serialized.hasOwnProperty(id)) {
        serialized[id] = [];
      }

      const arr = values[id];

      for (let i = 0; i < arr.length; i += 1) {
        serialized[id].push(inspect(arr[i]));
      }
    }
  }


  log && console.timeEnd('serialize');

  log && console.time('ids');
  const insertionIds = Object.keys(serialized).map(key => key | 0);
  log && console.timeEnd('ids');

  var all =
    Object.values(values)
      .reduce((n, items) => n + items.length, 0);

  log && console.log(`length: ${all}; usage: ${usage()}`);
};


test(40000);
test(20000);

for (let i = 0; i < 10; i++) {
  test(40000, false);
  test(20000, false);
}

console.log()
console.log()

test(40000);
console.log()
test(20000);
