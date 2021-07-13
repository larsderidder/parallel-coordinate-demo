# Parallel Coordinate Demo

A single-page D3 demo that supports axis drag/reorder and brushing with minimal dependencies.

## Contents
- `src/index.html` demo page
- `src/data.json` and `src/data2.json` sample datasets
- `src/d3.min.js` vendored D3 build

## Install
```sh
npm install parallel-coordinate-demo
```

## Run locally
```sh
cd src
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

## Development
```sh
npm run lint
```

## Data format
`data.json` should be:
```json
{
  "allowed_axes": ["axis1", "axis2"],
  "data": [
    {"axis1": 1, "axis2": 2},
    {"axis1": 3, "axis2": 4}
  ]
}
```

## License
See `LICENSE`.
