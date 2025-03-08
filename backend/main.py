import Millennium, PluginUtils
import requests
import json
import shutil
import os

Console = PluginUtils.Logger("[CSStats]")

http_headers = {
    "Accept": "application/json",
    "Authorization": "Bearer 8f9985f3-3cf5-43de-970c-dfe244a57fb0"
}


def get_faceit_user(steamId: str):
    url = f"https://open.faceit.com/data/v4/players?game=cs2&game_player_id={steamId}"
    try:
        response = requests.get(url, headers=http_headers)
        response.raise_for_status()
    except requests.RequestException as e:
        return json.dumps({
            "success":          False,
        })
    if response.status_code == 404:
        return json.dumps({
            "success":          False,
        })
    elif response.status_code != 200:
        raise Exception(f"Error fetching data: {response.status_code}")

    data = response.json()

    return json.dumps({
        "success":          True,
        "id":               data.get("player_id", ""),
        "nickname":         data.get("nickname", "Unknown"),
        "country_code":     data.get("country", "Unknown"),
        "avatar_url":       data.get("avatar", ""),
        "cover_url":        data.get("cover_image", "https://cdn-frontend.faceit-cdn.net/web-next/_next/static/media/faceit_assets_images_profile_header.jpg"),
        "elo":              data.get("games", {}).get("cs2", {}).get("faceit_elo", 0),
        "level":            data.get("games", {}).get("cs2", {}).get("skill_level", 0)
    })

def get_faceit_stats(steamId: str):
    url = f"https://open.faceit.com/data/v4/players/{steamId}/stats/cs2"
    try:
        response = requests.get(url, headers=http_headers)
        response.raise_for_status()
    except requests.RequestException as e:
        return json.dumps({
            "success":          False,
        })
    if response.status_code == 404:
        return json.dumps({
            "success":          False,
        })
    elif response.status_code != 200:
        raise Exception(f"Error fetching data: {response.status_code}")

    data = response.json()
    global_stats = data.get("lifetime", {})
    return json.dumps({
        "success":          True,
        "matches":          int(global_stats.get("Matches", 0)),
        "avg_hs":           float(global_stats.get("Average Headshots %", 0.0)),
        "avg_kd":           float(global_stats.get("Average K/D Ratio", 0.0)),
        "adr":              float(global_stats.get("ADR", 0.0)),
        "winrate":          float(global_stats.get("Win Rate %", 0.0)),
        "history":           global_stats.get("Recent Results", [])
    })

def get_leetify_stats(steamId: str):
    url = f"https://api.cs-prod.leetify.com/api/mini-profiles/{steamId}"
    try:
        response = requests.get(url, headers=http_headers)
        response.raise_for_status()
    except requests.RequestException as e:
        return json.dumps({
            "success":          False,
        })
    if response.status_code == 404:
        return json.dumps({
            "success":          False,
        })
    elif response.status_code != 200:
        raise Exception(f"Error fetching data: {response.status_code}")

    data = response.json()
    ratings = data.get("ratings", {})
    rankdata = data.get("primaryRank", {})
    if rankdata.get("type") == "premier":
        cs_rating = rankdata.get("skillLevel")
    else:
        cs_rating = False

    return json.dumps({
        "success":      True,
        "aim":          ratings.get("aim", 0.0),
        "utility":      ratings.get("utility", 0.0),
        "positioning":  ratings.get("positioning", 0.0),
        "leetify":      ratings.get("leetify", 0.0),
        "ctLeetify":    ratings.get("ctLeetify", 0.0),
        "tLeetify":     ratings.get("tLeetify", 0.0),
        "cs_rating":    cs_rating,
    })


def get_plugin_folder():
    return os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..'))

class Plugin:
    def install_assets(self):
        style_file = os.path.join(get_plugin_folder(), 'assets', 'style.css')
        assets_folder = os.path.join(get_plugin_folder(), 'assets')
        png_source = [p for p in os.listdir(assets_folder) if p.endswith('.png')]
        fonts_source = [f for f in os.listdir(assets_folder) if f.endswith('.ttf')]

        steamui_folder = os.path.join(Millennium.steam_path(), 'steamui')
        csstats_folder = os.path.join(steamui_folder, 'cs_stats')
        os.makedirs(csstats_folder, exist_ok=True)
        try:
            if os.path.exists(style_file):
                shutil.copy(style_file, steamui_folder)
                print(f'Copied {style_file} to {steamui_folder}')
            else:
                print(f'File not found: {style_file}')
            
            for image in png_source:
                png_file_path = os.path.join(assets_folder, image)
                if os.path.exists(png_file_path):
                    shutil.copy(png_file_path, csstats_folder)
                    print(f'Copied {png_file_path} to {csstats_folder}')
                else:
                    print(f'File not found: {png_file_path}')

            for font in fonts_source:
                font_path = os.path.join(assets_folder, font)
                if os.path.exists(font_path):
                    shutil.copy(font_path, csstats_folder)
                    print(f'Copied {font_path} to {csstats_folder}')
                else:
                    print(f'File not found: {font_path}')
                    
        except Exception as e:
            print(f'Error: {e}')
            Console.log(f"Bootstrapping FaceItStats, Millennium {e}")
    

    def _front_end_loaded(self):
        Console.log("The front end has loaded!")

    def _load(self):     
        Console.log(f"Bootstrapping FaceItStats, Millennium {Millennium.version()}")
        
        self.install_assets()
        
        Millennium.add_browser_css("style.css")
        Millennium.ready()

    def _unload(self):
        Console.log("Unloading")
