import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import * as FileSystem from "expo-file-system/legacy";
import { GeoLocation, RoutePoint } from "@/lib/models";
import { mobileColors } from "@/lib/themes/mobileTokens";

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? "";
const MAPTILER_STYLE = "streets-v2";
const MAPTILER_TILE_URL = `https://api.maptiler.com/maps/${MAPTILER_STYLE}/{z}/{x}/{y}@2x.png?key=${MAPTILER_KEY}`;
const CARTO_FALLBACK_URL = "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";

const TILE_CACHE_DIR = `${FileSystem.cacheDirectory}map-tiles/`;
const TILE_CACHE_MAX_AGE_S = 60 * 60 * 24 * 30;

export type OsmMapHandle = {
  centerOn: (loc: GeoLocation, zoom?: number) => void;
  fitToCoordinates: (coords: GeoLocation[], padding?: number) => void;
};

type Props = {
  marker?: GeoLocation | null;
  polyline?: RoutePoint[] | null;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
};

const ENVIGADO_REGION = {
  latitude: 6.168,
  longitude: -75.592,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const OsmMap = forwardRef<OsmMapHandle, Props>(function OsmMap(
  { marker, polyline, initialRegion = ENVIGADO_REGION },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
        if (!info.exists) {
          await FileSystem.makeDirectoryAsync(TILE_CACHE_DIR, { intermediates: true });
        }
      } catch {
        /* Cache is an optimization; falls back to network-only on failure. */
      }
      if (!cancelled) setCacheReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useImperativeHandle(ref, () => ({
    centerOn: (loc, zoom = 0.02) => {
      mapRef.current?.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: zoom,
          longitudeDelta: zoom,
        },
        500,
      );
    },
    fitToCoordinates: (coords, padding = 60) => {
      if (coords.length === 0) return;
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: padding, right: padding, bottom: padding, left: padding },
        animated: true,
      });
    },
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        mapType="none"
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
      >
        {cacheReady && (
          <UrlTile
            urlTemplate={MAPTILER_KEY ? MAPTILER_TILE_URL : CARTO_FALLBACK_URL}
            maximumZ={19}
            tileSize={512}
            tileCachePath={TILE_CACHE_DIR}
            tileCacheMaxAge={TILE_CACHE_MAX_AGE_S}
            shouldReplaceMapContent
          />
        )}
        {polyline && polyline.length > 1 && (
          <Polyline
            coordinates={polyline.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
            strokeColor={mobileColors.primary}
            strokeWidth={5}
          />
        )}
        {marker && (
          <Marker
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            pinColor={mobileColors.critical}
          />
        )}
      </MapView>
    </View>
  );
});

export default OsmMap;
