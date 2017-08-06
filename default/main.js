var RoleHarvester = require('role.harvester');
var RoleUpgrader = require('role.upgrader');
var RoleSpawn = require('role.spawn');
var RoleBuilder = require('role.builder');

var upgrader_count = 0;
var harvester_count = 0;
var builder_count = 0;

for (var name in Game.creeps){
    var creep = Game.creeps[name];
    if (creep.memory.role == "harvester"){
       RoleHarvester.run(creep);
       harvester_count++;
    }
    if (creep.memory.role == "upgrader"){
        RoleUpgrader.run(creep);
        upgrader_count++;
    }
    if (creep.memory.role == "builder"){
        RoleBuilder.run(creep);
        builder_count++;
    }
}

if (upgrader_count < 2){
        RoleSpawn.run("U");
    }
if (harvester_count < 1){
        RoleSpawn.run("H");
    }
if (builder_count < 2){
        RoleSpawn.run("B");
}