# Card Maker

A small web tool for making a collage greeting card the way you would on a real table: take a sheet out of a box, cut pieces from it, glue them on a card, draw on it, put it in an envelope and share it with a link.

It follows two rules:

- **Nothing is explained.** You find out what things do by trying them.
- **You can only undo what you could undo in real life.** A cut stays cut. Marker ink stays (white-out covers it, mostly). Glue leaves a mark when you move a piece. If it all goes wrong, you start a new card.

## What works today

- **Boxes of material**: Magazines, Paintings and Your pictures. Tap a box to take a random sheet out; drag the sheet back onto a box, or into the trash. A sheet keeps its holes.
- **Cutting a sheet**: scissors, tear, hole punch, and star and heart cutters.
- **The card**: a front and an inside. Pens in three colors and three tips, glitter glue and white-out. Glue dries after 8 seconds.
- **Turning a piece**: tap a piece and a round yellow handle appears at its corner; drag the handle to turn it (or use the left and right arrow keys). Turning a glued piece leaves glue behind, like moving it does.
- **Tape**: pull a strip across the card, plain or printed. It sticks at once and holds down whatever is under it. Peeling it off leaves no glue but tears the paper a little.
- **Sound**: pick Sound, then hold a piece to record up to 5 seconds onto it; tap it to hear it. Holding again records over it. "When the card opens" holds up to 10 seconds that play when the recipient opens the card. The sound you touched last can be played slow or fast, and backwards, like a tape.
- **The trash**: drag anything into it. Double-click to take the last thing back out, then click for the ones before it.
- **The envelope**: pick its color, decorate it, put the card in, try opening it, then close it. Closing saves the card and gives a link.
- **The link**: whoever opens it gets the envelope, then the front, then the inside. Pieces with a sound sway and glow, and play when tapped.

The pictures in the boxes are placeholder drawings until you add your own: put JPG, PNG or WebP files in `public/materials/magazines` and `public/materials/paintings`, and each file becomes a sheet in that box. Stamps, letters, a copier, pins, flipping pieces and movement are listed in the tool rows as "soon" and are not built yet.

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
public/card.js      loads a saved card for the recipient
public/viewer.js    shows a card as its recipient sees it (used by the preview too)
public/missing.html shown when a link does not lead to a card
```

A closed card is stored as three pictures (the envelope, the front and the inside) under a short random code. Pieces that carry a sound are stored separately, each with its picture, its place on the card and its recording, so they can sit on top of the picture and react to a tap. The link is `/card/<code>`. Anyone who has the link can open the card; there are no accounts.

The server accepts at most 30 new cards per hour from one address, and each picture can be at most 3 MB. A card can carry up to 40 sounds.

## Things to know

- A card cannot be changed or deleted once its envelope is closed.
- A card is removed 14 days after its envelope is closed (`KEEP_DAYS` in `server.js`). Until then, the maker and the recipient each get a button that names the last day and saves the card as one file, `card.html`, which opens like the link does and holds the pictures and sounds.
- The table (loose pieces, sheets, the trash) lasts only while the page is open.
- Recording needs the browser's permission to use the microphone, and the page must be served over https (Railway does this) or from localhost.
- Recordings use the format the maker's browser produces. Most combinations play fine, but an older Safari may not play a recording made in Chrome or Firefox.
- A piece with a sound always shows on top of the other pieces for the recipient, even if you glued something over it.
- On a phone, a piece cannot yet be dragged from a sheet to a card that is off screen.
