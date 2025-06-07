import { create } from 'zustand';

type PdfStore = {
  showRecent: number;
  setShowRecent: (index: number) => void;
  showUploaded: boolean;
  setShowUploaded: (value: boolean) => void;
};

export const usePdfStore = create<PdfStore>((set) => ({
  showRecent: -1,
  setShowRecent: (index) => {
    localStorage.setItem("showRecent", JSON.stringify(index)); // optional
    set({ showRecent: index });
  },
  showUploaded: false,
  setShowUploaded: (value) => set({ showUploaded: value }),
}));
