var RoleHarvester = require('role.harvester');
var RoleUpgrader = require('role.upgrader');
var RoleBuilder = require('role.builder')
var RoleSpawn = require('role.spawn');

var upgrader_count = 0;
var harvester_count = 0;

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

if (upgrader_count < 7){
        RoleSpawn.run("U");
    }
if (harvester_count < 2){
        RoleSpawn.run("H");
    }
if (builder_count < 5){
        RoleBuilder.run("B")
}
