/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.spawn');
 * mod.thing == 'a thing'; // true
 */
 
var roleSpawn = {
    run: function(creep_type){
        if (creep_type == "U" && Game.spawns["Spawn1"].energy > 200){
            Game.spawns["Spawn1"].createCreep([MOVE,CARRY,WORK],{role:"upgrader",isFull:false}); 
        }
        if (creep_type == "H" && Game.spawns["Spawn1"].energy > 200){
            Game.spawns["Spawn1"].createCreep([MOVE,CARRY,WORK],{role:"harvester",isFull: false});
        }
        if (creep_type == "B" && Game.spawns["Spawn1"].energy > 200){
            Game.spawns["Spawn1"].createCreep([MOVE,CARRY,WORK],{role:"builder",isFull: false});
        }
    }
}
module.exports = roleSpawn;