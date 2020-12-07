# Spotted
'Spotted style' React App which transforms messages into images and uploads them to instagram.


# Dependencies

In order to install dependencies use yarn and pipenv.

```shell
pipenv sync
```

```shell
yarn install
```

# Configuration

Included with this repo are two configuration files.
Front-end configuration file `sconfig.json` is located in the `src` subfolder and back-end configuration file `config.json` is in the root folder.

## `sconfig.json`

| key                   | value       | meaning                                       |
|-----------------------|-------------|-----------------------------------------------|
| `locale`              | `"en-US"`   | language of the app                           |
| `Header`              | `"Spotted"` | the header of the page                        |
| `TimeBetweenMessages` | `"10"`      | the minimum time between sending messages (s) |

## `config.json`

| key        | meaning            |
|------------|--------------------|
| `username` | instagram username |
| `password` | instagram password |

### locales

As of today only Polish and English have their locales, feel free to add yours, by creating a key with its name inside `/src/loc/strings.json` file.

## Deployment

The can be served with gunicorn by default.

A `Procfile` for easy heroku deployment is included

# License

MIT © Jan Ochwat

