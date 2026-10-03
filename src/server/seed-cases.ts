import { z } from "zod";
import { caseSchema, type WatchCase } from "../domain/cases.ts";

const catalog: WatchCase[] = [
  {
    id: "W-07",
    still: "stills/still-01-casino.png",
    stillAlt: "Wrist at a casino table wearing a steel dive watch",
    source: "Casino Royale (2006)",
    subject: "Daniel Craig as James Bond",
    frame: "00:47:12",
    question: "What sits on the left wrist in this still?",
    options: [
      { key: "A", label: "Omega Seamaster Diver 300M" },
      { key: "B", label: "Rolex Submariner Date" },
      { key: "C", label: "Tudor Pelagos" },
    ],
    answer: "Omega Seamaster Diver 300M",
    aliases: ["seamaster", "seamaster 300", "seamaster diver", "omega seamaster", "diver 300m"],
    hint: "Bond returned to Omega in this film. Look at the wave dial and the 300M dive case, not a Submariner crown.",
    title: "Omega Seamaster Diver 300M",
    ref: "168.1623 / 2220.80",
    history:
      "Craig's first Bond film put Omega back on the wrist after a long Rolex era on screen. The Diver 300M with the wave dial was already a tool watch from 1993. Casino Royale made that specific case the public Bond watch for a decade.",
    buyNew: "https://www.omegawatches.com/en-us/watches/seamaster/diver-300m",
    buyUsed: "https://www.chrono24.com/omega/seamaster-diver-300m--cat286.htm",
  },
  {
    id: "W-11",
    still: "stills/still-02-lemans.png",
    stillAlt: "Racing driver wrist on a steering wheel wearing a chronograph",
    source: "Le Mans (1971)",
    subject: "Steve McQueen",
    frame: "01:12:04",
    question: "Name the watch on the driver's wrist.",
    options: [
      { key: "A", label: "Rolex Daytona" },
      { key: "B", label: "TAG Heuer Monaco" },
      { key: "C", label: "Omega Speedmaster" },
    ],
    answer: "TAG Heuer Monaco",
    aliases: ["heuer monaco", "tag heuer monaco", "monaco", "monaco calibre 11"],
    hint: "Square case. Blue dial. McQueen wore Heuer, not Rolex, for this race film.",
    title: "Heuer Monaco Calibre 11",
    ref: "1133B",
    history:
      "Heuer launched the square Monaco in 1969 as one of the first automatic chronographs. McQueen wore it throughout Le Mans. The square case was a racing instrument, not a dress piece, and it is still the McQueen watch collectors hunt.",
    buyNew: "https://www.tagheuer.com/us/en/watches/tag-heuer-monaco/",
    buyUsed: "https://www.chrono24.com/heuer/monaco--mod45.htm",
  },
  {
    id: "W-19",
    still: "stills/still-03-moon.png",
    stillAlt: "Flight-suit wrist wearing a manual chronograph with a tachymeter bezel",
    source: "First Man (2018) / NASA archive",
    subject: "Ryan Gosling as Neil Armstrong",
    frame: "02:04:31",
    question: "Name the watch qualified for EVA.",
    options: [
      { key: "A", label: "Hamilton Khaki Field" },
      { key: "B", label: "Breitling Navitimer" },
      { key: "C", label: "Omega Speedmaster Professional" },
    ],
    answer: "Omega Speedmaster Professional",
    aliases: ["speedmaster", "speedy", "moonwatch", "omega speedmaster", "speedmaster professional"],
    hint: "NASA qualified one civilian chronograph for spaceflight. Manual wind. Tachymeter bezel. No date.",
    title: "Omega Speedmaster Professional",
    ref: "ST 105.012 / 310.30.42.50.01.001",
    history:
      "Omega's Speedmaster was qualified by NASA in 1965 after brutal thermal and vibration tests. Armstrong wore a Speedy on Apollo 11. First Man restaged that hardware. The Moonwatch is still sold as a manual-wind chronograph with a black dial and tachymeter bezel.",
    buyNew: "https://www.omegawatches.com/en-us/watches/speedmaster/moonwatch",
    buyUsed: "https://www.chrono24.com/omega/speedmaster--cat32.htm",
  },
];

export const seedCases: WatchCase[] = z.array(caseSchema).min(1).parse(catalog);

export function getSeedCaseById(id: string): WatchCase | undefined {
  return seedCases.find((item) => item.id === id);
}
