# Quick Word

Quick Word includes 50 Bible topics and 50 difficult or commonly misunderstood passages. Each entry has biblical context, a conclusion, and one verified quotation from a Christian commentator. The app includes the full 66-book Berean Standard Bible (BSB) for offline Scripture lookup.

## Install on the existing GitHub Pages site

1. Unzip the package. Upload its **contents** to the repository folder already published by GitHub Pages, replacing the corresponding app files. Put `index.html`, `app.js`, `seed.json`, `bsb.json` and `sw.js` together in that folder.
2. In **Settings → Pages**, retain the existing publishing configuration. If setting up a new repository that uses branch publishing, select **Deploy from a branch**, select your branch (usually `main`), choose **/ (root)** if you uploaded to the root, then save. See [GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
3. After Pages finishes publishing, open the site while online. Reopen or refresh once so the updated offline cache can take control. On iPhone, you can install it from Safari using **Share → Add to Home Screen**.
4. Keep the same site address and browser profile to retain existing favorites and custom entries. Browser storage is local to the device and profile. Clearing browsing data can remove these entries. Keep the existing app URL when updating an installed copy.

No build step, API key, database, paid service, or ongoing data request is required. The app needs one successful online load before it can open offline. Direct commentary source links and the optional ChatGPT research workflow require internet access. Saved personal entries and the built-in commentary remain readable offline after the cache is ready. Reference lookup supports full book names, common abbreviations, chapters, single verses, and verse ranges. The Bible display includes the verse text. The eBible edition also provides footnotes and formatting outside the app.

## Sources

- Scripture is the **Berean Standard Bible** from BSB Publishing, LLC, produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. The app uses verse text from the October 30, 2026 eBible USFX edition. [Edition and downloads](https://www.ebible.org/find/details.php?id=engbsb) · [Public-domain terms](https://berean.bible/terms.htm).
- **John Calvin** was a sixteenth-century Protestant Reformer and biblical commentator. His quotations use the public-domain Calvin Translation Society English text. [Calvin University biography](https://calvin.edu/about/history/john-calvin.html).
- **John Gill** was an eighteenth-century Calvinistic Baptist pastor and Bible expositor. [University of Edinburgh research on Gill](https://era.ed.ac.uk/items/49105815-0884-4b0a-9ea2-13ea7648a9eb).
- **Matthew Henry** was a Presbyterian minister and author of a widely used Bible exposition. Quick Word draws on his Old Testament commentary. [Matthew Henry biography](https://www.wholesomewords.org/biography/bhenry4.html).
- Every commentary quotation was matched against the named author's online source chapter, with whitespace normalized for display. **Read source** opens the direct chapter transcription in JSON. Use the browser’s Find command and paste a few words from the quotation to locate it.
