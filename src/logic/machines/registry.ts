import type { MachineEffect, MachineType } from "../types";

const fanEffect: MachineEffect = (state, _machine) => state;
const sprayerEffect: MachineEffect = (state, _machine) => state;
const freezerEffect: MachineEffect = (state, _machine) => state;

export const machineRegistry: Record<MachineType, MachineEffect> = {
  fan: fanEffect,
  sprayer: sprayerEffect,
  freezer: freezerEffect,
};
