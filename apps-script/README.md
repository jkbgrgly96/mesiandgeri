# Backend telepítése (Google Apps Script)

A visszajelzések egy privát Google Sheetbe kerülnek; a vendégek e-mailt kapnak egy szerkesztő linkkel.
A kód (`Code.gs`) nem tartalmaz titkos adatot, a vendégadatok csak a Sheetben vannak.

## Első telepítés

1. **Google Sheet létrehozása** – <https://sheets.new>, nevezd el pl. „Esküvő – visszajelzések”.
2. **Bővítmények → Apps Script.** A megnyíló szerkesztőben töröld a `Code.gs` tartalmát, és másold be ezt a `Code.gs`-t.
3. **CONFIG kitöltése** a fájl tetején: `BEDS_TOTAL` (hány jurtaágy jut a vendégeknek), opcionálisan `REPLY_TO` és `NOTIFY_EMAILS` (lista: kik kapjanak értesítést). Mentés (Ctrl+S).
4. **`setup` futtatása:** fent a függvényválasztóban válaszd a `setup`-ot → **Futtatás**.
   Engedélyezd a hozzáférést (Sheet + e-mail küldés). A „Google nem ellenőrizte ezt az alkalmazást” ablaknál:
   *Speciális → Ugrás a(z) … projektre (nem biztonságos)* – ez a saját scripted, nyugodtan engedélyezheted.
   Ezután a Sheetben megjelenik a „Válaszok” lap a fejléccel.
5. **Közzététel:** jobb felül **Telepítés → Új telepítés** → típus: **Webalkalmazás**
   - Végrehajtás mint: **Én**
   - Hozzáféréssel rendelkezik: **Bárki**
   → **Telepítés**, majd másold ki a **webalkalmazás URL-jét** (`https://script.google.com/macros/s/…/exec`).
6. Az URL kerül az `index.html`-ben az `API_URL` konstansba.

## Kód módosítása később

**Telepítés → Telepítések kezelése → ceruza ikon → Verzió: Új verzió → Telepítés.**
Így az URL ugyanaz marad. (Az „Új telepítés” új URL-t adna.)

## Tudnivalók

- Ingyenes Gmail fiókkal naponta kb. 100 e-mail küldhető – egy esküvőhöz bőven elég.
- A Sheetben kézzel is szerkeszthetsz (pl. javíthatsz egy nevet), de a **Token** oszlophoz ne nyúlj,
  és ne szúrj be oszlopot a meglévők közé (jobbra a végére nyugodtan írhatsz saját jegyzetet).
- Ha valaki ugyanazzal az e-mail címmel újra kitölti az űrlapot, nem írja felül a korábbit:
  a meglévő szerkesztő linket kapja meg e-mailben.
