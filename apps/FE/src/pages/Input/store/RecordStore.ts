import { create } from "zustand";

type TodayRecord = {
  transport?: { co2Kg: number; moneyWon: number };
  electricity?: { kwh: number; co2Kg: number; moneyWon: number };
  consumption?: { co2Kg: number; moneyWon: number };
};

type Actions = {
  setTransport: (v: NonNullable<TodayRecord["transport"]>) => void;
  setElectricity: (v: NonNullable<TodayRecord["electricity"]>) => void;
  setConsumption: (v: NonNullable<TodayRecord["consumption"]>) => void;
  reset: () => void;
};

export const useTodayRecordStore = create<TodayRecord & Actions>((set) => ({
  transport: undefined,
  electricity: undefined,
  consumption: undefined,

  setTransport: (v) => set({ transport: v }),
  setElectricity: (v) => set({ electricity: v }),
  setConsumption: (v) => set({ consumption: v }),
  reset: () => set({ transport: undefined, electricity: undefined, consumption: undefined }),
}));
