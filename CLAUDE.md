# Esküvői weboldal – projekt kontextus

Mesi & Geri esküvői oldala. Magyar nyelvű, statikus oldal GitHub Pages-en.
Repo: https://github.com/jkbgrgly96/mesiandgeri → https://jkbgrgly96.github.io/mesiandgeri/

## Esküvő adatai
- Dátum: 2027. szeptember 25. (szombat)
- Helyszín: A Csűr – Sztrilich Pál Cserkészpark, 2094 Nagykovácsi, Juliannamajor (ScoutEvent)
- Ingyenes füves parkoló kb. 70 autónak
- Jurták: 10–14 fős, emeletes ágyas; lepedő, takaró, kispárna van; beköltözés 16:00, távozás másnap 10:00
- A park tiltja: konfetti, héliumos lufi, tűzijáték; épületben dohányzás és nyílt láng

## Funkciók
1. Dátum bejelentés + visszaszámlálás
2. Visszajelzés: jön-e, kivel (kísérők: felnőtt/gyerek), étkezési igény
3. Finomság: édeset és/vagy sósat hoz, mit (vendégváró asztal) – a felajánlások listája névtelenül megjelenik az oldalon
4. Éjszakázás: jurtaágy 7 500 Ft/fő/éj, saját sátor ingyenes, vagy nem marad; szabad jurtaágyak számlálója
5. Helyszín, megközelítés, beágyazott Google Maps
6. GYIK

## Architektúra (B opció – eldöntve)
- Frontend: egyetlen `index.html` (HTML+CSS+JS), GitHub Pages, build lépés nélkül
- Backend: Google Apps Script web app (a pár Google fiókjában) → privát Google Sheet
  - POST: válasz mentése/frissítése email alapján
  - Email a vendégnek egyedi szerkesztő linkkel (token), amivel később módosíthat
  - GET: névtelen finomságlista + szabad jurtaágyak száma
- Vendégadat SOHA nem kerül a repóba (publikus repo).

## Dizájn
Természetes erdei boho + játékos fesztivál hangulat. Eljegyzési gyűrű: elf stílusú, fehérarany, smaragd kő
→ logó: fehérarany levélkoszorú smaragddal, „M&G”.
Színek: erdőzöld #14322a, smaragd #0d7a57, zsálya #a9bfa3, krém #f7f1e3, terrakotta #c8643b, mustár #e3a83a, púder #e8b7a2.
Betűk: Cormorant Garamond (címek), Caveat (kézírásos), Nunito (szöveg).
Elemek: zászlófüzér, szentjánosbogarak, fenyőerdő sziluett jurtákkal és tábortűzzel.

## Helykitöltők (még cserélendő)
Program időpontjai, visszajelzési határidő (jún. 30), kapcsolat email, szabad ágyak száma (48, Code.gs CONFIG),
tömegközlekedés leírása, „TERVEZET” sáv az oldal tetején.

## Backend állapota
- `apps-script/Code.gs` kész (telepítés: `apps-script/README.md`). CONFIG: BEDS_TOTAL=48 (helykitöltő).
- Frontend `API_URL` beállítva (Apps Script /exec). Üres értékkel bemutató módba vált.
- Értesítés: CONFIG.NOTIFY_EMAILS lista (Mesi + Geri).
- Új visszajelzéshez meghívó kód kell: Apps Script szkripttulajdonság `INVITE_CODE` (SOHA ne kerüljön a repóba!).
  QR/meghívó link: `#k=<kód>` → localStorage-ba menti és kitölti. Megnyitáshoz/módosításhoz token + kód kell
  (POST {action:'load'}); idegen böngészőben a kódot kéri („unlock”). GET csak névtelen statisztikát ad.
- Vendégnek menő levél: SEMMI személyes adat, helyszín/dátum sincs, csak a link. Részletek csak NOTIFY_EMAILS-nek.
- E-mail kétszer beírandó az űrlapon.
- Kódösszevetés kis/nagybetű, szóköz, kötőjel független (normCode_).
- Korlátok: címenként 3 levél/óra, 80 levél/nap, 60 beküldés/10 perc, 10 KB body; hibaüzenet általános (részlet a Script naplóban).
- POST text/plain JSON-nal (nincs CORS preflight). Státuszok: ok(load) / created / updated / exists / full / notfound / invalid / forbidden / busy / error.
- Ugyanazzal az e-maillel új beküldés nem ír felül: a meglévő szerkesztő linket kapja e-mailben.
- Szerkesztő link: `#t=<token>` (régi `?t=` is működik, átírja #-ra).

## Következő lépés
Éles teszt a GitHub Pages oldalon; NOTIFY_EMAILS kitöltése; helykitöltők cseréje.
