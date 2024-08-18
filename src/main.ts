import path from "path";

enum Role {
  Harvester = 1,
  Builder,
  Miner,
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
  const spawn = Game.spawns[SPAWN];

  spawn_harvester(spawn);
  spawn_miners(spawn);
  spawn_builder(spawn);

  for (const creep_name in Game.creeps) {
    const creep = Game.creeps[creep_name];

    // The first time we run the loop, we should set the task to harvest
    setup_construction_sites(creep.room);
    setup_resources_containers(creep.room, spawn);

    if (creep.memory.role == Role.Harvester) {
      harvest(creep);
    } else if (creep.memory.role == Role.Builder) {
      // We should only setup construction sites once
      build(creep);
    } else if (creep.memory.role == Role.Miner) {
      mine(creep);
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

function spawn_miners(spawn: StructureSpawn) {
  let creeps = Game.creeps;
  let miners = Object.keys(creeps).filter((creep_name) => creeps[creep_name].memory.role == Role.Miner && creeps[creep_name]);
  let miners_count = miners.length;

  let ran = Math.floor(Math.random() * 100000);

  if (miners_count < 1 && !spawn.spawning) {
    let output = spawn.spawnCreep([WORK, CARRY, MOVE], 'Pietro_' + ran, { memory: { role: Role.Miner, task: Task.Harvest } });

    if (output != OK) {
      console.log(`Error spawning miner creep: ${output}`);
    }
  }
}

function spawn_builder(spawn: StructureSpawn) {
  let creeps = Game.creeps;
  let builders = Object.keys(creeps).filter((creep_name) => creeps[creep_name].memory.role == Role.Builder);
  let builders_count = builders.length;

  const construction_sites = spawn.room.find(FIND_CONSTRUCTION_SITES);

  let ran = Math.floor(Math.random() * 100000);

  if (builders_count < 1 && !spawn.spawning && construction_sites.length > 0) {
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
    room.createConstructionSite(spawn_position.x + 2, spawn_position.y + 2, STRUCTURE_EXTENSION);
  }
}

function setup_resources_containers(room: Room, spawn: StructureSpawn) {
  let sources = room.find(FIND_SOURCES);

  for (let source of sources) {
    try_setup_resources_container(source, spawn);
  }
}

function try_setup_resources_container(source: Source, spawn: StructureSpawn) {

  // Place a container next to the source and in the path to the spawn
  const path_finder = PathFinder.search(source.pos, { pos: spawn.pos, range: 1 });
  if (OK == source.room.createConstructionSite(path_finder.path[1], STRUCTURE_CONTAINER)) {
    return;
  }

  console.log(`Could not setup container for source at X ${source.pos.x} Y ${source.pos.y}`);
}

function mine(creep: Creep) {
  // Very bad code, states are not well defined and should be refactored to a state machine

  // If the creep has no capacity, we should not do anything
  // This happens when the creep spawns even though has CARRY body parts
  if (!creep.store.getCapacity()) {
    return;
  }

  if (creep.store.energy < creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    const sources = creep.room.find(FIND_SOURCES);
    const closest_source = creep.pos.findClosestByPath(sources);

    if (closest_source && creep.harvest(closest_source) == ERR_NOT_IN_RANGE) {
      creep.moveTo(closest_source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  } else if (creep.store.energy > 0 && creep.memory.task == Task.Deposit) {
    const container = find_closest_container(creep);

    if (!container) {
      console.log('No target found to deposit energy');
      return;
    }

    deposit(creep, container);
  } else if (creep.store.energy == 0 && creep.memory.task == Task.Deposit) {
    creep.memory.task = Task.Harvest;
  } else if (creep.store.energy == creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    creep.memory.task = Task.Deposit;
  }
  else {
    console.log(`Creep ${creep.name} is in an unknown state and will not do anything. Task: ${creep.memory.task} Role: ${creep.memory.role} Energy: ${creep.store.energy} Capacity: ${creep.store.getCapacity()}`);
  }
}

function harvest(creep: Creep) {
  // Very bad code, states are not well defined and should be refactored to a state machine

  // If the creep has no capacity, we should not do anything
  // This happens when the creep spawns even though has CARRY body parts
  if (!creep.store.getCapacity()) {
    return;
  }

  if (creep.store.energy < creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    const containers = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
      },
    });
    const closest_container = creep.pos.findClosestByPath(containers);

    if (closest_container && creep.withdraw(closest_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      creep.moveTo(closest_container, { visualizePathStyle: { stroke: '#ffaa00' } });

      return;
    }

    // If we can't find a container, we should try to harvest the source directly
    const sources = creep.room.find(FIND_SOURCES);
    const closest_source = creep.pos.findClosestByPath(sources);

    if (closest_source && creep.harvest(closest_source) == ERR_NOT_IN_RANGE) {
      creep.moveTo(closest_source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }

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
    console.log(`Creep ${creep.name} is in an unknown state and will not do anything. Task: ${creep.memory.task} Role: ${creep.memory.role} Energy: ${creep.store.energy} Capacity: ${creep.store.getCapacity()}`);
  }
}

function build(creep: Creep) {
  // Very bad code, states are not well defined and should be refactored to a state machine

  // If the creep has no capacity, we should not do anything
  // This happens when the creep spawns even though has CARRY body parts
  if (!creep.store.getCapacity()) {
    return;
  }

  if (creep.store.energy < creep.store.getCapacity() && creep.memory.task == Task.Harvest) {
    const containers = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
      },
    });
    const closest_container = creep.pos.findClosestByPath(containers);

    if (closest_container && creep.withdraw(closest_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      creep.moveTo(closest_container, { visualizePathStyle: { stroke: '#ffaa00' } });
    }

    // If we can't find a container, we should try to harvest the source directly
    const sources = creep.room.find(FIND_SOURCES);
    const closest_source = creep.pos.findClosestByPath(sources);

    if (closest_source && creep.harvest(closest_source) == ERR_NOT_IN_RANGE) {
      creep.moveTo(closest_source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
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

function gather(creep: Creep, structure: Structure | null) {
  if (structure && creep.withdraw(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(structure, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

function deposit(creep: Creep, structure: Structure) {

  creep.transfer(structure, RESOURCE_ENERGY);

  if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(structure, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function find_closest_container(creep: Creep): Structure | null {
  const containers = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_CONTAINER);
    },
  });

  return creep.pos.findClosestByPath(containers);
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