const { Bento, getBento, setVariable, getVariable } = require('../../build');

new Bento();

console.log('getBento(); = ', getBento());

setVariable('TEST', 'hello world');
console.log('getVariable(\'TEST\'); = ', getVariable('TEST'));
