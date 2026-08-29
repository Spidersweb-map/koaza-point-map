// インポート
import {initSearch, executeGeneralSearch, executeKoazaSearch, getDetailContents} from "./search.js";
import {oazaSourceTable, koazaSourceTable} from "./tables.js";
// グローバル変数
let map;
let url;
let selected;
let highlightAreaIds = [];
let SOURCE_URL = `${location.protocol}//${location.host}/${location.pathname.split("/")[1]}/src/`;
let pageName;
let basemaps = [
    {
        "name": "gsi_pale",
        "info": {
            "type": "raster",
            "tiles": ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（淡色）</a>"    
        }
    },
    {
        "name": "gsi_std",
        "info": {
            "type": "raster",
            "tiles": ["https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（標準）</a>"    
        }
    },
    {
        "name": "gsi_seamless",
        "info": {
            "type": "raster",
            "tiles": ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
            "tileSize": 256,
            "attribution": "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>最新写真</a>"    
        }
    },
    {
        "name": "osm_raster",
        "info": {
            "type": "raster",
            "tiles": ["https://tile.openstreetmap.jp/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "<a href='https://www.openstreetmap.org/copyright' target='_blank'>&copy; OpenStreetMap</a>"    
        }
    }

];
let customLayers = [
    {
        "name": "city_polygon",
        "source": {
            "type": "vector",
            "tiles": ["multi-pmtiles://" + SOURCE_URL + "tiles/city_polygon.pmtiles/{z}/{x}/{y}"],
            maxzoom: 8
        },
        "layers": [
            {
                "id": "city_area", 
                "type": "fill",
                "source": "city_polygon",
                "source-layer": "city_polygon",
                "layout": {},
                "paint": {
                    "fill-color": ["get", "color"],
                    "fill-opacity": 0.2
                },
                minzoom: 4,
                maxzoom: 9
            },
            {
                "id": "city_line", 
                "type": "line",
                "source": "city_polygon",
                "source-layer": "city_polygon",
                "layout": {},
                "paint": {
                    "line-color": "#000000",
                    "line-width": ['interpolate', ['exponential', 2], ['zoom'], 10, 2, 20, 80],
                "line-opacity": 0.2 * 0.2
                },
                minzoom: 4,
                maxzoom: 9
            }
        ]
    },
    {
        "name": "oaza_polygon",
        "source": {
            "type": "vector",
            "tiles": ["multi-pmtiles://" + SOURCE_URL + "tiles/oaza_polygon.pmtiles/{z}/{x}/{y}"],
            maxzoom: 14
        },
        "layers": [
            {
                "id": "oaza_area", 
                "type": "fill",
                "source": "oaza_polygon",
                "source-layer": "oaza_polygon",
                "layout": {},
                "paint": {
                    "fill-color": ["get", "color"],
                    "fill-opacity": 0.2
                },
                minzoom: 9,
                maxzoom: 17
            },
            {
                "id": "oaza_line", 
                "type": "line",
                "source": "oaza_polygon",
                "source-layer": "oaza_polygon",
                "layout": {},
                "paint": {
                    "line-color": "#000000",
                    "line-width": ['interpolate', ['exponential', 2], ['zoom'], 10, 2, 20, 80],
                "line-opacity": 0.2 * 0.2
                },
                minzoom: 11,
                maxzoom: 17
            }
        ]
    },
    {
        "name": "koaza_label",
        "source": {
            "type": "vector",
            "tiles": ["multi-pmtiles://" + SOURCE_URL + "tiles/koaza.pmtiles/{z}/{x}/{y}"],
            maxzoom: 14
        },
        "layers": [{
            "id": "koaza_label",
            "type": "symbol",
            "source": "koaza_label",
            "source-layer": "koaza",
            "layout": {
                "text-field": ['get', 'KoazaName'],
                "text-font": ["Noto Sans CJK JP Regular"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    11, 8,
                    14, 14,
                    18, 16
                ], 
                "text-allow-overlap": true,
                "text-anchor": "center",
                "text-line-height": 1.0
            },
            "paint": {
                "text-color": ["get", "color"],
                "text-halo-color": "rgba(255,255,255,0.9)", 
                "text-halo-width": 1.8,
                "text-opacity": 0.9,
            },
            minzoom: 11,
            maxzoom: 17,
        }]
    },
    {
        "name": "oaza_label",
        "source": {
            "type": "vector",
            "tiles": ["multi-pmtiles://" + SOURCE_URL + "tiles/oaza.pmtiles/{z}/{x}/{y}"],
            maxzoom: 14
        },
        "layers": [{
            "id": "oaza_label",
            "type": "symbol",
            "source": "oaza_label",
            "source-layer": "oaza",
            "layout": {
                "text-field": ['get', 'OazaName'],
                "text-font": ["Noto Sans CJK JP Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    11, 12,
                    14, 18,
                    18, 22
                ], 
                "text-allow-overlap": true,
                "text-anchor": "center",
                "text-line-height": 1.0
            },
            "paint": {
                "text-color": ["get", "color"],
                "text-halo-color": "rgba(255,255,255,0.9)", 
                "text-halo-width": 1.8,
                "text-opacity": 0.5,
            },
            minzoom: 9,
            maxzoom: 17
        }]
    },
    {
        "name": "city_label",
        "source": {
            "type": "vector",
            "tiles": ["multi-pmtiles://" + SOURCE_URL + "tiles/city.pmtiles/{z}/{x}/{y}"],
            maxzoom: 8
        },
        "layers": [{
            "id": "city_label",
            "type": "symbol",
            "source": "city_label",
            "source-layer": "city",
            "layout": {
                "text-field": ['get', 'CityName'],
                "text-font": ["Noto Sans CJK JP Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    11, 12,
                    14, 18,
                    18, 22
                ], 
                "text-allow-overlap": true,
                "text-anchor": "center",
                "text-line-height": 1.0
            },
            "paint": {
                "text-color": ["get", "color"],
                "text-halo-color": "rgba(255,255,255,0.9)", 
                "text-halo-width": 1.8,
                "text-opacity": 0.5,
            },
            minzoom: 8,
            maxzoom: 9
        }]
    }
];


let prefMap = {
    "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県", "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県", "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県", "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県", "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県", "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県", "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県", "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県", "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県", "46": "鹿児島県", "47": "沖縄県"
};


function initMap() {
    // グローバル変数
    url = new URL(window.location.href);
    pageName = "小字ポイントマップ";
    
    // パラメータ
    const params = getParams(url);
    if (!localStorage.getItem("koazaOrder")) {
        localStorage.setItem('koazaOrder', '50');
    }
    if (!localStorage.getItem("showPopup")) {
        localStorage.setItem('showPopup', 'true');
    }
    if (!localStorage.getItem("searchHighlight")) {
        localStorage.setItem('searchHighlight', 'false');
    }
    updateUIState(params);

    // PMTiles
    const protocol = new pmtiles.Protocol();
    const urlConvert = (url) => {
        // convert url
        let newUrl = "";
        const match = url.match(/\/([^/]+\.pmtiles)\/(\d+)\/(\d+)\/(\d+)$/);
        switch(match[1]) {
            case "oaza_polygon.pmtiles":
                if (Number(match[2]) < 13) {
                    newUrl = url.replace(".pmtiles/", "_0912.pmtiles/");
                } else {
                    newUrl = url.replace(".pmtiles/", "_1314.pmtiles/");
                }
                break;
            case "oaza.pmtiles":
                if (Number(match[2]) < 11) {
                    newUrl = url.replace(".pmtiles/", "_0910.pmtiles/");
                } else {
                    newUrl = url.replace(".pmtiles/", "_1114.pmtiles/");
                }
                break;
            case "koaza.pmtiles":
                if (Number(match[2]) < 13) {
                    newUrl = url.replace(".pmtiles/", "_1112.pmtiles/");
                } else {
                    newUrl = url.replace(".pmtiles/", "_1314.pmtiles/");
                }
                break;
            default:
                newUrl = url;
        }
        return newUrl;
    }
    const myProtocol = (param, callback) => {
        // console.log(param);
        param.url = urlConvert(param.url);
        return protocol.tile(param, callback);
    }
    maplibregl.addProtocol("multi-pmtiles", myProtocol);
    
    map = new maplibregl.Map({
        container: 'map',
        style:{version: 8, sources: {}, layers: []},
        center: [params.lng, params.lat],
        zoom: params.zm,
        maxZoom: 16.99,
        localIdeographFontFamily: ['sans-serif'] // ローカルフォントで日本語表示
    });
    
    // コントロール
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({
        positionOptions: {enableHighAccuracy: true}, 
        trackUserLocation: true 
    }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left');
    
    // ロード
    map.on('load', () => {
        loadLayers(params);
        updateURLHash(params);
        setMapHighlight(localStorage.getItem("searchHighlight") === "true");
    });
    
    // 移動・ズーム
    map.on('moveend', updateURLHash);
    map.on('zoomend', updateURLHash);
    
    map.on('click', (e) => {
        if (
            document.getElementById("search-menu-container").classList.contains('active')
            || document.getElementById("settings-container").classList.contains('active')
        ) {return;}
        
        const features = map.queryRenderedFeatures(e.point);
        if (features.length === 0) return;
        selected = features[0];
        // ポップアップ
        if (document.querySelector(".popup-option").classList.contains('selected')) {
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(getPopupContent(selected))
                .addTo(map);               
        }
        // データパネル
        openDetailPanel();
    });
    
    // UI
    document.getElementById('search-menu').addEventListener('click', () => {handleExpandSearchMenu();})
    document.getElementById('search-target-general').addEventListener('change', () => {updateTargetSelection(false);})
    document.getElementById('search-target-koaza').addEventListener('change', () => {updateTargetSelection(true);})
    document.getElementById('settings').addEventListener('click', () => {handleExpandSettings();})
    document.querySelectorAll(".base-option").forEach(el => {
        el.addEventListener("click", () => handleMapSelect(el));
    });
    document.getElementById("opacityBase").addEventListener("input", e => handleOpacityBaseChange(e.target.value));
    document.getElementById("saturationBase").addEventListener("input", e => handleSatBaseChange(e.target.value));
    document.getElementById("opacityPolygon").addEventListener("input", e => handleOpacityPolyChange(e.target.value));
    document.getElementById("opacityOaza").addEventListener("input", e => handleOpacityOazaChange(e.target.value));
    document.getElementById("opacityKoaza").addEventListener("input", e => handleOpacityKoazaChange(e.target.value));
    document.querySelector(".popup-option").addEventListener("click", e => handlePopupChange());
    document.querySelector(".search-disp-option").addEventListener("click", e => handleSearchChange());
    document.addEventListener('click', (e) => {
        if (
            !document.getElementById("search-menu-container").contains(e.target)
            && !document.getElementById("search-menu").contains(e.target)
        ) {
            document.getElementById("search-menu-container").classList.remove('active');
        } 
        if (
            !document.getElementById("settings-container").contains(e.target)
            && !document.getElementById("settings").contains(e.target)
        ) {
            document.getElementById("settings-container").classList.remove('active');
        }
        if (
            document.querySelector("header").contains(e.target)
            && ! document.querySelector(".search-container").contains(e.target)
        ) {
            document.getElementById("search-results").style.display = 'none';
        }
    });
    document.getElementById('panel-resizer').addEventListener('mousedown', initResize, false);
    document.getElementById('panel-resizer').addEventListener('touchstart', initResize, false);
    document.querySelector('.panel-close').addEventListener('click', () => {closeDetailPanel();});
    
    // 検索
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');
    searchInput.addEventListener("input", async(e) => {
        clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
    });
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        highlightAreaIds = [];
        setMapHighlight(localStorage.getItem("searchHighlight") === "true");
        searchInput.focus();
    });
    searchForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        searchInput.blur();
        
        const query = searchInput.value.trim();
        const searchTarget = document.querySelector('input[name="search-target"]:checked').value;
        let geocodes = [];
        if (searchTarget === "general") {
            geocodes = await executeGeneralSearch(query);
        } else if (searchTarget === "koaza") {
            geocodes = await executeKoazaSearch(
                query,
                document.getElementById('koazaTouki').checked,
                document.getElementById('koazaLabel').checked,
                document.getElementById('inclOaza').checked,
                document.getElementById('allowVriants').checked,
            );
        }
        if (geocodes.length > 0) {
            renderResults(geocodes, searchTarget);    
        }
    });
}

