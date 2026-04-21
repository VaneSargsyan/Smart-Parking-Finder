import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "./App.css";

// Fix icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const center = [40.1792, 44.4991];

// Icons
const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
});
const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});
const yellowIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  iconSize: [32, 32],
});
const greenIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
});

// ROUTE FUNCTION
const getRoute = async (from, to) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.routes.length > 0) {
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }
  return [];
};

export default function App() {
  const [parkings, setParkings] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [lang, setLang] = useState("am");

  // 🌍 Languages
  const t = {
    am: {
      title: "Կայանատեղի որոնում",
      search: "Փնտրել...",
      free: "Ազատ տեղեր",
      go: "Գնալ",
      best: "Լավագույն տարբերակ",
      parked: "Կանգնել եմ",
      left: "Դուրս եմ եկել",
    },
    en: {
      title: "Parking Finder",
      search: "Search...",
      free: "Free spots",
      go: "Go",
      best: "Best option",
      parked: "Parked",
      left: "Left",
    },
    ru: {
      title: "Поиск парковки",
      search: "Поиск...",
      free: "Свободные места",
      go: "Поехать",
      best: "Лучший вариант",
      parked: "Припарковался",
      left: "Уехал",
    },
  };

  // LOAD FROM BACKEND
  useEffect(() => {
    fetch("https://smart-parking-finder-aq92.onrender.com/parkings")
      .then((res) => res.json())
      .then((data) => setParkings(data));
  }, []);

  //  USER LOCATION
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) =>
      setUserLocation([pos.coords.latitude, pos.coords.longitude])
    );
  }, []);

  //  SEARCH
  const handleSearch = async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${searchText}`
    );
    const data = await res.json();

    if (data.length > 0) {
      setSearchLocation([
        parseFloat(data[0].lat),
        parseFloat(data[0].lon),
      ]);
    }
  };

  //  BEST PARKING
  const getBestParking = () => {
    if (!searchLocation) return null;

    const available = parkings.filter((p) => p.free > 0);

    let best = null;
    let min = Infinity;

    available.forEach((p) => {
      const dist =
        (p.lat - searchLocation[0]) ** 2 +
        (p.lng - searchLocation[1]) ** 2;

      if (dist < min) {
        min = dist;
        best = p;
      }
    });

    return best;
  };

  const bestParking = getBestParking();

  // 🚗 ROUTE
  const goToParking = async (p) => {
    if (!userLocation) return;
    const r = await getRoute(userLocation, [p.lat, p.lng]);
    setRoute(r);
  };

  // 🔴 TAKE (BACKEND)
  const takeSpot = async (id) => {
    const res = await fetch(`https://smart-parking-finder-aq92.onrender.com/parkings/${id}/take`,  {
      method: "POST",
    });
    const data = await res.json();
    setParkings(data);
  };

  // 🟢 FREE (BACKEND)
  const freeSpot = async (id) => {
    const res = await fetch(`https://smart-parking-finder-aq92.onrender.com/parkings/${id}/free`, {
      method: "POST",
    });
    const data = await res.json();
    setParkings(data);
  };

  return (
    <div className="phone">
      <div className="phone-content">

        {/* TOP */}
        <div className="top">
          <h2>{t[lang].title}</h2>
          <div>
            <button onClick={() => setLang("am")}>🇦🇲</button>
            <button onClick={() => setLang("en")}>🇬🇧</button>
            <button onClick={() => setLang("ru")}>🇷🇺</button>
          </div>
        </div>

        {/* SEARCH */}
        <div>
          <input
            value={searchText}
            placeholder={t[lang].search}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button onClick={handleSearch}>🔍</button>
        </div>

        {/* MAP */}
        <div style={{ height: "300px", marginTop: "10px" }}>
          <MapContainer center={center} zoom={14} style={{ height: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* USER */}
            {userLocation && (
              <Marker position={userLocation} icon={greenIcon}>
                <Popup>You are here</Popup>
              </Marker>
            )}

            {/* SEARCH */}
            {searchLocation && (
              <Marker position={searchLocation} icon={yellowIcon}>
                <Popup>Search location</Popup>
              </Marker>
            )}

            {/* PARKINGS */}
            {parkings.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={p.free > 0 ? blueIcon : redIcon}
              >
                <Popup>
                  <b>{p.name}</b>
                  <br />
                  {t[lang].free}: {p.free}
                  <br />

                  <button onClick={() => goToParking(p)}>
                    {t[lang].go}
                  </button>

                  <br />

                  <button
                    onClick={() => takeSpot(p.id)}
                    disabled={p.free === 0}
                  >
                    🚗 {t[lang].parked}
                  </button>

                  <button onClick={() => freeSpot(p.id)}>
                    ✅ {t[lang].left}
                  </button>
                </Popup>
              </Marker>
            ))}

            {/* BEST */}
            {bestParking && (
              <Marker
                position={[bestParking.lat, bestParking.lng]}
                icon={yellowIcon}
              >
                <Popup>
                  ⭐ {t[lang].best}: {bestParking.name}
                </Popup>
              </Marker>
            )}

            {/* ROUTE */}
            {route.length > 0 && (
              <Polyline positions={route} color="purple" />
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}