/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.harvester');
 * mod.thing == 'a thing'; // true
 */

var roleHarvester = {
    run: function(creep){
        if (Game.spawns["Spawn1"].energy < Game.spawns["Spawn1"].energyCapacity){
            if (creep.carry.energy < creep.carryCapacity){
                var sources = creep.room.find(FIND_SOURCES);
                if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE){
                    creep.moveTo(sources[0]);
                }
            }
            else {
                if(creep.transfer(Game.spawns["Spawn1"], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(Game.spawns["Spawn1"]);
                }
            }
        }
        else {
            creep.moveTo(40,15);
        }
    }
}

module.exports = roleHarvester;