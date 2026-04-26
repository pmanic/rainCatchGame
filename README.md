# rainCatcher

Jednostavna ECS igrica u JavaScript-u. Igrac pomera kantu i hvata kapi kise, izbegava blato i skuplja zlatne kapi za povratak zivota.

## Sta projekat pokazuje

- ECS engine napravljen u JavaScript-u
- Funkcionalni stil: nema mutacije sveta, sistemi vracaju novi `world`
- Kompozicija sistema preko `runSystems(...)`
- Upotreba `map`, `filter` i `reduce`
- Obavezni sistemi sa zadatka i jos nekoliko dodatnih sistema za samu igricu

## Sistemi u projektu

- `inputSystem`:
  tastatura, mis, touch i tekstualni unos imena igraca
- `renderSystem`:
  iscrtavanje pozadine, objekata i kante
- `playerSystem`:
  pomeranje igraca
- `spawnSystem`:
  kreiranje novih objekata
- `physicsSystem`:
  padanje objekata
- `collisionSystem`:
  detekcija sudara
- `cleanupSystem`:
  uklanjanje objekata koji su ispali sa ekrana
- `progressionSystem`:
  skor, zivoti, nivo kante i kraj igre

## Funkcionalni principi

- Imutabilnost:
  svaka promena vraca novi objekat sveta ili novu mapu komponenti
- Funkcije viseg reda:
  `inputSystem(rawInput)` vraca sistem, `reduce` pokrece listu sistema
- Kompozicija funkcija:
  svi sistemi se izvrsavaju redom u jednoj petlji
- `filter`:
  biranje entiteta koji imaju trazene komponente
- `reduce`:
  pomeranje vise entiteta, obrada dogadjaja i pokretanje svih sistema

## Pravila igre

- Kisna kap: `+1` poen i puni vodostaj
- Blatnjava kap: `-1` poen i smanjuje vodostaj
- Zlatna kap: vraca jedan izgubljeni oblak
- Kada se kanta napuni, prelazi u manju velicinu:
  Barrel -> Bucket -> Pail -> Tin
- Ako promasis 3 kisne kapi ili skor padne na 0, igra se zavrsava

## Pokretanje

```bash
npm install
npm run build:css
```

Posle toga otvoriti `index.html` u browser-u.
