import { ReactElement } from "react";
import { Button } from "@rneui/themed";
import Geolocation from "@react-native-community/geolocation";

const publishPosition = (coords) => {
  console.log(coords);
};

export default function GeoButton(): ReactElement {
  return (
    <Button
      onTouchEnd={() => {
        Geolocation.watchPosition(publishPosition);
      }}
    >
      Start locating you
    </Button>
  );
}
