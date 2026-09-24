# Flashcard App (QVAC)

Make decks of flashcards with a question on one side and an answer on the other. Study a deck with a
flip animation, mark each card **Got it** or **Again**, and repeat until you know them all.

Learning a language? Type a word on the front and press **Auto-translate the back**. The translation is
done by an **on-device AI**, so your vocabulary never leaves your computer.

Translation uses [QVAC](https://github.com/tetherto/qvac), Tether's open-source AI SDK. No API key, no cloud service.

![screenshot](screenshot.png)

## SDK version

`@qvac/sdk` **0.19.0** (declared in `package.json`)

Functions used: `loadModel` and `translate`, with the Bergamot translation models
(`BERGAMOT_EN_ES`, `BERGAMOT_EN_FR`, `BERGAMOT_EN_IT`, `BERGAMOT_ES_EN`).

## Install

You need [Node.js](https://nodejs.org) (current LTS) and a little free disk space for the language models.

```bash
git clone https://github.com/YOUR-USERNAME/qvac-flashcards.git
cd qvac-flashcards
npm install
```

## Run

```bash
npm start
```

Then open **http://localhost:3010** in your browser.

Click **Add a sample deck** and study it right away. To try the translation, open a deck, type a word
such as "good night" on the front, and press **Auto-translate the back**. The first time you use each
language pair, a small model downloads.

## How it works

- Decks, cards and studying are plain JavaScript in the browser. Your decks are saved in your browser's local storage, and **Download backup** exports them.
- Study mode shuffles the deck. A card marked **Again** goes to the back of the line until you know it.
- `server.js` loads a Bergamot model with `loadModel` the first time a language pair is used, then calls `translate`. Each model translates one direction only, so each pair is its own model.
- Always check auto-translations, especially for phrases and idioms.
- The server listens on `127.0.0.1`, so only your own computer can reach it.

## License

MIT
