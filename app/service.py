import requests
import json
import os

CACHE_PATH = "data/solar_data.geojson"
# <Name>ua_solaranlagen_pv:f_sp08_09_1pvsummebez</Name>
# <Title>Installierte Leistung der Photovoltaikanlagen pro Bezirk [MWp]</Title>
# <Abstract>Summe der installierten Leistung der geförderten PV-Anlagen, aggregiert auf Bezirke und unterteilt in drei Leistungsklassen.

WFS_URL = "https://gdi.berlin.de/services/wfs/ua_solaranlagen_pv?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TypeNames=ua_solaranlagen_pv:f_sp08_09_1pvsummebez&OUTPUTFORMAT=application/json"


def fetch_solar_data():
    # Try loading from cache
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load cache: {e}")

    # Try fetching from remote
    try:
        response = requests.get(WFS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        with open(CACHE_PATH, "w") as f:
            json.dump(data, f)

        return data

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] WFS request failed: {e}")
        return None
