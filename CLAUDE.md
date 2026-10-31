# Esküvői weboldal – projekt kontextus

Emese & Gergő esküvői oldala. Magyar nyelvű, statikus oldal GitHub Pages-en.
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
→ logó: fehérarany levélkoszorú smaragddal, „E&G”.
Színek: erdőzöld #14322a, smaragd #0d7a57, zsálya #a9bfa3, krém #f7f1e3, terrakotta #c8643b, mustár #e3a83a, púder #e8b7a2.
Betűk: Cormorant Garamond (címek), Caveat (kézírásos), Nunito (szöveg).
Elemek: zászlófüzér, szentjánosbogarak, fenyőerdő sziluett jurtákkal és tábortűzzel.

## Helykitöltők (még cserélendő)
Program időpontjai, visszajelzési határidő (jún. 30), kapcsolat email, szabad ágyak száma (48), minta finomságok,
tömegközlekedés leírása, „TERVEZET” sáv az oldal tetején.

## Következő lépés
Google Sheet + Apps Script backend megírása és bekötése az űrlapba.