function getPopupContent(feat) {
    const prop = feat.properties;
    if (feat.layer.id.startsWith("koaza_label")) {
        return `<div class="popup"><table class="popup-table">`
            + `<tr><th>都道府県</th><td>${prefMap[prop.CityCode.slice(0,2)]}</td></tr>`
            + `<tr><th>市区町村</th><td>${prop.CityName}</td></tr>`
            + `<tr><th>大字・町名</th><td>${prop.OazaName}</td></tr>`
            + (prop.MiddleName && prop.OazaName !== "" ? `<tr><th>（中間階層）</th><td>${prop.MiddleName}</td></tr>` : '')
            + `<tr><th>小字・丁目</th><td>${prop.KoazaName}</td></tr>`
            + `<tr><th>出典</th><td>${koazaSourceTable[prop.SourceCode] ?? '−'}</td></tr>`
            + `<tr><th>原表記</th><td>${prop.Original || '-'}</td></tr>`
    } else if (feat.layer.id.startsWith("oaza_label")) {
        return `<div class="popup"><table class="popup-table">`
            + `<tr><th>都道府県</th><td>${prefMap[prop.CityCode.slice(0,2)]}</td></tr>`
            + `<tr><th>市区町村</th><td>${prop.CityName}</td></tr>`
            + `<tr><th>大字・町名</th><td>${prop.OazaName}</td></tr>`
            + `<tr><th>出典</th><td>${oazaSourceTable[prop.SourceCode] ?? '−'}</td></tr>`
            + `</table></div>`
    } else if (feat.layer.id.startsWith("city_label")) {
        return `<div class="popup"><table class="popup-table">`
            + `<tr><th>都道府県</th><td>${prefMap[prop.CityCode.slice(0,2)]}</td></tr>`
            + `<tr><th>市区町村</th><td>${prop.CityName}</td></tr>`
            + `<tr><th>市区町村コード</th><td>${prop.CityCode}</td></tr>`
            + `</table></div>`
    } else if (feat.layer.id.startsWith("oaza_area")) {
        return `<div class="popup"><table class="popup-table">`
            + `<tr><th>都道府県</th><td>${prefMap[prop.AreaId.slice(0,2)]}</td></tr>`
            + `<tr><th>市区町村</th><td>${prop.CityName}</td></tr>`
            + `<tr><th>大字・町名</th><td>${prop.AreaId.slice(5)}</td></tr>`
            + `</table></div>`
    } else if (feat.layer.id.startsWith("city_area")) {
        return `<div class="popup"><table class="popup-table">`
            + `<tr><th>都道府県</th><td>${prefMap[prop.CityCode.slice(0,2)]}</td></tr>`
            + `<tr><th>市区町村</th><td>${prop.CityName}</td></tr>`
            + `<tr><th>コード</th><td>${prop.CityCode}</td></tr>`
            + `</table></div>`
    }
}


