export type CourtStatus = "OPEN" | "BUSY" | "FULL" | "CLOSED";

export interface Court {
    id: number;
    name: string;
    borough: string;
    location: [number, number]; // [lat, lng]
    surface: "Hard" | "Clay" | "Grass";
    lights: boolean;
    status: CourtStatus;
    activePlayers: number;
    totalCourts: number;
}

export const COURTS: Court[] = [
    {
        id: 1,
        name: "McCarren Park",
        borough: "Brooklyn",
        location: [40.7209, -73.9552],
        surface: "Hard",
        lights: true,
        status: "OPEN",
        activePlayers: 4,
        totalCourts: 7,
    },
    {
        id: 2,
        name: "Central Park (Spectacular)",
        borough: "Manhattan",
        location: [40.7963, -73.9506],
        surface: "Clay",
        lights: false,
        status: "BUSY",
        activePlayers: 18,
        totalCourts: 26,
    },
    {
        id: 3,
        name: "Fort Greene Park",
        borough: "Brooklyn",
        location: [40.6912, -73.9754],
        surface: "Hard",
        lights: false,
        status: "FULL",
        activePlayers: 12,
        totalCourts: 6,
    },
    {
        id: 4,
        name: "Riverside Park (96th St)",
        borough: "Manhattan",
        location: [40.7963, -73.9734], // Approximate
        surface: "Clay",
        lights: false,
        status: "CLOSED",
        activePlayers: 0,
        totalCourts: 10,
    },
    {
        id: 5,
        name: "Hudson River Park (Pier 40)",
        borough: "Manhattan",
        location: [40.7288, -74.0116],
        surface: "Hard",
        lights: true,
        status: "BUSY",
        activePlayers: 8,
        totalCourts: 3,
    }
];

export const STATUS_COLORS = {
    OPEN: "#ccff00", // Tennis Green
    BUSY: "#facc15", // Yellow
    FULL: "#ef4444", // Red
    CLOSED: "#71717a", // Zinc-500
};
