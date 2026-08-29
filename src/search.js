import {glyphTable, variantTable} from "./tables.js";
let searchData = new Array(47).fill(null);

export async function executeGeneralSearch(query) {
    // {geometry: {coordinates: [lon, lat], type: "Point"}, type: "Feature", properties: {addressCode: "14137", title: "", dataSource: "1"}}
    let geocodes = [];
    if (query.length < 2) {
        alert('2文字以上入力してください。');
        return;
    }
    try {
        const resp = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`);
        geocodes = await resp.json();
    } catch (err) {
        console.error(err);
    }
    if (geocodes.length  === 0) {
        alert('該当なし');
        return;
    }
    return geocodes;
}


export async function executeKoazaSearch(query, koazaTouki, koazaLabel, inclOaza, allowVriants) {
    const regExpPtn = buildRegexPtn(query, allowVriants);
    const q = new RegExp(regExpPtn); 
    const q_ = new RegExp("(?:^|[【】〔〕,])([^【】〔〕,]*" + regExpPtn + "[^【】〔〕,]*)(?=[【】〔〕,]|$)"); 
    let geocodes = [];
    if (query.length < 1) {
        alert('検索する文字列を入力してください。');
        return;
    }
    if (!(koazaTouki || koazaLabel)) {
        alert('検索対象が設定されていません。');
        return;
    }
    for (const dp of searchData) {      // 都道府県
        for (const dc of dp) {          // 市区町村
            for (const d of dc.at(-1)) {    // 大字
                if (inclOaza && q.test(d[0])) {
                    geocodes.push({
                        type: "Feature",
                        geometry: {
                            coordinates: d[1][0] + d[1][1] === "00" ? null : [d[1][0] / 100000, d[1][1] / 100000],
                            type: "Point"
                        },
                        properties: {
                            addressCode: dc[0],
                            title: dc[1] + d[0],
                            city: dc[1],
                            oaza: d[0]
                        }
                    });
                    continue;
                }
                if (koazaTouki && q.test(d[2])) {
                    const res = d[2].match(q_).slice(1).join("・");
                    geocodes.push({
                        type: "Feature",
                        geometry: {
                            coordinates: d[1][0] + d[1][1] === "00" ? null : [d[1][0] / 100000, d[1][1] / 100000],
                            type: "Point"
                        },
                        properties: {
                            addressCode: dc[0],
                            title: dc[1] + d[0],
                            city: dc[1],
                            oaza: d[0],
                            result: res
                        }
                    });
                    continue;
                }
                if (koazaLabel && q.test(d[3])) {
                    const res = d[3].match(q_).slice(1).join("・");
                    geocodes.push({
                        type: "Feature",
                        geometry: {
                            coordinates: d[1][0] + d[1][1] === "00" ? null : [d[1][0] / 100000, d[1][1] / 100000],
                            type: "Point"
                        },
                        properties: {
                            addressCode: dc[0],
                            title: dc[1] + d[0],
                            city: dc[1],
                            oaza: d[0],
                            result: res
                        }
                    });
                }
            }
        }
    }
    if (geocodes.length  === 0) {
        alert('該当なし');
        return;
    }
    return geocodes;
}


function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function getNormalizedChar(ch) {
    for (const [rep, pattern] of Object.entries(variantTable)) {
        const chars = pattern.slice(1, -1);
        if (chars.includes(ch)) {
            return rep;
        }
    }
    return ch;
}


function buildRegexPtn(rawQuery, allowVariants) {
    if (!allowVariants) {
        return escapeRegExp(rawQuery);
    }
    // クエリを正規化
    let query = "";
    for (const ch of rawQuery) {
        query += getNormalizedChar(ch);
    }
    
    let pattern = "";
    let pos = 0;
    while (pos < query.length) {
        let matched = false;
        // 外字対応
        for (const text of Object.keys(glyphTable)) {
            if (query.startsWith(text, pos)) {
                // 外字・表記揺れ
                let textPattern = "";
                for (const ch of text) {
                    textPattern += variantTable[ch];
                }
                // 外字コード
                const glyphPattern = glyphTable[text]
                    .map(code => "〓\\(" + escapeRegExp(code) + "\\)")
                    .join("|");
                pattern += `(?:${textPattern}|${glyphPattern})`;
                pos += text.length;
                matched = true;
                break;
            }
        }
        if (matched) continue;
        // 表記揺れのみ
        const ch = query[pos];
        pattern += variantTable[ch] ?? escapeRegExp(ch);
        pos++;
    }
    return pattern;
}


export async function initSearch() {
    await Promise.all(
        [...Array(47).keys()].map(async (i) => {
            const response = await fetch(`./src/search/${String(i + 1).padStart(2, "0")}.dat`);
            const buffer = await response.clone().arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let text;
            if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
                const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
                text = await new Response(stream).text();
            } else {
                text = await response.text();
            }
            searchData[i] = JSON.parse(text);
        })
    );
    
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        loadingScreen.classList.add("loaded");
    }
}


function sortKoaza(koaza, koazaCode, order) {
    if (order === "code" || order == "utf") {
        const tokens = koaza.split(/(【[^】]+】|〔[^〕]+〕)/);
        let weightIdx = 0;
        let sortedWordsStr = '';
        const processedTokens = tokens.map(token => {
            if (!token || token.startsWith('【') || token.startsWith('〔')) {
                return token;
            }
            // 余計なカンマを削除
            const match = token.match(/^(\,?)(.*?)(\,?)$/);
            if (!match) return token;
            const [_, leadingComma, wordsStr, trailingComma] = match;
            if (!wordsStr) return token;
            const words = wordsStr.split(',');
            if (order === "code") {
                const currentWeights = koazaCode.slice(weightIdx, weightIdx + words.length);   
                weightIdx += words.length;
                const paired = words.map((word, i) => ({word, weight: currentWeights[i]}));
                paired.sort(x => x.weight);
                sortedWordsStr = paired.map(p => p.word).join(',');
            } else if (order === "utf") {
                sortedWordsStr = words.toSorted().join(',');
            }
            return leadingComma + sortedWordsStr + trailingComma;
        });
        return processedTokens.join("");
    } else {
        return koaza;        
    }
}


export function getDetailContents(cityCode, oazaName, order) {
    const prefCode = Number(cityCode.slice(0,2));
    const cityData = searchData[prefCode - 1].find(v => v[0] === cityCode);
    if (oazaName) {
        // 大字単位
        const oazaData = cityData.at(-1).find(v => v[0] === oazaName);
        const toukiKoaza = sortKoaza(oazaData[2], oazaData[4].split(","), order);
        return [
            cityData[2],    // 市区町村振り仮名
            oazaData[6],    // 大字振り仮名
            toukiKoaza !== "" ? replaceGaiji(toukiKoaza.replaceAll(",", "、")) : "―",    // 登記小字
            oazaData[3] !== '' ? oazaData[3].replaceAll(",", "、") : "―",    // ラベル小字
            oazaData[5] !== '' ? oazaData[5] : '―'  // 注記
        ];       
    } else {
        // 市区町村単位       
        return [
            cityData[2],
            cityData[3],
            cityData.at(-1).map((oazaData) => [
                oazaData[0] !== "" ? oazaData[0] : '(大字・町名なし)',    // 大字名
                oazaData[6],    // 大字振り仮名
                oazaData[2] !== "" ? replaceGaiji(sortKoaza(oazaData[2], oazaData[4].split(","), order).replaceAll(",", "、")) : "―",
                oazaData[3] !== '' ? oazaData[3].replaceAll(",", "、") : "―",
                oazaData[5] !== '' ? oazaData[5] : '―'  // 注記           
            ])
        ]
    }
}


function replaceGaiji(str) {
    return str.replace(/〓\(([A-Fa-f0-9]{4})\)/g, (_, code) => {
        const C = code.toUpperCase();
        return `<img src='src/glyphs/${C}.svg' class="glyph" alt="〓(${C})">`;
    });
}

