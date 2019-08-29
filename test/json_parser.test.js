// custom matchers for Jest testing.
expect.extend({

  // custom matcher for checking schedule property form.
  toHaveValidScheduleProperties(received) {

    // ensure schedule is defined, and is an Object.
    expect(received).toBeDefined();
    expect(received).toBeInstanceOf(Object);

    // ensure that 'completed' property exists, with correct property format.
    expect(received).toHaveProperty('completed');

    // ensure that 'scheduled' property exists, is defined, and is an Array.
    expect(received).toHaveProperty('scheduled');

    return {
      message: () => `expected ${received} not to have valid schedule properties.`,
      pass: true,
    };
  },

  // custom matcher for checking schedule.completed property form.
  toHaveValidScheduleCompletedProperties(received) {

    // received is 'schedule.completed'.

    // ensure that schedule.completed is defined, and is an Object.
    expect(received).toBeDefined();
    expect(received).toBeInstanceOf(Object);

    // ensure that schedule.completed.classes field exists, with correct property format.
    expect(received).toHaveProperty('classes');
    expect(received.classes).toBeDefined();
    expect(received.classes).toBeInstanceOf(Array);

    return {
      message: () => `expected ${received} not to have valid schedule.completed properties.`,
      pass: true,
    };
  },

  // custom matcher for checking schedule.completed.classes property form.
  toHaveValidScheduleCompletedClassesProperties(received) {

    // received.classes should be an Array of Objects with termId and courses properties.
    // yeah, I know it doesn't make sense for received.classes to not be an array of classes. Sorry.
    expect(received).toBeDefined();
    expect(received).toBeInstanceOf(Object);
    
    // ensures received has property 'termId', that is a number that matches 20xx[1-6]0.
    expect(received).toHaveProperty('termId');
    expect(received.termId).toBeDefined();
    // expect(received.termId).toBeInstanceOf(Number);
    expect("" + received.termId).toMatch(/^20\d\d[1-6]0$/);
    
    // ensures received has property 'courses', that is an Array of courses.
    expect(received).toHaveProperty('courses');
    expect(received.courses).toBeDefined();
    expect(received.courses).toBeInstanceOf(Array);

    return {
      message: `expected ${received} to not have valid schedule.completed.classes properties.`,
      pass: true,
    };
  },

  // custom matcher to ensure received is a valid course.
  toBeValidCourse(received) {

    // ensure that received is an Object.
    expect(received).toBeDefined();
    expect(received).toBeInstanceOf(Object);

    // todo: add the name property to list of tests.
    // ensure that received contains the following properties, and that they are all defined.
    let props = ['hon', 'subject', 'classId', 'credithours', 'season', 'year', 'termId'];
    for (let i = 0; i < props.length; i += 1) {
      expect(received).toHaveProperty(props[i]);
      expect(received[props[i]]).toBeDefined();
    }

    // ensure the properties' values are well formed.
    expect(received.subject).toMatch(/^[A-Z]{2,4}$/);
    expect(received.classId).toMatch(/^[\d]{4}$/);
    expect(received.credithours).toMatch(/^[\d]\.00/);
    expect(received.season).toMatch(/FL|SP|S1|S2|SM/);
    expect(received.year).toMatch(/^\d\d$/);
    expect(received.termId).toMatch(/^20\d\d[1-6]0$/);
    // expect(received.name).toBeInstanceOf(String);
    
    return {
      message: () => `expected ${received} not to have valid course properties`,
      pass: true,
    };
  },

  // custom matcher for checking schedule.scheduled property form.
  toHaveValidScheduleScheduledProperties(received) {

    // received is 'schedule.scheduled'.

    // ensure that received is defined, and is an Array.
    expect(received).toBeDefined();
    expect(received).toBeInstanceOf(Array);

    // ensure that each item in received is an Array of courses.
    for (let i = 0; i < received.length; i += 1) {

      let item = received[i];

      expect(item).toBeDefined();
      expect(item).toBeInstanceOf(Array);

      // we should never have more than 4 courses in a semester.
      expect(item.length).toBeLessThanOrEqual(4);
      
      for (let j = 0; j < item.length; j += 1) {
        let itemCourse = item[j];

        expect(itemCourse).toBeDefined();
        // expect(itemCourse).toBeInstanceOf(String);
      }
    }

    return {
      message: () => `expected ${received} not to have valid schedule.scheduled properties.`,
      pass: true,
    };
  },

  // custom matcher for checking that certain keys are in a map.
  toBeInMap(received, map) {
    let key = received;
    if (map.has(key)) {
      return {
        message: () => `expected ${key} to not be in map ${map}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${key} to be in map ${map}`,
        pass: false,
      };
    }
  },

  // custom matcher for checking a topological ordering is valid according to a constraint.
  // expects an Array[X], and a Map<X, Array[X]>.
  toBeValidTopologicalOrdering(received, constraint) {
    let topo = received;

    // double check topo : Array[X]
    expect(topo).toBeDefined();
    expect(topo).toBeInstanceOf(Array);

    // double check constraint : Map<X, Array[X]>.
    expect(constraint).toBeDefined();
    expect(constraint).toBeInstanceOf(Map);
    
    // check that all Array[X] values of the Map are valid vertices in the Graph.
    let iterator = constraint.values();
    let mapValues = iterator.next();
    while (!mapValues.done) {

      // check that the values are defined.
      let vals = mapValues.value;
      expect(vals).toBeDefined();
      expect(vals).toBeInstanceOf(Array);

      // check that all values are in the map.
      // all vertices can only point to vertices that are in the Graph.
      vals.forEach(val => expect(val).toBeInMap(constraint));

      // iterate next.
      mapValues = iterator.next();
    }

    let indices = new Map();
    topo.forEach((v, idx) => indices.set(v, idx));
    
    // for each vertex in the list,
    for (let i = 0; i < topo.length; i += 1) {
      
      // v must come before all neighbors of v.
      let v = topo[i];
      
      constraint.get(v).forEach(neighbor => {
        if (!(i < indices.get(neighbor))) {
          // if the index of ourselves is not less than the index of our neighbor, throw error.
          return {
            message: () => `Expected ordering ${topo} to be topological according to map ${constraint}. Expected vertex ${v} to come before ${neighbor}`,
            pass: false,
          };
        }
      });
    }

    return {
      message: () => `Expected ordering ${topo} to not be topological.`,
      pass: true,
    };
  },
});

