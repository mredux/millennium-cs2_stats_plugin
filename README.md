# CS2 Stats plugin 🚀

Based on work of [Alowave](https://github.com/alowave/millennium-faceit-stats), i did a more complet plugin for [Millenium](https://github.com/shdwmtr/millennium). This plugin adds a widget to profiles of people you visit.
it work on steam overlay too, for fast checking on ranked games.


![drawing](https://i.imgur.com/TxHtasb.png)

### Steam data
* Account creation date
* Total CS2 hours
* Last 2 weeks CS2 hours
* Vac Status
* Trade status
* Account Restriction status

### FaceIt data
* K/D
* ADR
* HS %
* Matchs count
* Wins
* Elo
* 5 last matchs

### Leetify data
* Aim %
* Utility %
* Positionning %
* Premier Rank
* Leetify global Rating
* Leetify CT Rating
* Leetify T Rating

## Installation 🚀
* Download the latest release from the plugin page from release page 
* copy/past content of zip archive inside your plugin folder 
* turn on plugin on steam settings 
* Enjoy 

## Build from sources 🚀
Clone this repository:
```bash
git clone https://github.com/mredux/millennium-cs2_stats_plugin
cd millennium-cs2_stats_plugin
pnpm install
```
Build
```bash
pnpm run build
```
move the plugin to your **plugins directory** and activate it in steam settings
