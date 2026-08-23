"""
Interactive GUI for PDF Document Cleaner & AI Adaptive Restorer.
Provides live side-by-side Before/After preview, mode selection,
AI page-adaptive noise profiling, word-level envelope tracking, and high-DPI export.
"""

import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk

from pdf_cleaner import DocumentCleaner, CleaningMode, PDFProcessor


class PDFCleanerGUI:
    def __init__(self, root: tk.Tk, initial_pdf: str = None):
        self.root = root
        self.root.title("CleanPDF - Document Whitener & AI Adaptive Restorer")
        self.root.geometry("1300x860")
        self.root.minsize(1024, 700)

        self.pdf_path = initial_pdf or ""
        self.total_pages = 0
        self.current_page = 0

        # Processing & Cleaner
        self.cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            sauvola_k=0.15,
            sauvola_window=31,
            white_cutoff=210,
            black_cutoff=80,
            despeckle=True,
            min_speckle_size=3,
            margin_percent=0.008,
            contrast_boost=1.0,
            filter_bleedthrough=True,
            contrast_threshold=38.0,
            clean_anomalies=True,
            adaptive_thresholding=True
        )
        self.processor = PDFProcessor(cleaner=self.cleaner, dpi=300)

        # Cached raw and cleaned preview images
        self.raw_page_img: np.ndarray = None
        self.cleaned_page_img: np.ndarray = None
        self.preview_update_timer = None

        self._build_ui()

        if self.pdf_path and os.path.exists(self.pdf_path):
            self.load_pdf(self.pdf_path)

    def _build_ui(self):
        self.style = ttk.Style()
        try:
            self.style.theme_use("clam")
        except Exception:
            pass

        # Top Control Bar
        top_frame = ttk.Frame(self.root, padding="10 10 10 5")
        top_frame.pack(fill=tk.X)

        ttk.Label(top_frame, text="PDF File:", font=("Segoe UI", 10, "bold")).pack(side=tk.LEFT, padx=(0, 5))
        self.file_entry = ttk.Entry(top_frame, font=("Segoe UI", 9))
        self.file_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        if self.pdf_path:
            self.file_entry.insert(0, self.pdf_path)

        ttk.Button(top_frame, text="Browse PDF...", command=self.browse_file).pack(side=tk.LEFT, padx=3)
        self.btn_export = ttk.Button(top_frame, text="Export Cleaned PDF", command=self.export_pdf, state=tk.DISABLED)
        self.btn_export.pack(side=tk.LEFT, padx=6)

        # Main Body: Left sidebar & Right preview pane
        body = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        body.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # Left Sidebar
        sidebar = ttk.Frame(body, width=340, padding="8")
        sidebar.pack_propagate(False)
        body.add(sidebar, weight=0)

        # 1. Mode Selection Group
        mode_group = ttk.LabelFrame(sidebar, text=" 1. Cleaning Mode ", padding="8")
        mode_group.pack(fill=tk.X, pady=(0, 8))

        self.mode_var = tk.StringVar(value="laser")
        modes = [
            ("Laser Binarized (Pure 1-bit B&W)", "laser"),
            ("Smooth Grayscale (Anti-Aliased)", "smooth"),
            ("Color Enhanced (White Background)", "color"),
            ("Adaptive Gaussian", "adaptive")
        ]
        for text, val in modes:
            ttk.Radiobutton(
                mode_group,
                text=text,
                value=val,
                variable=self.mode_var,
                command=self.on_mode_change
            ).pack(anchor=tk.W, pady=2)

        # 2. AI Adaptive & Anomaly Group
        anomaly_group = ttk.LabelFrame(sidebar, text=" 2. AI Adaptive Dot & Noise Filters ", padding="8")
        anomaly_group.pack(fill=tk.X, pady=(0, 8))

        self.adaptive_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            anomaly_group,
            text="🧠 AI Per-Page Dynamic Auto-Tuner",
            variable=self.adaptive_var,
            command=self.on_checkbox_change
        ).pack(anchor=tk.W, pady=2)

        self.anomaly_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            anomaly_group,
            text="✨ Word-Level Envelope Protection",
            variable=self.anomaly_var,
            command=self.on_checkbox_change
        ).pack(anchor=tk.W, pady=2)

        self.despeckle_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            anomaly_group,
            text="Despeckle (Salt & Pepper Noise)",
            variable=self.despeckle_var,
            command=self.on_checkbox_change
        ).pack(anchor=tk.W, pady=2)

        # 3. Fine-Tuning Sliders Group
        tuning_group = ttk.LabelFrame(sidebar, text=" 3. Fine-Tuning Controls ", padding="8")
        tuning_group.pack(fill=tk.X, pady=(0, 8))

        # Sauvola K Slider
        self.lbl_k = ttk.Label(tuning_group, text="Sauvola Sensitivity (k): 0.15")
        self.lbl_k.pack(anchor=tk.W)
        self.slider_k = ttk.Scale(tuning_group, from_=0.05, to=0.35, value=0.15, command=self.on_slider_k)
        self.slider_k.pack(fill=tk.X, pady=(0, 6))

        # Base Contrast Threshold Slider
        self.lbl_contrast = ttk.Label(tuning_group, text="Base Optical Threshold: 38")
        self.lbl_contrast.pack(anchor=tk.W, pady=(4, 0))
        self.slider_contrast = ttk.Scale(tuning_group, from_=20.0, to=65.0, value=38.0, command=self.on_slider_contrast)
        self.slider_contrast.pack(fill=tk.X, pady=(0, 6))

        # White Level Slider
        self.lbl_white = ttk.Label(tuning_group, text="White Cutoff: 210")
        self.lbl_white.pack(anchor=tk.W)
        self.slider_white = ttk.Scale(tuning_group, from_=180, to=255, value=210, command=self.on_slider_white)
        self.slider_white.pack(fill=tk.X, pady=(0, 6))

        # Black Level Slider
        self.lbl_black = ttk.Label(tuning_group, text="Black Cutoff: 80")
        self.lbl_black.pack(anchor=tk.W)
        self.slider_black = ttk.Scale(tuning_group, from_=0, to=150, value=80, command=self.on_slider_black)
        self.slider_black.pack(fill=tk.X, pady=(0, 6))

        # 4. Export Settings Group
        export_group = ttk.LabelFrame(sidebar, text=" 4. Export PDF Settings ", padding="8")
        export_group.pack(fill=tk.X, pady=(0, 8))

        dpi_frame = ttk.Frame(export_group)
        dpi_frame.pack(fill=tk.X, pady=2)
        ttk.Label(dpi_frame, text="Output DPI:").pack(side=tk.LEFT)
        self.dpi_var = tk.StringVar(value="300")
        dpi_combo = ttk.Combobox(dpi_frame, textvariable=self.dpi_var, values=["150", "200", "300", "400", "600"], width=6, state="readonly")
        dpi_combo.pack(side=tk.RIGHT)
        dpi_combo.bind("<<ComboboxSelected>>", lambda e: self.on_dpi_change())

        pages_frame = ttk.Frame(export_group)
        pages_frame.pack(fill=tk.X, pady=2)
        ttk.Label(pages_frame, text="Pages (e.g. 1-10):").pack(side=tk.LEFT)
        self.page_range_var = tk.StringVar(value="all")
        ttk.Entry(pages_frame, textvariable=self.page_range_var, width=10).pack(side=tk.RIGHT)

        # Right Preview Area
        preview_container = ttk.Frame(body)
        body.add(preview_container, weight=1)

        # Navigation Bar
        nav_bar = ttk.Frame(preview_container, padding="4")
        nav_bar.pack(fill=tk.X)

        self.btn_prev = ttk.Button(nav_bar, text="◀ Previous Page", command=self.prev_page, state=tk.DISABLED)
        self.btn_prev.pack(side=tk.LEFT, padx=3)

        self.lbl_page_num = ttk.Label(nav_bar, text="No PDF Loaded", font=("Segoe UI", 10, "bold"))
        self.lbl_page_num.pack(side=tk.LEFT, padx=10)

        self.btn_next = ttk.Button(nav_bar, text="Next Page ▶", command=self.next_page, state=tk.DISABLED)
        self.btn_next.pack(side=tk.LEFT, padx=3)

        # Comparison Split View
        split_frame = ttk.Frame(preview_container)
        split_frame.pack(fill=tk.BOTH, expand=True, pady=5)

        # Left: Original
        orig_box = ttk.LabelFrame(split_frame, text=" Original Document ", padding="4")
        orig_box.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 3))
        self.orig_canvas = tk.Canvas(orig_box, bg="#2a2a2a", highlightthickness=0)
        self.orig_canvas.pack(fill=tk.BOTH, expand=True)

        # Right: Cleaned
        clean_box = ttk.LabelFrame(split_frame, text=" Cleaned Output (Pure White & Deep Black) ", padding="4")
        clean_box.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(3, 0))
        self.clean_canvas = tk.Canvas(clean_box, bg="#2a2a2a", highlightthickness=0)
        self.clean_canvas.pack(fill=tk.BOTH, expand=True)

        # Bottom Status Bar
        status_bar = ttk.Frame(self.root, padding="6 4 6 4")
        status_bar.pack(fill=tk.X, side=tk.BOTTOM)

        self.progress_bar = ttk.Progressbar(status_bar, mode="determinate")
        self.progress_bar.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(10, 0))

        self.lbl_status = ttk.Label(status_bar, text="Ready. Select a PDF file to begin.", font=("Segoe UI", 9))
        self.lbl_status.pack(side=tk.LEFT)

    def browse_file(self):
        filename = filedialog.askopenfilename(
            title="Select Scanned / Camera-Shot PDF",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if filename:
            self.file_entry.delete(0, tk.END)
            self.file_entry.insert(0, filename)
            self.load_pdf(filename)

    def load_pdf(self, pdf_path: str):
        if not os.path.exists(pdf_path):
            messagebox.showerror("Error", f"File does not exist: {pdf_path}")
            return

        self.pdf_path = pdf_path
        try:
            self.total_pages = self.processor.get_page_count(pdf_path)
            self.current_page = 0
            self.btn_export.config(state=tk.NORMAL)
            self.update_page_nav()
            self.render_current_page_preview()
            self.lbl_status.config(text=f"Loaded: {os.path.basename(pdf_path)} ({self.total_pages} pages)")
        except Exception as e:
            messagebox.showerror("Error loading PDF", str(e))

    def update_page_nav(self):
        if self.total_pages > 0:
            self.lbl_page_num.config(text=f"Page {self.current_page + 1} of {self.total_pages}")
            self.btn_prev.config(state=tk.NORMAL if self.current_page > 0 else tk.DISABLED)
            self.btn_next.config(state=tk.NORMAL if self.current_page < self.total_pages - 1 else tk.DISABLED)
        else:
            self.lbl_page_num.config(text="No PDF Loaded")
            self.btn_prev.config(state=tk.DISABLED)
            self.btn_next.config(state=tk.DISABLED)

    def prev_page(self):
        if self.current_page > 0:
            self.current_page -= 1
            self.update_page_nav()
            self.render_current_page_preview()

    def next_page(self):
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.update_page_nav()
            self.render_current_page_preview()

    def render_current_page_preview(self):
        if not self.pdf_path or self.total_pages == 0:
            return

        try:
            self.raw_page_img = self.processor.extract_page_image(self.pdf_path, self.current_page, dpi=150)
            self.apply_clean_and_render()
        except Exception as e:
            self.lbl_status.config(text=f"Error rendering page: {e}")

    def apply_clean_and_render(self):
        if self.raw_page_img is None:
            return

        # Update cleaner parameters
        self.cleaner.mode = CleaningMode(self.mode_var.get())
        self.cleaner.sauvola_k = float(self.slider_k.get())
        self.cleaner.white_cutoff = int(self.slider_white.get())
        self.cleaner.black_cutoff = int(self.slider_black.get())
        self.cleaner.despeckle = self.despeckle_var.get()
        self.cleaner.adaptive_thresholding = self.adaptive_var.get()
        self.cleaner.clean_anomalies = self.anomaly_var.get()
        self.cleaner.contrast_threshold = float(self.slider_contrast.get())

        # Clean image
        self.cleaned_page_img = self.processor.clean_single_page(self.raw_page_img)

        # Draw to canvases
        self._draw_image_on_canvas(self.raw_page_img, self.orig_canvas)
        self._draw_image_on_canvas(self.cleaned_page_img, self.clean_canvas)

    def _draw_image_on_canvas(self, cv_img: np.ndarray, canvas: tk.Canvas):
        canvas.update_idletasks()
        cw = max(200, canvas.winfo_width())
        ch = max(200, canvas.winfo_height())

        h, w = cv_img.shape[:2]
        scale = min(cw / w, ch / h) * 0.95
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))

        resized = cv2.resize(cv_img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        if len(resized.shape) == 2:
            pil_img = Image.fromarray(resized, mode="L")
        else:
            pil_img = Image.fromarray(cv2.cvtColor(resized, cv2.COLOR_BGR2RGB))

        tk_img = ImageTk.PhotoImage(pil_img)
        canvas.delete("all")
        canvas.create_image(cw // 2, ch // 2, anchor=tk.CENTER, image=tk_img)
        canvas.image = tk_img

    def on_slider_change(self):
        if self.preview_update_timer:
            self.root.after_cancel(self.preview_update_timer)
        self.preview_update_timer = self.root.after(80, self.apply_clean_and_render)

    def on_slider_k(self, val):
        self.lbl_k.config(text=f"Sauvola Sensitivity (k): {float(val):.2f}")
        self.on_slider_change()

    def on_slider_white(self, val):
        self.lbl_white.config(text=f"White Cutoff: {int(float(val))}")
        self.on_slider_change()

    def on_slider_black(self, val):
        self.lbl_black.config(text=f"Black Cutoff: {int(float(val))}")
        self.on_slider_change()

    def on_slider_contrast(self, val):
        self.lbl_contrast.config(text=f"Base Optical Threshold: {float(val):.0f}")
        self.on_slider_change()

    def on_mode_change(self):
        self.apply_clean_and_render()

    def on_checkbox_change(self):
        self.apply_clean_and_render()

    def on_dpi_change(self):
        self.processor.dpi = int(self.dpi_var.get())

    def export_pdf(self):
        if not self.pdf_path or self.total_pages == 0:
            return

        default_out = os.path.splitext(self.pdf_path)[0] + "_cleaned.pdf"
        out_path = filedialog.asksaveasfilename(
            title="Save Cleaned PDF As",
            defaultextension=".pdf",
            initialfile=os.path.basename(default_out),
            filetypes=[("PDF files", "*.pdf")]
        )
        if not out_path:
            return

        selected_pages = None
        range_text = self.page_range_var.get().strip()
        if range_text and range_text.lower() != "all":
            try:
                from clean_pdf import parse_page_range
                selected_pages = parse_page_range(range_text, self.total_pages)
            except Exception as e:
                messagebox.showerror("Invalid Page Range", f"Could not parse page range '{range_text}': {e}")
                return

        self.btn_export.config(state=tk.DISABLED)
        self.progress_bar["value"] = 0

        def progress_cb(current, total, msg):
            def update():
                self.progress_bar["maximum"] = total
                self.progress_bar["value"] = current
                self.lbl_status.config(text=msg)
            self.root.after(0, update)

        def worker():
            try:
                self.processor.dpi = int(self.dpi_var.get())
                self.processor.process_pdf(
                    input_pdf_path=self.pdf_path,
                    output_pdf_path=out_path,
                    pages=selected_pages,
                    progress_callback=progress_cb
                )
                def done():
                    self.btn_export.config(state=tk.NORMAL)
                    self.lbl_status.config(text=f"Export complete: {os.path.basename(out_path)}")
                    if messagebox.askyesno("Success", f"Cleaned PDF successfully created!\n\nLocation: {out_path}\n\nWould you like to open it now?"):
                        try:
                            os.startfile(out_path)
                        except Exception:
                            pass
                self.root.after(0, done)
            except Exception as err:
                def on_error():
                    self.btn_export.config(state=tk.NORMAL)
                    messagebox.showerror("Export Error", str(err))
                    self.lbl_status.config(text=f"Error: {err}")
                self.root.after(0, on_error)

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()


def main(initial_pdf: str = None):
    root = tk.Tk()
    app = PDFCleanerGUI(root, initial_pdf=initial_pdf)
    root.mainloop()


if __name__ == "__main__":
    initial_file = sys.argv[1] if len(sys.argv) > 1 else None
    main(initial_file)