// test json_parser.json_to_schedule(...)
const json_loader = require('../src/json_loader.ts');
const json_parser = require('../src/json_parser.js');

const fs = require('fs');

// the classMapParent constant
const PARENT = json_loader.loadClassMaps();

let schedules = [];

let cs_sched = PARENT.then(result => {
  return json_parser.toSchedule(fs.readFileSync('./test/mock_parsed_audits/cs_json.json', 'utf-8'), result);
});
let cs_sched2 = PARENT.then(result => {
  return json_parser.toSchedule(fs.readFileSync('./test/mock_parsed_audits/cs_json2.json', 'utf-8'), result);
});
// const tempSchedule = JSON.parse(fs.readFileSync('./test/mock_parsed_audits/sampleScheduleOutput.json', 'utf-8'));

schedules.push(cs_sched);
schedules.push(cs_sched2);
// schedules.push(tempSchedule);


for (let i = 0; i < schedules.length; i += 1) {
  let schedule = schedules[i];
  
  // tests that 'schedule' is well formed.
  test('Ensures that schedule has well formed properties and types.', async () => {
    const result = await schedule;
    expect(result).toHaveValidScheduleProperties();
  });
  
  // test that 'schedule.completed' is well formed.
  test('Ensures that schedule.completed has well formed properties and types.', async () => {
    const result = await schedule;
    expect(result.completed).toHaveValidScheduleCompletedProperties();
  });
  
  test('Ensures that term and course objects in schedule are well formed.', async () => {
    const result = await schedule;
    
    // test that each item in 'schedule.completed.classes' is well formed.
    for (let objIndex = 0; objIndex < result.completed.classes.length; objIndex += 1) {
      
      let termObj = result.completed.classes[objIndex];
      expect(termObj).toHaveValidScheduleCompletedClassesProperties();
      
      // test that each item in 'schedule.completed.classes[objIndex].courses' is well formed.
      for (let courseIdx = 0; courseIdx < termObj.courses.length; courseIdx += 1) {
        
        let courseObj = termObj.courses[courseIdx];
        expect(courseObj).toBeValidCourse();
      }
    }
  });
  
  // test that 'schedule.scheduled' is well formed.
  test('Ensures that schedule.scheduled has well formed properties and types.', async () => {
    const result = await schedule;
    expect(result.scheduled).toHaveValidScheduleScheduledProperties();
  });
}

// todo: rename 'schedule.scheduled' property to 'schedule.planned' to avoid confusion.

// tests to ensure Graph.prototype.toTopologicalOrdering() works properly.

const Graph = json_parser.Graph;
let g = new Graph();
g.addVertex("a");
g.addVertex("b");
g.addVertex("c");
g.addVertex("d");
g.addEdge("a", "b");
g.addEdge("b", "c");
g.addEdge("b", "d");
g.addEdge("c", "d");
expect(g.toTopologicalOrdering()).toBeValidTopologicalOrdering(g.adjList);

