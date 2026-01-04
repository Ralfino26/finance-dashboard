# Finance Dashboard

Self-hosted personal finance dashboard voor het bijhouden van je assets (crypto, investeringen, cash).

## Features

- **Overview pagina** met totaal asset counter
- **Drie vault types**: Crypto, Investment, Cash
- **Custom vaults** met eigen naam en kleur
- **Asset management** per vault (toevoegen, bewerken, verwijderen)
- **Lokale data opslag** in JSON bestanden
- **Configureerbaar data pad** via environment variable

## Installatie

```bash
# Installeer dependencies
bun install

# Start development server
bun run dev
```

## Data Opslag

De applicatie slaat alle data lokaal op in JSON bestanden. Standaard wordt de `./data` directory gebruikt (relatief ten opzichte van de project root).

### Data Directory Configuratie

Je kunt het data pad configureren via de `DATA_DIR` environment variable:

```bash
# Standaard (./data)
DATA_DIR=./data

# Custom pad (absoluut pad)
DATA_DIR=/path/to/your/data

# Voor Docker (gebruik volume mount)
DATA_DIR=/app/data
```

### Data Structuur

De data wordt opgeslagen in:
- `{DATA_DIR}/vaults.json` - Alle vaults
- `{DATA_DIR}/assets.json` - Alle assets

De `data` directory wordt automatisch aangemaakt als deze niet bestaat.

## Docker (Toekomst)

De applicatie is voorbereid voor Docker deployment. Je kunt het data pad configureren via environment variables en een volume mount gebruiken voor persistente data opslag.

## Development

```bash
# Development server
bun run dev

# Build voor productie
bun run build

# Start productie server
bun run start
```

## Dashboard Features

- **Homepage** = Overview page met totaal waarde
- **Sidebar** met alle vaults (met kleur en naam)
- **Button** voor nieuwe vault toevoegen
- **Vault pagina's** met overview en edit functies

### Crypto Vault
- Overview met alle coins (naam, hoeveelheid, waarde in €)
- Edit functie per coin
- Coin toevoegen functie
- Prijs berekening via API komt later

### Investment Vault
- Overview met alle aandelen (naam, hoeveelheid, waarde in €)
- Edit functie per investering
- Aandeel toevoegen functie
- Prijs berekening via API komt later

### Cash Vault
- Overview met alle cash (naam, hoeveelheid, waarde in €)
- Edit functie per cash entry
- Cash toevoegen functie
