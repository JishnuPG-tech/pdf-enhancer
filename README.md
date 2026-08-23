# Document PDF Cleaner & Binarizer 📄✨

An advanced document image processing toolkit designed to transform camera-shot and scanned PDFs with dark backgrounds, shadows, and lighting gradients into **ultra-clean, pure-white (#FFFFFF) and deep-black (#000000) print-ready documents**.

---

## Key Features

- **Background Illumination Normalization**: Eliminates shadows, curvature gradients from book spines, and camera vignetting using multi-scale morphological background division.
- **Pure White Background & Solid Black Text**:
  - **Laser Mode (Sauvola Adaptive Binarization)**: Converts pages to pure 1-bit black & white for razor-sharp, zero-toner-waste laser printing.
  - **Smooth Mode (Anti-Aliased Grayscale)**: Pushes paper texture to 100% pure white while preserving smooth font edges.
  - **Color Mode**: Preserves colored charts, diagrams, and highlighter marks while cleaning the background to pure white.
- **Despeckling Filter**: Removes salt-and-pepper camera noise without deleting punctuation (dots in *i*, periods, decimal points, colons).
- **Auto-Margin Border Cleaner**: Removes dark camera framing edges around the document.
- **Optional Auto-Deskew**: Automatically detects tilt angle and straightens pages.
- **Multi-Core Batch Processing**: Uses multi-threading to process multi-page PDFs in seconds.
- **Interactive GUI**: Side-by-side Before/After preview with live sliders and one-click export.

---

## Installation

Ensure you have Python 3.8+ installed. Install the required dependencies:

```bash
pip install -r requirements.txt
```

*(Dependencies: `PyMuPDF`, `opencv-python`, `numpy`, `Pillow`)*

---

## How to Use

### 1. Interactive GUI (Recommended)

Launch the visual application with live Before/After comparison:

```bash
python app_gui.py
```
Or open directly with a PDF:
```bash
python app_gui.py "RATIO & Proportion.pdf"
```

### 2. Command-Line Interface (CLI)

#### Basic Usage:
```bash
python clean_pdf.py "RATIO & Proportion.pdf"
```
*Outputs: `RATIO & Proportion_cleaned.pdf`*

#### Advanced CLI Examples:

- **Custom Output & 300 DPI Laser Mode (Best for printing)**:
  ```bash
  python clean_pdf.py input.pdf -o cleaned.pdf --mode laser --dpi 300
  ```

- **Smooth Anti-Aliased Grayscale Mode**:
  ```bash
  python clean_pdf.py input.pdf --mode smooth --white-cutoff 210 --black-cutoff 80
  ```

- **Process Specific Pages (e.g., pages 1 to 10)**:
  ```bash
  python clean_pdf.py input.pdf --pages 1-10
  ```

- **Straighten / Auto-Deskew Pages**:
  ```bash
  python clean_pdf.py input.pdf --deskew
  ```

---

## CLI Options Reference

| Option | Flag | Default | Description |
|---|---|---|---|
| Input File | `input` | *required* | Path to input PDF file |
| Output File | `-o`, `--output` | `[input]_cleaned.pdf` | Path for cleaned output PDF |
| Mode | `-m`, `--mode` | `laser` | `laser` (pure B&W), `smooth` (anti-aliased), `color`, `adaptive` |
| DPI | `--dpi` | `300` | Rasterization resolution for printing (150-600) |
| Sensitivity | `-k`, `--sauvola-k` | `0.15` | Sauvola threshold sensitivity (0.05 - 0.35) |
| Window Size | `-w`, `--sauvola-window`| `31` | Local adaptive window size in pixels |
| White Cutoff | `--white-cutoff` | `210` | Threshold above which background is forced to 255 |
| Black Cutoff | `--black-cutoff` | `80` | Threshold below which text is forced to 0 |
| Despeckle | `--no-despeckle` | Enabled | Disable noise removal filter |
| Margin Crop | `--margin` | `0.015` | Fraction of outer border to clear (e.g. 0.015 = 1.5%) |
| Deskew | `--deskew` | Disabled | Automatically straighten tilted pages |
| Page Range | `-p`, `--pages` | All | Specific pages (e.g. `1-5`, `1,3,7-10`) |
| Threads | `-t`, `--threads` | CPU Count | Number of worker threads for parallel processing |
| Launch GUI | `--gui` | Disabled | Launch the GUI app |