function getParams(url) {
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/');
    const defaultObj = {
        zm: 12, 
        lat: 35.541677, 
        lng: 139.437500, 
        base: 'gsi_pale', 
        opBase: 50,
        satBase: 0,
        opPoly: 80,
        opOaza: 50,
        opKoaza: 10
    }
    if (parts.length === Object.keys(defaultObj).length) {
        return {
            zm: parseFloat(parts[0]), 
            lat: parseFloat(parts[1]), 
            lng: parseFloat(parts[2]),
            base: parts[3],
            opBase: parseFloat(parts[4]),
            satBase: parseFloat(parts[5]),
            opPoly: parseFloat(parts[6]),
            opOaza: parseFloat(parts[7]),
            opKoaza: parseFloat(parts[8]),
        };
    } else {
        return defaultObj;
    }
};


function updateURLHash() {
    const center = map.getCenter();
    const selected = document.querySelector('.base-option.selected');
    const base = selected ? selected.dataset.key : 'gsi_pale';
    const opBase = document.getElementById('opacityBase').value;
    const satBase = document.getElementById('saturationBase').value;
    const opPoly = document.getElementById('opacityPolygon').value;
    const opOaza = document.getElementById('opacityOaza').value;
    const opKoaza = document.getElementById('opacityKoaza').value;
    const newHash = `#${map.getZoom().toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}/${base}/${opBase}/${satBase}/${opPoly}/${opOaza}/${opKoaza}`;
    window.history.replaceState(null, '', newHash);
}


