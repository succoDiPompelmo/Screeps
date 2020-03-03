/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.builder');
 * mod.thing == 'a thing'; // true
 */

const roleBuilder = {
  run: function(creep) {
    if (
      creep.carry.energy == creep.carryCapacity &&
      creep.memory.isFull == false
    ) {
      creep.memory.isFull = true;
      creep.say('50');
    }
    if (
      creep.carry.energy == 0 &&
      creep.memory.isFull == true
    ) {
      creep.memory.isFull = false;
      creep.say('0');
    }

    if (!creep.memory.isFull) {
      const sources = creep.room.find(FIND_SOURCES);
      if (creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(
            sources[1],
            {visualizePathStyle: {stroke: '#ffaa00'}},
        );
      }
    } else {
      const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
      if (construction_sites.length) {
        if (creep.build(constructionSites[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(constructionSites[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
      }
    }
  },
};

module.exports = roleBuilder;
