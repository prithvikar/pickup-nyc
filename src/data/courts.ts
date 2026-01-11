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
        totalCourts: 6,
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
    },
    {
        id: 6,
        name: "Brian Watkins Tennis Center",
        borough: "Manhattan",
        location: [40.7161, -73.9782], // Near Williamsburg Bridge
        surface: "Hard",
        lights: true,
        status: "OPEN",
        activePlayers: 6,
        totalCourts: 12,
    },
    {
        id: 7,
        name: "Cooper Park",
        borough: "Brooklyn",
        location: [40.7159, -73.9366],
        surface: "Hard",
        lights: true,
        status: "OPEN",
        activePlayers: 2,
        totalCourts: 2,
    }
];

export const STATUS_COLORS = {
    OPEN: "#ccff00", // Tennis Green
    BUSY: "#facc15", // Yellow
    FULL: "#ef4444", // Red
    CLOSED: "#71717a", // Zinc-500
};
