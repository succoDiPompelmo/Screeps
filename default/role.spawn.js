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
        if (creep_type == "U"){
           Game.spawns["Spawn1"].createCreep([MOVE,CARRY,WORK],{role:"upgrader"}); 
        }
        if (creep_type == "H"){
           Game.spawns["Spawn1"].createCreep([MOVE,CARRY,WORK],{role:"harvester"});
        }
    }
}
module.exports = roleSpawn;