"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { COURTS, STATUS_COLORS, Court } from "@/data/courts";

// Custom marker generator
const createStatusIcon = (color: string) => {
  return L.divIcon({
    className: "custom-pin",
    html: `
      <div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 10px ${color}, 0 0 0 2px white;"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface MapProps {
  onSelectCourt: (court: Court) => void;
}

export default function Map({ onSelectCourt }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        center: [40.74, -73.95],
        zoom: 12
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      // Add markers
      COURTS.forEach((court) => {
        const marker = L.marker(court.location, {
          icon: createStatusIcon(STATUS_COLORS[court.status]),
        });

        marker.on("click", () => {
          onSelectCourt(court);
        });

        marker.addTo(map);
      });

      mapInstanceRef.current = map;
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onSelectCourt]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapContainerRef} className="h-full w-full outline-none" style={{ background: '#09090b' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-[400]" />
    </div>
  );
}
