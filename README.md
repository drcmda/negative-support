# step_supports — Negative-Space 3D Print Support Generator

Generates model-conforming support structures for 3D printing from STEP files. Unlike slicer-generated tree or grid supports, these are **negative-space** supports — exact shapes created by subtracting the model from a surrounding block, filling internal cavities (overhangs, bridges, holes) with solid mesh that conforms to the model's actual surface contours.

The output is a separate STL file that can be imported alongside the model in your slicer.

## Requirements

- Python 3.9+
- [build123d](https://github.com/gumyr/build123d) (OpenCascade wrapper for STEP/B-Rep)
- [trimesh](https://trimesh.org/) with [manifold3d](https://github.com/elalish/manifold) backend
- numpy, shapely

```
pip install -r requirements.txt
```

## Usage

```
python3 step_supports.py model.step [options]
```

### Parameters

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `input` | | *(required)* | Path to input STEP file |
| `--output` | `-o` | `<input>_supports.stl` | Output STL path for the generated supports |
| `--margin` | `-m` | `0.2` | Gap between support and model in mm. This clearance allows supports to be removed after printing. Larger values are easier to remove but less precise. |
| `--angle` | `-a` | `45.0` | Overhang angle threshold in degrees from horizontal. Faces steeper than this receive supports. Most FDM printers handle up to 45° without support. Lower values generate more supports. |
| `--min-volume` | | `1.0` | Discard support pieces smaller than this volume in mm³. Filters out tiny slivers and artifacts. |
| `--tolerance` | | `0.01` | STL tessellation tolerance in mm. Lower values produce smoother curved surfaces but larger files. |
| `--export-model` | `-e` | off | Also export the STEP model as STL (saved as `<input>.stl`). Convenient when you only have the STEP file and need an STL for your slicer. |
| `--verbose` | `-v` | off | Print detailed progress: face analysis, per-face support extraction, volumes, and timing. |

### Examples

Basic usage:
```
python3 step_supports.py bracket.step
```

With verbose output and model export:
```
python3 step_supports.py bracket.step -v -e
```

Tighter margin and stricter overhang angle:
```
python3 step_supports.py bracket.step -m 0.15 -a 40
```

Custom output path:
```
python3 step_supports.py bracket.step -o /tmp/bracket_sup.stl
```

## How It Works

1. **Load STEP** — imports the B-Rep model with full parametric face topology
2. **Offset** — creates a slightly enlarged copy of the model (the margin gap). Uses exact B-Rep offset when possible, falls back to vertex-normal inflation on the tessellated mesh for complex models.
3. **Detect overhangs** — identifies faces that need support:
   - **Angle threshold**: faces with downward normals steeper than `--angle` (sampled across curved faces, not just at center)
   - **Mid-air detection**: faces that start printing with no material below, regardless of angle
4. **Extract supports** — for each overhang face, creates a vertical column matching the face's XY footprint and intersects it with the negative space (bounding box minus inflated model)
5. **Filter** — removes tiny fragments and stray pieces above the originating face
6. **Export** — merges all support pieces and writes a single STL file

## Limitations

- **STEP input only** — STL/mesh files lack the B-Rep topology needed for reliable face detection and boolean operations
- **B-Rep offset may fail** on very complex models — the tool falls back to vertex-normal inflation, which can produce uneven margins near sharp edges
- **No tree supports** — generates solid block supports, which use more material but conform exactly to the model surface