async function loadLayers(params) {
    basemaps.forEach((layer) => {
        map.addSource(layer.name, layer.info);
        map.addLayer({
            id: layer.name,
            type: layer.info.type,
            source: layer.name,
            layout: {"visibility": layer.name === params.base ? "visible" : "none"},
            paint: {"raster-opacity": 1 - params.opBase / 100, "raster-saturation": params.satBase / 100},
            minzoom: 1,
            maxzoom: 18
        });
    });
    customLayers.forEach((layer) => {
        map.addSource(layer.name, layer.source);
        layer.layers.forEach((l) => map.addLayer(l));
    });
    map.setPaintProperty("city_area", 'fill-opacity', 1 - params.opPoly / 100);
    map.setPaintProperty("oaza_area", 'fill-opacity', 1 - params.opPoly / 100);
    map.setPaintProperty("oaza_line", 'line-opacity', (1 - params.opPoly / 100) * 0.2);
    map.setPaintProperty("city_label", 'text-opacity', 1 - params.opOaza / 100);
    map.setPaintProperty("oaza_label", 'text-opacity', 1 - params.opOaza / 100);
    map.setPaintProperty("koaza_label", 'text-opacity', 1 - params.opKoaza / 100);
}


function updateUIState(params) {
    // 背景地図
    document.querySelectorAll('.base-option').forEach(el => {
        if (el.dataset.key === params.base) {
            el.classList.add('selected')
        }
    });
    // 透明度
    document.getElementById('opacityBase').value = params.opBase;
    document.getElementById('opacityPolygon').value = params.opPoly;
    document.getElementById('opacityOaza').value = params.opOaza;
    document.getElementById('opacityKoaza').value = params.opKoaza;
    // 彩度
    document.getElementById('saturationBase').value = params.satBase;
    // 検索設定
    const savedSettings = localStorage.getItem('mapSearchSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        updateTargetSelection(settings.isKoaza);
    }
    // ラベル設定
    const showPopup = localStorage.getItem('showPopup') === "true";
    document.querySelector('.popup-option').classList.toggle('selected', showPopup);
    const searchHighlight = localStorage.getItem('searchHighlight') === "true";
    document.querySelector('.search-disp-option').classList.toggle('selected', searchHighlight);
    
    // モーダル
    const modal = document.getElementById('info-modal');
    const infoBtn = document.getElementById('info-btn');
    const closeBtn = document.getElementById('modal-close-btn');
    if (!localStorage.getItem('hasVisited')) {
        modal.classList.add('active');
        localStorage.setItem('hasVisited', 'true');
    }
    infoBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}


