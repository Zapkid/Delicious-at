"use client";

import { create } from "zustand";

interface RequestState {
  itemId: string | null;
  shopId: string | null;
  portionId: string | null;
  note: string;
  preferredPickupTime: string;
  wantsDelivery: boolean;

  setItem: (itemId: string, shopId: string) => void;
  setPortion: (portionId: string | null) => void;
  setNote: (note: string) => void;
  setPreferredPickupTime: (time: string) => void;
  setWantsDelivery: (wants: boolean) => void;
  reset: () => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  itemId: null,
  shopId: null,
  portionId: null,
  note: "",
  preferredPickupTime: "",
  wantsDelivery: false,

  setItem: (itemId: string, shopId: string) => set({ itemId, shopId }),
  setPortion: (portionId: string | null) => set({ portionId }),
  setNote: (note: string) => set({ note }),
  setPreferredPickupTime: (time: string) =>
    set({ preferredPickupTime: time }),
  setWantsDelivery: (wants: boolean) => set({ wantsDelivery: wants }),
  reset: () =>
    set({
      itemId: null,
      shopId: null,
      portionId: null,
      note: "",
      preferredPickupTime: "",
      wantsDelivery: false,
    }),
}));
