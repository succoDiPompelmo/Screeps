enum Role {
  Harvester = 1,
  Builder,
}

enum Task {
  Harvest = 1,
  Deposit,
  Build,
}

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)
 
    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: Role;
    task: Task;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

const SPAWN = 'Spawn';

export const loop = () => {
  spawn_harvester(Game.spawns[SPAWN]);
  spawn_builder(Game.spawns[SPAWN]);
  

  for (const creep_name in Game.creeps) {
    const creep = Game.creeps[creep_name];

    if (creep.memory.role == Role.Harvester) {
      harvest(creep);
    } else if (creep.memory.role == Role.Builder) {
      // We should only setup construction sites once
      setup_construction_sites(creep.room);
      build(creep);
    }
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
};

function spawn_harvester(spawn: StructureSpawn) {
  let creeps = Game.creeps;
  let harvesters = Object.keys(creeps).filter((creep_name) => creeps[creep_name].memory.role == Role.Harvester && creeps[creep_name]);
  let harvesters_count = harvesters.length;

  let ran = Math.floor(Math.random() * 100000);

  if (harvesters_count < 3 && !spawn.spawning) {
    let output = spawn.spawnCreep([WORK, CARRY, MOVE], 'Pino_' + ran, { memory: { role: Role.Harvester, task: Task.Harvest } });

    if (output != OK) {
      console.log(`Error spawning harvester creep: ${output}`);
    }
  }
}

function spawn_builder(spawn: StructureSpawn) {
  let creeps = Game.creeps;
  let builders = Object.keys(creeps).filter((creep_name) => creeps[creep_name].memory.role == Role.Builder);
  let builders_count = builders.length;

  const construction_sites = spawn.room.find(FIND_CONSTRUCTION_SITES);

  let ran = Math.floor(Math.random() * 100000);

  if (builders_count < 3 && !spawn.spawning && construction_sites.length > 0) {
    let output = spawn.spawnCreep([WORK, CARRY, MOVE], 'Mario_' + ran, { memory: { role: Role.Builder, task: Task.Harvest } });

    if (output != OK) {
      console.log(`Error spawning builder creep: ${output}`);
    }
  }
}

function setup_construction_sites(room: Room) {
  let controller = room.controller;

  if (controller === undefined) {
    return;
  }

  let controller_level = controller.level;
  let spawn_position = room.find(FIND_MY_SPAWNS)[0].pos;

  if (controller_level > 1) {
    room.createConstructionSite(spawn_position.x + 2, spawn_position.y, STRUCTURE_EXTENSION);
    room.createConstructionSite(spawn_position.x, spawn_position.y + 2, STRUCTURE_EXTENSION);
    room.createConstructionSite(spawn_position.x - 2, spawn_position.y, STRUCTURE_EXTENSION);
    room.createConstructionSite(spawn_position.x, spawn_position.y - 2, STRUCTURE_EXTENSION);
  }
}

function harvest(creep: Creep) {
  // Very bad code, states are not well defined and should be refactored to a state machine
  if (creep.store.energy < creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    const sources = creep.room.find(FIND_SOURCES);
    const closest_source = creep.pos.findClosestByPath(sources);

    gather(creep, closest_source);
  } else if (creep.store.energy > 0 && creep.memory.task == Task.Deposit) {
    const target = select_deposit_target(creep);

    if (!target) {
      console.log('No target found to deposit energy');
      return;
    }

    deposit(creep, target);
  } else if (creep.store.energy == 0 && creep.memory.task == Task.Deposit) {
    creep.memory.task = Task.Harvest;
  } else if (creep.store.energy == creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    creep.memory.task = Task.Deposit;
  }
  else {
    console.log(`Creep ${creep.name} is in an unknown state and will not do anything`);
  }
}

function build(creep: Creep) {
  // Very bad code, states are not well defined and should be refactored to a state machine
  if (creep.store.energy < creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    const sources = creep.room.find(FIND_SOURCES);
    const closest_source = creep.pos.findClosestByPath(sources);

    gather(creep, closest_source);
  } else if (creep.store.energy > 0 && creep.memory.task == Task.Build) {
    const construction_sites = creep.room.find(FIND_CONSTRUCTION_SITES);

  if (construction_sites.length > 0) {
    const closest_site = creep.pos.findClosestByPath(construction_sites);

    if (closest_site) {
      if (creep.build(closest_site) == ERR_NOT_IN_RANGE) {
        creep.moveTo(closest_site, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  } else {
    // We have no construction sites, so we should deposit the energy instead
    creep.memory.task = Task.Deposit;
    creep.memory.role = Role.Harvester;
  }
  } else if (creep.store.energy == 0 && creep.memory.task == Task.Build) {
    creep.memory.task = Task.Harvest;
  } else if (creep.store.energy == creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    creep.memory.task = Task.Build;
  }
  else {
    console.log(`Creep ${creep.name} is in an unknown state and will not do anything`);
  }
}

function gather(creep: Creep, source: Source | null) {
  if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

function deposit(creep: Creep, structure: Structure) {

  creep.transfer(structure, RESOURCE_ENERGY);

  if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(structure, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function select_deposit_target(creep: Creep): Structure | undefined {
  const spawns_with_free_capacity = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });

  const extensions_with_free_capacity = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });

  const controller = creep.room.controller;

  if (spawns_with_free_capacity.length > 0) {
    return spawns_with_free_capacity[0];
  } else if (extensions_with_free_capacity.length > 0) {
    return extensions_with_free_capacity[0];
  } else if (controller && controller.my) {
    return controller;
  }
}