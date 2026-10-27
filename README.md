# Job Autofill

A personal Chrome extension that fills job application forms from a profile saved on your own computer. No server, no account, no network requests. Built because I didn't want to hand my data to a third-party extension.

It never submits anything. You review every field and click Submit yourself.

<!-- Add a GIF here: ![Demo](docs/demo.gif) -->
<!-- Add a screenshot of a filled form here: ![Filled form](docs/filled-form.png) -->

## What it does

- **Fills the usual fields** from your profile: name, email, phone, links, university, CGPA, SSC/HSC, graduation year, current company, and more.
- **Matches by meaning, not by field name.** It reads labels, placeholders, `aria-label`, and table headers, so "Mobile Number", "Contact" and "Phone" all work.
- **Handles dropdowns, radio buttons and safe checkboxes**, with whole-word fuzzy matching ("Remote" matches "Remote (Work from home)", and "male" never matches "female").
- **Color-coded results.** Green is filled from your profile, yellow is filled by a rule (worth a glance), red is a field that needs you.
- **Cover letter picker.** Detects long-text fields (cover letter, self intro, biggest bug, best project, why this company) and adds a button with your saved answers. `{{company}}`, `{{role}}` and `{{name}}` are filled from the page.
- **Answers "X+ years of Y?" honestly.** It uses the years you set per skill, falls back to your total experience for general questions, and leaves anything it can't answer red instead of guessing.
- **Your own rules.** "When the question contains `comfortable working on site`, answer `Yes`." A 💾 Remember button on red fields saves an answer for next time.
- **Bangladesh-friendly.** Reshapes `+880` / `01XXXXXXXXX` numbers to fit the field, and understands SSC/HSC board, year and result fields, including table layouts.

## Safety rules built in

- No network requests and no remote code. Everything stays in `chrome.storage.local`.
- Permissions are `activeTab`, `scripting` and `storage` only. It runs only when you click the icon.
- **Never ticks consent boxes.** Terms, privacy, "I confirm the information is accurate", marketing and job alerts are on a block list. Negated labels ("I do not require sponsorship") are skipped too.
- **Never overwrites** a field that already has text, and never touches passwords or file uploads.
- **Never auto-submits.**

## Install (unpacked, for personal use)

```bash
git clone https://github.com/Nafis-Rohan/autofil-extention-.git
cd autofil-extention-
npm install
npm run build
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `dist` folder.
3. Pin the extension, then right-click it and open **Options** to fill in your profile.

Keep the `dist` folder where it is, because Chrome loads the extension from it every time. After changing code, run `npm run build` again and click the refresh icon on the extension card.

To try it on the local test pages in `test/`, turn on **Allow access to file URLs** for the extension in `chrome://extensions`.

## Usage

1. Fill in your profile in **Options**: personal info, education, experience, skills, and your snippets.
2. Open a job application form.
3. Click the extension icon and press **Fill this page**.
4. Check the yellow fields, fix the red ones, and submit yourself.

## Tech

TypeScript, Vite with `@crxjs/vite-plugin`, Chrome Extension Manifest V3. The content script is plain TypeScript with no framework.

```
src/
  content/      detect, fill, radio, checkbox, rules, custom rules, snippet picker, highlights
  popup/        "Fill this page" button and color legend
  options/      profile, skills, snippets, rules, backup
  storage.ts    typed access to chrome.storage.local
test/           local HTML pages used to test each feature
```

## Tested on

- Local test pages for every feature (`test/`).
- A public Greenhouse form and a public Lever form.
- A Therap (BD) application form.

Not tested: BDJobs, because its application forms are behind a login.

## Known limits

- **File uploads** can't be set by an extension. Attach your CV yourself.
- **Custom dropdowns** (not a real `<select>`) aren't supported yet.
- **Company and role** in cover letters are read from the page and can be wrong. If one can't be found, the `{{placeholder}}` is left in the text so you notice it.
- A form inside an iframe from another site may need extra host permissions.

## Export and import

Options has **Export JSON** / **Import JSON** to back up your profile, skills, snippets and rules. The file contains personal data, so keep it out of the repo (`profile-backup*.json` is in `.gitignore`).

## License

MIT. See [LICENSE](LICENSE).

## Author

Built by [Nafis](https://github.com/Nafis-Rohan).
