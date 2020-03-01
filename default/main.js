const RoleHarvester = require('role.harvester');
const RoleUpgrader = require('role.upgrader');
const RoleBuilder = require('role.builder');
const RoleSpawn = require('role.spawn');

let upgraderCount = 0;
let harvesterCount = 0;


for (const name in Game.creeps) {
  if (Object.prototype.hasOwnProperty.call(Game.creeps, name)) {
    const creep = Game.creeps[name];
    if (creep.memory.role == 'harvester') {
      RoleHarvester.run(creep);
      harvesterCount++;
    }
    if (creep.memory.role == 'upgrader') {
      RoleUpgrader.run(creep);
      upgraderCount++;
    }
    if (creep.memory.role == 'builder') {
      RoleBuilder.run(creep);
      builderCount++;
    }
  }
}

if (upgraderCount < 7) {
  RoleSpawn.run('U');
}
if (harvesterCount < 2) {
  RoleSpawn.run('H');
}
if (builderCount < 5) {
  RoleBuilder.run('B');
}
