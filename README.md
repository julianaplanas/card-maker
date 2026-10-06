# Card Maker

A small web tool for making a collage greeting card the way you would on a real table: take a sheet out of a box, cut pieces from it, glue them on a card, draw on it, put it in an envelope and share it with a link.

It follows two rules:

- **Nothing is explained.** You find out what things do by trying them.
- **You can only undo what you could undo in real life.** A cut stays cut. Marker ink stays (white-out covers it, mostly). Glue leaves a mark when you move a piece. If it all goes wrong, you start a new card.

## What works today

- **Boxes of material**: Magazines, Paintings and Your pictures. Tap a box to take a random sheet out; drag the sheet back onto a box, or into the trash. A sheet keeps its holes.
- **Cutting a sheet**: scissors, tear, hole punch, and star and heart cutters.
- **The card**: a front and an inside. Pens in three colors and three tips, glitter glue and white-out. Glue dries after 8 seconds.
- **The trash**: drag anything into it. Double-click to take the last thing back out, then click for the ones before it.
- **The envelope**: decorate it, put the card in, try opening it, then close it. Closing saves the card and gives a link.
- **The link**: whoever opens it gets the envelope, then the front, then the inside.

The pictures in the boxes are placeholder drawings. Tape, stamps, letters, a copier, pins, flipping pieces, recorded sound and movement are listed in the tool rows as "soon" and are not built yet.

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```
npm install
npm start
```

Then open http://localhost:3000.

Without a database, closed cards are saved as files in a `data/` folder next to the code. That is fine for trying things out.

## Put it on Railway

1. In Railway, create a **New Project** and choose **Deploy from GitHub repo**. Pick this repository. Railway detects Node.js and runs `npm start`.
2. In the same project, add a database: **New** → **Database** → **PostgreSQL**.
3. Open the app's service, go to **Variables**, and add a variable named `DATABASE_URL` that references the database's `DATABASE_URL` (Railway offers it in the variable picker).
4. Open the service's **Settings** → **Networking** and choose **Generate Domain** to get a public address.

The table for cards is created the first time the app starts. There is nothing else to set up.

If `DATABASE_URL` is missing, the app still runs but saves cards as files inside the container, and those are lost on every redeploy. So on Railway, always connect the database.

## How it is put together

```
server.js           the server: serves the app, saves cards, serves them back
public/index.html   the maker's page
public/style.css    all the styles
public/app.js       everything the maker's page does
public/card.html    the page a recipient opens
public/card.js      opening the envelope and the card
public/missing.html shown when a link does not lead to a card
```

A closed card is stored as three pictures (the envelope, the front and the inside) under a short random code. The link is `/card/<code>`. Anyone who has the link can open the card; there are no accounts.

The server accepts at most 30 new cards per hour from one address, and each picture can be at most 3 MB.

## Things to know

- A card cannot be changed or deleted once its envelope is closed.
- Cards are kept forever; nothing removes old ones yet.
- The table (loose pieces, sheets, the trash) lasts only while the page is open.
- On a phone, a piece cannot yet be dragged from a sheet to a card that is off screen.