function handleExpandSettings() {
    document.getElementById('settings-container').classList.toggle('active');  
}


function handleExpandSearchMenu() {
    document.getElementById('search-menu-container').classList.toggle('active');  
}


function handleMapSelect(element) {
    basemaps.forEach((layer) => {
        map.setLayoutProperty(layer.name, 'visibility', layer.name === element.dataset.key ? 'visible' : 'none'); 
    });
    document.querySelectorAll('.base-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    setTimeout(updateURLHash, 200);
}


function handleOpacityBaseChange(val) {
    basemaps.forEach((layer) => {
        map.setPaintProperty(layer.name, 'raster-opacity', 1 - val / 100);
    });
    setTimeout(updateURLHash, 200);
}

function handleSatBaseChange(val) {
    basemaps.forEach((layer) => {
        map.setPaintProperty(layer.name, 'raster-saturation', val / 100);
    });
    setTimeout(updateURLHash, 200);
}
    
function handleOpacityPolyChange(val) {
    map.setPaintProperty("city_area", 'fill-opacity', 1 - val / 100);
    map.setPaintProperty("oaza_area", 'fill-opacity', 1 - val / 100);
    setTimeout(updateURLHash, 200);
}

function handleOpacityOazaChange(val) {
    map.setPaintProperty("city_label", 'text-opacity', 1 - val / 100);
    map.setPaintProperty("oaza_label", 'text-opacity', 1 - val / 100);
    setTimeout(updateURLHash, 200);
}

function handleOpacityKoazaChange(val) {
    map.setPaintProperty("koaza_label", 'text-opacity', 1 - val / 100);
    setTimeout(updateURLHash, 200);
}

function handlePopupChange() {
    document.querySelector(".popup-option").classList.toggle('selected');
    localStorage.setItem('showPopup', document.querySelector(".popup-option").classList.contains('selected').toString());
}

function handleSearchChange() {
    const selector = document.querySelector(".search-disp-option");
    selector.classList.toggle('selected');
    localStorage.setItem('searchHighlight', selector.classList.contains('selected').toString());
    setMapHighlight(selector.classList.contains('selected'));
}

function setMapHighlight(isHighlight) {
    if (isHighlight) {   
        const colorExpressionCity = [
            'case',
            ['in', ['get', 'CityCode'], ['literal', [...new Set(highlightAreaIds.map(cd => cd.slice(0, 5)))]]], "#0000ff",
            '#999'
        ];
        // console.log(colorExpressionCity)
        const colorExpressionOaza = [
            'case',
            ['in', ['get', 'AreaId'], ['literal', highlightAreaIds]], "#0000ff", // 検索該当
            '#999' // 検索非該当
        ];
        // console.log(colorExpressionOaza)
        map.setPaintProperty('city_area', 'fill-color', colorExpressionCity);
        map.setPaintProperty('oaza_area', 'fill-color', colorExpressionOaza);
    } else {
        map.setPaintProperty('city_area', 'fill-color', ["get", "color"]);
        map.setPaintProperty('oaza_area', 'fill-color', ["get", "color"]);
    }
}

function renderResults(geocodes, searchTarget) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    highlightAreaIds = [];
    geocodes.forEach(g => {
        const addressCode = g.properties.addressCode;
        const pref = addressCode.length > 2 ? prefMap[addressCode.slice(0,2)] : "";
        const div = document.createElement('div');
        div.className = g.geometry.coordinates ? 'result-item' : 'result-item no-location';
        div.innerHTML = `<span>${g.properties.title + (g.properties.result ? ' ' + g.properties.result : '')}</span><span class="subinfo">&emsp;${pref || ""}</span>`;
        div.onclick = () => {
            if (g.geometry.coordinates) {
                map.flyTo({ center: g.geometry.coordinates, zoom: 15 });
                searchResults.style.display = 'none';
            }
            selected = {"properties": {"CityCode": g.properties.addressCode, "OazaName":g.properties.oaza, "CityName":g.properties.city}};
            if (searchTarget === "koaza") {
                openDetailPanel();
            }
        };
        searchResults.appendChild(div);
        if (searchTarget === "koaza" && localStorage.getItem("searchHighlight") === "true") {
            highlightAreaIds.push(g.properties.addressCode + g.properties.oaza);
        }
    });
    setMapHighlight(localStorage.getItem("searchHighlight") === "true");
    searchResults.style.display = searchResults.childElementCount > 0 ? 'block' : 'none';
}


