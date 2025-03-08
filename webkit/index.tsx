/**
 * You have a limited version of the Millennium API available to you in the webkit context.
 */
type Millennium = {
    /**
     * Call a function in the backend (python) of your plugin
     * @param methodName a public static method declared and defined in your plugin backend (python)
     * @param kwargs an object of key value pairs that will be passed to the backend method. accepted types are: string, number, boolean
     * @returns string | number | boolean
     */
    callServerMethod: (methodName: string, kwargs?: any) => Promise<any>,
    /**
     * Async wait for an element in the document using DOM observers and querySelector
     * @param privateDocument document object of the webkit context
     * @param querySelector the querySelector string to find the element (as if you were using document.querySelector)
     * @param timeOut If the element is not found within the timeOut, the promise will reject
     * @returns 
     */
    findElement: (privateDocument: Document,  querySelector: string, timeOut?: number) => Promise<NodeListOf<Element>>,
};

declare const Millennium: Millennium;

export default async function WebkitMain() {
    
    const side_bar = await Millennium.findElement(document, '.profile_rightcol');
    if (side_bar.length) {

        const statsHTML = document.createElement("div");
        statsHTML.innerHTML = 
        `
            <div class="container ">
                <!-- START FACEIT BANNER -->
                <div class="header_row">
                    <div class="header_banner" style="display:none;center;background-size: cover;">
                    <div class="country">
                        <img id="country_url" src="">
                    </div>
                    <div class="user_row">
                        <div class="user_image" style="center;background-size:contain;"></div>
                        <div class="user_nickname">
                            <h1 id="nickname">MAJID</h1>
                        </div>
                    </div>
                </div>
                <!-- START ACCOUNT INFO -->
                <div class="card steam">
                    <h4>Steam</h4>
                    <div class="card_content loading" id="steam_card">
                        <div class="loader"></div>
                    </div>
                </div>
                <!-- END ACCOUNT INFO -->
                <!-- START FACEIT STATS -->
                <div class="card faceit">
                    <h4>Faceit</h4>
                    <div class="card_content loading" id="faceit_card">
                        <div class="loader"></div>
                    </div>
                </div>
                <!-- END FACEIT STATS -->
                <!-- START LEETIFY STATS -->    
                <div class="card leetify">
                    <h4>Leetify</h4>
                    <div class="card_content loading"  id="leetify_card">
                        <div class="loader"></div>
                    </div>
                </div>
                <!-- END LEETIFY STATS -->

                </div>
            </div>
        `
        side_bar[0].insertBefore(statsHTML, side_bar[0].children[1]);
        
        const Parser                    = new DOMParser();
        const user_steam_profil         = `${window.location.href}/?xml=1`;
        const user_steam_profil_as_data = await fetch(user_steam_profil);
        const user_steam_profil_as_text = await user_steam_profil_as_data.text();
        const user_steam_profil_as_xml  = Parser.parseFromString(user_steam_profil_as_text, "application/xml");

        let steam_user: Map<string, any>;
        steam_user = new Map<string, any>();

        steam_user.set("steam_id",          user_steam_profil_as_xml.querySelector("steamID64").textContent);
        steam_user.set("created_at",        user_steam_profil_as_xml.querySelector("memberSince")?.textContent || "N/A");
        steam_user.set("is_vacbanned",      parseInt(user_steam_profil_as_xml.querySelector("vacBanned")?.textContent || "0", 10) > 0);
        steam_user.set("is_tradebanned",    user_steam_profil_as_xml.querySelector("tradeBanState").textContent !== "None");
        steam_user.set("is_limited",        parseInt(user_steam_profil_as_xml.querySelector("isLimitedAccount")?.textContent || "0", 10) > 0);
        steam_user.set("is_public",         user_steam_profil_as_xml.querySelector("privacyState")?.textContent === "public");

        if(steam_user.get("is_public")){
            const user_steam_games         = `${window.location.href}/games?tab=all&xml=1`;
            const user_steam_games_as_data = await fetch(user_steam_games);
            const user_steam_games_as_text = await user_steam_games_as_data.text();
            const user_steam_games_as_xml  = Parser.parseFromString(user_steam_games_as_text, "application/xml");

            const user_as_cs = Array.from(user_steam_games_as_xml.querySelectorAll("game")).find(g => g.querySelector("appID")?.textContent === "730");
    
            steam_user.set("has_cs", user_as_cs)
            steam_user.set("cs_hours", user_as_cs ? user_as_cs.querySelector("hoursOnRecord")?.textContent || "0" : "0");
            steam_user.set("cs_hours_lastweeks", user_as_cs ? user_as_cs.querySelector("hoursLast2Weeks")?.textContent || "0" : "0");
        }
        
        let html_steamcard = document.querySelector<HTMLElement>('#steam_card')
        html_steamcard.classList.remove("loading")
        html_steamcard.innerHTML = 
        `
            <div>Created </br>Total Hours</br>Last weeks</br>Vac</br>Trade </br>Restricted</div>
            <div>${ steam_user.get("is_public") ? steam_user.get("created_at") : "Private" } </br>
                 ${ steam_user.get("is_public") && steam_user.get("has_cs") ? steam_user.get("cs_hours") + " hrs" : "Private" } </br>
                 ${ steam_user.get("is_public") && steam_user.get("has_cs") ? steam_user.get("cs_hours_lastweeks") + " hrs" : "Private" } </br>
                 ${ steam_user.get("is_vacbanned") ? "Banned": "OK"}</br>
                 ${ steam_user.get("is_tradebanned") ? "Banned": "OK"}</br>
                 ${ steam_user.get("is_limited") ? "Limited" : "OK"}
            </div>
        ` 

        let faceit_data: Map<string, any>;
        faceit_data = new Map<string, any>();

        faceit_data.set("has_faceit", false)

        const faceit_user_data = await Millennium.callServerMethod("get_faceit_user", { steamId: steam_user.get("steam_id")  })
        const faceit_user      = JSON.parse(faceit_user_data);
        
        const Faceit_ranks: { [key: number]: [number, number, string] } = {
            1: [100, 500, "#dddddd"],
            2: [501, 750, "#47e36e"],
            3: [751, 900, "#47e36e"],
            4: [901, 1050, "#ffcd25"],
            5: [1051, 1200, "#ffcd25"],
            6: [1201, 1350, "#ffcd25"],
            7: [1351, 1530, "#ffcd25"],
            8: [1531, 1750, "#ff6c20"],
            9: [1751, 2000, "#ff6c20"],
            10: [2001, 2001, "#cd0325"]
        };
        
        function get_faceit_color(rank: number, elo: number): { progressValue?: number; progressColor?: string } {
            let progressValue: number;
            let progressColor: string;
        
            if (rank === 10) {
                progressValue = 100;
                progressColor = Faceit_ranks[rank][2];
            } 
            else {
                progressColor = Faceit_ranks[rank][2];
                progressValue = 100 - ((Faceit_ranks[rank][1] - elo) / (Faceit_ranks[rank][1] - Faceit_ranks[rank][0])) * 100;
            }
            return { progressValue, progressColor };
        }


        if(faceit_user["success"]){
            faceit_data.set("has_faceit",     true)
            faceit_data.set("faceit_id",      faceit_user['id'])
            faceit_data.set("nickname",       faceit_user['nickname'])
            faceit_data.set("country_code",   faceit_user['country_code'])
            faceit_data.set("avatar_url",     faceit_user['avatar_url'])
            faceit_data.set("cover_url",      faceit_user['cover_url'])
            faceit_data.set("elo",            faceit_user['elo'])
            faceit_data.set("level",          faceit_user['level'])
            
            const faceit_user_stats_data = await Millennium.callServerMethod("get_faceit_stats", { steamId: faceit_data.get("faceit_id") })
            const faceit_user_stats = JSON.parse(faceit_user_stats_data);

            faceit_data.set("matches",    faceit_user_stats["matches"])
            faceit_data.set("avg_hs",     faceit_user_stats["avg_hs"])
            faceit_data.set("avg_kd",     faceit_user_stats["avg_kd"])
            faceit_data.set("adr",        faceit_user_stats["adr"])
            faceit_data.set("winrate",    faceit_user_stats["winrate"])
            faceit_data.set("history",    faceit_user_stats["history"])
        }



        let html_faceitcard = document.querySelector<HTMLElement>('#faceit_card')

        if (faceit_data.get("has_faceit")){

            let html_match_history: string
            html_match_history = ""
            for (const match of faceit_data.get("history")) {
                if(match == 1){
                    html_match_history += "<div class=\"match\"><CSW></CSW></div>"
                }
                else{
                    html_match_history += "<div class=\"match\"><CSL></CSL></div>"
                }
            }

            
            let progressbar_data = get_faceit_color(faceit_data.get("level"), faceit_data.get("elo"))

            let header_banner = document.querySelector<HTMLElement>('.header_banner')
            header_banner.style.backgroundImage = "url(" + faceit_data.get("cover_url") +")";

            let country_element = document.querySelector<HTMLImageElement>("#country_url")
            country_element.src = "https://flagsapi.com/"+faceit_data.get("country_code").toUpperCase()+"/flat/32.png"

            let nickname_element = document.querySelector<HTMLElement>('#nickname')
            nickname_element.innerText = faceit_data.get("nickname")


            let user_image = document.querySelector<HTMLElement>('.user_image')
            user_image.style.backgroundImage = "url(" + faceit_data.get("avatar_url") +")";
            header_banner.style.display = "block"

            html_faceitcard.classList.remove("loading")
            html_faceitcard.innerHTML = 
            `
                <div class="col">
                    <div>K/D</br>ADR</br>HS</div>
                    <div>${faceit_data.get("avg_kd")} </br>${faceit_data.get("adr")} </br>${faceit_data.get("avg_hs")}</div>
                </div>
                <div class="col">
                    <div>Matches</br>Win </br>Elo</br></div>
                    <div>${faceit_data.get("matches")} </br>${faceit_data.get("winrate")} </br>${faceit_data.get("elo")}</div>
                </div>
            `
            html_faceitcard.parentElement.innerHTML += 
            `
                <div class="footer">
                    <div class="col">
                        <img src="https://steamloopback.host/cs_stats/skill_level_${faceit_data.get("level")}_lg.png" alt="">
                    </div>
                    <div class="col">
                        <div class="progress_bar">
                            <div class="color" style="width: ${progressbar_data.progressValue}%;background-color: ${progressbar_data.progressColor};"></div>
                        </div>
                    </div>
                </div>
                <div class="games">
                    ${html_match_history}
                </div>
            `
        }
        else{
            html_faceitcard.classList.remove("loading")
            html_faceitcard.classList.add("notfound")
            html_faceitcard.innerHTML = "Account not found"
        }
        

        let leetify_data: Map<string, any>;
        leetify_data = new Map<string, any>();

        leetify_data.set("has_leetify", false)

        const leetify_user_data = await Millennium.callServerMethod("get_leetify_stats", { steamId: steam_user.get("steam_id")  })
        const leetify_user      = JSON.parse(leetify_user_data);
        
        function get_progressbar_color(skillvalue: number){
            if(skillvalue >= 70){
                return "#227500";
            }
            else if(skillvalue >= 30){
                return "#b96116";
            }
            else{
                return "#b91616";
            } 
        }


        if(leetify_user["success"]){
            leetify_data.set("has_leetify",   true)
            leetify_data.set("aim",           leetify_user["aim"])
            leetify_data.set("utility",       leetify_user["utility"])
            leetify_data.set("positioning",   leetify_user["positioning"])
            leetify_data.set("leetify",       leetify_user["leetify"])
            leetify_data.set("ctleetify",     leetify_user["ctLeetify"])
            leetify_data.set("tleetify",      leetify_user["tLeetify"])
            leetify_data.set("cs_rating",      leetify_user["cs_rating"])
        }

        const Premier_Tiers: { [key: number]: [number, number] } = {
            0: [0, 4999],
            1: [5000, 9999],
            2: [10000, 14999],
            3: [15000, 19999],
            4: [20000, 24999],
            5: [25000, 29999],
            6: [30000, 99999]
        };

        function get_premier_tier(cs_rating: number){
            for (let i = 0; i <= 6; i++) {
                if(cs_rating >= Premier_Tiers[i][0] && cs_rating <= Premier_Tiers[i][1]){
                    return i
                }
            }
        }


        let html_leetifycard = document.querySelector<HTMLElement>('#leetify_card')
        
        if (leetify_data.get("has_leetify")){

            if(leetify_data.get("cs_rating")){
                var cs_rating_tier = get_premier_tier(leetify_data.get("cs_rating"))
                var cs_rating_nb = leetify_data.get("cs_rating").toLocaleString("EN").split(",")
            }

            html_leetifycard.classList.remove("loading")
            html_leetifycard.innerHTML = 
            `
            <div class="col">
                <div>AIM</br>Utility</br>Positioning</br></div>
            </div>
            <div class="col">
                <div class="progress_bar">
                    <div class="color" style="width:${leetify_data.get("aim")}%;background-color: ${get_progressbar_color(leetify_data.get("aim"))}"></div>
                </div>
                <div class="progress_bar">
                    <div class="color" style="width:${leetify_data.get("utility")}%;background-color: ${get_progressbar_color(leetify_data.get("utility"))}"></div>
                </div>
                <div class="progress_bar">
                    <div class="color" style="width:${leetify_data.get("positioning")}%;background-color: ${get_progressbar_color(leetify_data.get("positioning"))}"></div>
                </div>
            </div>
            ` 
            html_leetifycard.parentElement.innerHTML += 
            `
                <div class="footer">

                    <div class="rank_box" style="${leetify_data.get("cs_rating") ? "display:flex" : "display:none"}">
                        <div class="col">
                            Premier Rank
                        </div>
                        <div class="col">
                            <div class="cs_rank tier-${cs_rating_tier}">
                                <svg viewBox="0 0 17 32">
                                    <path d="M5.44 2.13A2.6 2.6 0 0 1 7.99 0h1.86a.6.6 0 0 1 .6.7L4.83 31.5a.6.6 0 0 1-.6.5h-2.3c-1 0-1.76-.9-1.58-1.89l5.1-27.98ZM11.82.99c.1-.57.6-.99 1.18-.99h2.93a.6.6 0 0 1 .59.7l-5.4 30.31c-.1.57-.6.99-1.18.99H7a.6.6 0 0 1-.59-.7L11.82.98Z"></path>
                                </svg>
                                <div class="box">
                                ${leetify_data.get("cs_rating") ? `${cs_rating_nb[0]},<span class="sub">${cs_rating_nb[1]}</span>` : ""}
                                </div>
                            </div>
                        </div>
                    </div>


                    <div class="col">
                        <img src="https://steamloopback.host/cs_stats/mix.png" alt="">
                    </div>
                    <div class="col">
                        <img src="https://steamloopback.host/cs_stats/ct.png" alt="">
                    </div>
                    <div class="col">
                        <img src="https://steamloopback.host/cs_stats/t.png" alt="">
                    </div>
                    <div class="col">
                    ${(leetify_data.get("leetify") *100).toFixed(2) }
                    </div>
                    <div class="col">
                    ${(leetify_data.get("ctleetify")*100).toFixed(2) }
                    </div>
                    <div class="col">
                    ${(leetify_data.get("tleetify")*100).toFixed(2) }
                    </div>
                </div>
            `
        }
        else{
            html_leetifycard.classList.remove("loading")
            html_leetifycard.classList.add("notfound")
            html_leetifycard.innerHTML = "Account not found"
        }

        

    }

}