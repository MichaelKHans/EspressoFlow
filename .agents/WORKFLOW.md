# MOBIL ARBEJDSGANG (MOBIL -> GITHUB -> ANTI)

Dette dokument beskriver, hvordan opgaver oprettes på farten fra mobilen og afvikles automatisk i Espresso Flow.

---

## 📱 Sådan opretter du en opgave fra mobilen:

1. Åbn **GitHub-appen** eller browseren på din telefon.
2. Gå til dit repository: `MichaelKHans/EspressoFlow`.
3. Åbn filen [`TASK.md`](https://github.com/MichaelKHans/EspressoFlow/blob/main/TASK.md) i roden af repoet.
4. Klik på **Edit (Blyant-ikonet)**.
5. Beskriv opgaven under `## 📌 Aktuelle / Planlagte Opgaver`.
6. Klik **Commit changes**.

---

## 🤖 Hvad sker der derefter?

1. **Pull & Læs:** Anti trækker seneste commits med `git pull` og læser opgaven i `TASK.md`.
2. **Udførelse:** Anti implementerer koden i henhold til de jernhårde regler i `.agents/rules/projektinstrukser.md`.
3. **Verifikation:** Anti kører `npm run build` og bekræfter 100% succesfuld compilation.
4. **Log & Push:** Anti bumper versionsnummeret i `package.json`, opdaterer `CHANGELOG.md`, logger i `.agents/STATUS.md`, tømmer opgaven fra `TASK.md` og laver `git push origin main`.
5. **Afslutning:** Du kan se opdateringen på din mobil med det samme!