function updateTargetSelection(isKoaza) {
    const subContainer = document.getElementById('sub-options');
    const searchInput = document.getElementById('search-input');
    const radioGeneral = document.getElementById('search-target-general');
    const radioKoaza = document.getElementById('search-target-koaza');
    localStorage.setItem('mapSearchSettings', JSON.stringify({'isKoaza': isKoaza}));
    if (isKoaza) {
        subContainer.classList.remove('disabled');
        searchInput.placeholder = '小字名を入力';
        radioGeneral.checked = false;
        radioKoaza.checked = true;
    } else {
        subContainer.classList.add('disabled');
        searchInput.placeholder = '住所・施設名を入力';
        radioGeneral.checked = true;
        radioKoaza.checked = false;
    }
}


// 詳細パネル関連
function openDetailPanel() {
    const order = localStorage.getItem('koazaOrder');
    let cityCode;
    let oazaName;
    if (selected.properties.hasOwnProperty("CityCode") && selected.properties.hasOwnProperty("OazaName")) {
        cityCode = selected.properties.CityCode;
        oazaName = selected.properties.OazaName;
    } else if (selected.properties.hasOwnProperty("AreaId")) {
        cityCode = selected.properties.AreaId.slice(0,5);
        oazaName = selected.properties.AreaId.slice(5);
    } else {
        cityCode = selected.properties.CityCode;
        oazaName = null;
    }
    const contents = getDetailContents(cityCode, oazaName, order);
    if (!oazaName) {
        // 市区町村
        document.getElementById('detail-title').innerHTML = `
            <ruby>${selected.properties.CityName}<rp>(</rp><rt>${contents[0]}</rt><rp>)</rp></ruby>
            <span>&emsp;&emsp; 登記小字順：
            <select name="order" id="koaza-order">
                <option value="50" ${order === "50" ? "selected" : ""}>五十音順</option>
                <option value="code" ${order === "code" ? "selected" : ""}>コード順</option>
                <option value="utf" ${order === "utf" ? "selected" : ""}>表記順</option>
            </select></span>
            <div id="city-note">【注記】<br>${contents[1] !== "" ? contents[1] : "−"}</div>`;
        document.getElementById('detail-content').innerHTML = contents.at(-1).map((dat, idx) => `
            <h2><ruby>${dat[0]}<rp>(</rp><rt>${dat[1]}</rt><rp>)</rp></h2>
            <h3>【電子登記小字】</h3>
            <div id="touki-koaza-${idx}">${dat[2]}</div><br>
            <h3>【小字ラベル（表記順）】</h3>
            <div id="label-koaza-${idx}">${dat[3]}</div><br>
            <h3>【注記】</h3>
            <div id="koaza-note-${idx}">${dat[4]}</div>
            <hr/>
        `).join("\n");
    } else {
        // 大字
        document.getElementById('detail-title').innerHTML = `<ruby>${selected.properties.CityName}<rp>(</rp><rt>${contents[0]}</rt><rp>)</rp> </ruby><ruby>${oazaName}<rp>(</rp><rt>${contents[1]}</rt><rp>)</rp></ruby>`;
        document.getElementById('detail-content').innerHTML = `    
            <h3>【電子登記小字】
                <select name="order" id="koaza-order">
                    <option value="50" ${order === "50" ? "selected" : ""}>五十音順</option>
                    <option value="code" ${order === "code" ? "selected" : ""}>コード順</option>
                    <option value="utf" ${order === "utf" ? "selected" : ""}>表記順</option>
                </select>
            </h3>
            <div id="touki-koaza">${contents[2]}</div><br>
            <h3>【小字ラベル（表記順）】</h3>
            <div id="label-koaza">${contents[3]}</div><br>
            <h3>【注記】</h3>
            <div id="koaza-note">${contents[4]}</div>
        </div>
        `;
        
    }
    document.getElementById('detail-panel').classList.add('active');
    document.getElementById("koaza-order").value = order;
    document.getElementById("koaza-order").addEventListener('change', () => updateDetailPanel());
}

