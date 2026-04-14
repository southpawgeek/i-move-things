import type { MachineEffect, MachineType } from "../types";
import { fanEffect } from "./fanEffect";
import { freezerEffect } from "./freezerEffect";
import { sprayerEffect } from "./sprayerEffect";

export const machineRegistry: Record<MachineType, MachineEffect> = {
  fan: fanEffect,
  sprayer: sprayerEffect,
  freezer: freezerEffect,
};
