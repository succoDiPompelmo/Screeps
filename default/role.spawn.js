/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.spawn');
 * mod.thing == 'a thing'; // true
 */

const roleSpawn = {
  run: function(creepType) {
    if (creepType == 'U' && Game.spawns['Spawn1'].energy > 200) {
      Game.spawns['Spawn1'].createCreep([MOVE, CARRY, WORK], {role: 'upgrader', isFull: false});
    }
    if (creepType == 'H' && Game.spawns['Spawn1'].energy > 200) {
      Game.spawns['Spawn1'].createCreep([MOVE, CARRY, WORK], {role: 'harvester', isFull: false});
    }
    if (creepType == 'B' && Game.spawns['Spawn1'].energy > 200) {
      Game.spawns['Spawn1'].createCreep([MOVE, CARRY, WORK], {role: 'builder', isFull: false});
    }
  },
};
module.exports = roleSpawn;