function updateDetailPanel() {
    const order = document.getElementById("koaza-order").value;
    localStorage.setItem('koazaOrder', order);
    let cityCode;
    let oazaName;
    if (selected.properties.hasOwnProperty("CityCode") && selected.properties.hasOwnProperty("OazaName")) {
        cityCode = selected.properties.CityCode;
        oazaName = selected.properties.OazaName;
    } else if (selected.properties.hasOwnProperty("AreaId")) {
        cityCode = selected.properties.AreaId.slice(0,5);
        oazaName = selected.properties.AreaId.slice(5);
    } else {
        cityCode = selected.properties.CityCode;
        oazaName = null;
    }
    const contents = getDetailContents(cityCode, oazaName, order);
    if (!oazaName) {
        // 市区町村
        contents[1].forEach((dat, idx) => {
            document.getElementById(`touki-koaza-${idx}`).innerHTML = dat[2];
        })            
    } else {
        // 大字
        document.getElementById('touki-koaza').innerHTML = contents[2];
    }
}

function closeDetailPanel() {
    document.getElementById('detail-panel').classList.remove('active');
}

function initResize(e) {
    window.addEventListener('mousemove', StartResize, false);
    window.addEventListener('mouseup', StopResize, false);
    window.addEventListener('touchmove', StartResize, false);
    window.addEventListener('touchend', StopResize, false);
}

function StartResize(e) {
    const panel = document.getElementById('detail-panel');
    const isMobile = window.innerWidth <= 650;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (!isMobile) {
        if(clientX > 280 && clientX < window.innerWidth * 0.6) {
            panel.style.width = clientX + 'px';
            document.documentElement.style.setProperty('--panel-width', clientX + 'px');
        }
    } else {
        const h = window.innerHeight - clientY;
        if(h > 150 && h < window.innerHeight * 0.7) panel.style.height = h + 'px';
    }
}

function StopResize(e) {
    window.removeEventListener('mousemove', StartResize, false);
    window.removeEventListener('mouseup', StopResize, false);
    window.removeEventListener('touchmove', StartResize, false);
    window.removeEventListener('touchend', StopResize, false);
}

// 実行
initMap();
initSearch();