<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import viteLogo from "/vite.svg";
  import Counter from "./lib/Counter.svelte";
  import mapboxgl from "mapbox-gl";
  import "../node_modules/mapbox-gl/dist/mapbox-gl.css";
  import { MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
  import "mapbox-gl-style-switcher/styles.css";
  import { onDestroy, onMount } from "svelte";
  import { createClient } from "@supabase/supabase-js";
  import { type Feature } from "geojson";

  let map: mapboxgl.Map;
  let lat = 33.9761292,
    lng = -118.2238288,
    zoom = 9;

  const supabase = createClient(
    "https://eakbbivbtcvpeumijfvt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2JiaXZidGN2cGV1bWlqZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTE0Mjc3MTIsImV4cCI6MjAwNzAwMzcxMn0.EgD0x4Vt0LrDdv1313EixusUUWt2jK73AlWosG2jV58"
  );

  onMount(async () => {
    let { data: crime_data, error } = await supabase
      .from("crime_data")
      .select("LAT,LON,DATE_OCC")
      .order("DATE_OCC", { ascending: false });

    let geoData: Feature[] = crime_data.map((crime) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [crime.LON, crime.LAT],
      },
      properties: {
        date: crime.DATE_OCC,
      },
    }));

    mapboxgl.accessToken =
      "pk.eyJ1Ijoia3dpa21hdHQiLCJhIjoiY2xsMTliZmNoMHFmbzNmbXczY29ubXYwcCJ9.7M3jB9IL_bPrGKMPjnQU4A";

    map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.addControl(new mapboxgl.FullscreenControl(), "bottom-right");
    map.addControl(new MapboxStyleSwitcherControl(), "top-right");

    map.on("move", () => {
      lng = map.getCenter().lng;
      lat = map.getCenter().lat;
      zoom = map.getZoom();
    });

    map.on("load", () => {
      // Add a geojson point source.
      // Heatmap layers also work with a vector tile source.
      map.addSource("earthquakes", {
        type: "geojson",
        data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
      });

      map.addSource("crimes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: geoData,
        },
      });

      map.addLayer(
        {
          id: "crimes-heat",
          type: "heatmap",
          source: "crimes",
          maxzoom: 14,
          paint: {
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(87,255,40,0)",
              0.2,
              "rgba(190,255,40,0.8)",
              0.4,
              "rgba(255,255,40,0.8)",
              0.8,
              "rgba(252,192,16,0.8)",
              1,
              "rgba(255,26,0,0.8)",
            ],
            "heatmap-radius": {
              stops: [
                [5, 6],
                [6, 7],
                [7, 8],
                [8, 9],
                [9, 10],
              ],
            },
            // Transition from heatmap to circle layer by zoom level
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13,
              1,
              14,
              0,
            ],
          },
        },
        "waterway-label"
      );

      map.addLayer(
        {
          id: "crimes-point",
          type: "circle",
          source: "crimes",
          minzoom: 12,
          paint: {
            "circle-stroke-color": "white",
            "circle-stroke-width": 1,
            // Transition from heatmap to circle layer by zoom level
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              0,
              14,
              1,
            ],
          },
        },
        "waterway-label"
      );
    });
  });

  onDestroy(() => {
    map.remove();
  });
</script>

<main>
  <div class="sidebar">
    Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {zoom.toFixed(
      2
    )}
  </div>
  <div id="map" class="h-screen w-screen" />
</main>

<style>
  .sidebar {
    @apply absolute top-0 left-0 z-10 py-2 px-3 m-3 font-mono text-sm bg-slate-700 text-white rounded;
  }
</style>
