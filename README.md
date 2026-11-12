# jk-kuntoilee.fi

JK Kuntoilee — liikuntaa ja hyvinvointia arkeen. Staattinen sivusto,
ei build-vaihetta.

## Tiedostot

| Tiedosto | Sisältö |
|---|---|
| `index.html` | Etusivu: sankkari, palvelut, ohjelmat, tarinat, yhteystiedot |
| `styles.css` | Kaikki tyylit (värit ja fontit muuttujissa tiedoston alussa) |
| `script.js` | Vuosiluku ja lomakkeen ilmoitus |
| `favicon.svg` | Selavicon |

## Värit

| Muuttuja | Oletus | Mihin |
|---|---|---|
| `--accent` | `#8A2E16` | Pääväri (puunruskea) |
| `--hi` | `#C9772A` | Huomioväri (amber) |
| `--paper` | `#F7F4ED` | Taustapohja |
| `--font-head` | Archivo | Otsikot |
| `--font-body` | Public Sans | Leipäteksti |

## Yhteydenottolomake

Lomake on valmiitosava mutta ei lähetä minnekään — se näyttää viestin
ja pyytää vastaamaan. Todelliseen käyttöön se kytketään Formspreeen,
Netlify Formsiin tai omaan endpointtiin.

## Julkaisu

GitHub Pages: `Settings → Pages → Source: Deploy from a branch → main / (root)`.
CNAME-tiedosto + DNS-tietue `jk-kuntoilee.fi → korhonecom.github.io`.
