enum Role {
  Harvester = 1,
  Carrier,
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
    room: string;
    role: Role;
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
  let total_creeps = Object.keys(Game.creeps).length;

  if (total_creeps == 0) {
    Game.spawns[SPAWN].spawnCreep([WORK, CARRY, MOVE], 'Pino', { memory: { room: 'W1N1', role: Role.Harvester } });
  } else if (total_creeps == 1) {
    Game.spawns[SPAWN].spawnCreep([WORK, CARRY, MOVE], 'Luigi', { memory: { room: 'W1N1', role: Role.Harvester } });
  }

  for (const creep_name in Game.creeps) {
    const creep = Game.creeps[creep_name];

    harvest(creep);
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
};

function harvest(creep: Creep) {
  // Very bad code, states are not well defined and should be refactored to a state machine
  if (creep.store.energy < creep.store.getCapacity() && creep.memory.role == Role.Harvester) {
    const sources = creep.room.find(FIND_SOURCES);
    const closest_source = creep.pos.findClosestByPath(sources);

    gather(creep, closest_source);
  } else if (creep.store.energy > 0 && creep.memory.role == Role.Carrier) {
    const target = select_deposit_target(creep);

    if (!target) {
      console.log('No target found to deposit energy');
      return;
    }

    deposit(creep, target);
  } else if (creep.store.energy == 0 && creep.memory.role == Role.Carrier) {
    creep.memory.role = Role.Harvester;
  } else if (creep.store.energy == creep.store.getCapacity() && creep.memory.role == Role.Harvester) {
    creep.memory.role = Role.Carrier;
  }
  else {
    console.log('Creep is in an unknown state and will not do anything');
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
  const spawns = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });

  const controller = creep.room.controller;

  if (spawns.length > 0) {
    return spawns[0];
  } else if (controller && controller.my) {
    return controller;
  }
}