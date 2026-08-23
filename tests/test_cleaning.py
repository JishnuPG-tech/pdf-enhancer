"""
Test suite for Document PDF Cleaner & AI Page-Adaptive Engine.
Verifies illumination flattening, Sauvola binarization, noise energy profiling,
word-level envelope anomaly tracking, and high-DPI document PDF compilation.
"""

import os
import unittest
import numpy as np
import cv2
import fitz

from pdf_cleaner import DocumentCleaner, CleaningMode, PDFProcessor


class TestPDFCleaner(unittest.TestCase):
    def setUp(self):
        self.sample_pdf = "RATIO & Proportion.pdf"
        self.output_pdf = "temp_test_output.pdf"

    def tearDown(self):
        if os.path.exists(self.output_pdf):
            try:
                os.remove(self.output_pdf)
            except Exception:
                pass

    def test_cleaner_synthetic_shadow_removal(self):
        """Test on synthetic image with simulated diagonal lighting gradient."""
        h, w = 400, 400
        grad = np.linspace(100, 200, w, dtype=np.float32)
        grad_img = np.tile(grad, (h, 1))
        
        img = grad_img.astype(np.uint8)
        cv2.putText(img, "TEST 123", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 2.0, 30, 4)
        
        cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            sauvola_k=0.15
        )
        cleaned = cleaner.clean_image(img)
        
        white_ratio = (cleaned == 255).mean()
        self.assertGreater(white_ratio, 0.90, "Background should be overwhelmingly pure white 255")
        
        black_ratio = (cleaned == 0).mean()
        self.assertGreater(black_ratio, 0.01, "Text should exist as pure black 0")
        
        gray_ratio = ((cleaned > 0) & (cleaned < 255)).mean()
        self.assertEqual(gray_ratio, 0.0, "Laser mode must have 0 gray pixels")

    def test_ai_noise_energy_profiling(self):
        """Test that page noise energy correctly differentiates clean pages from heavy noise."""
        h, w = 300, 300
        bg = np.full((h, w), 220, dtype=np.uint8)
        
        # 1. Clean image
        clean_img = bg.copy()
        cv2.putText(clean_img, "Title", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.0, 40, 2)
        
        # 2. Heavy bleedthrough image (lots of faint dots)
        noisy_img = bg.copy()
        cv2.putText(noisy_img, "Title", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.0, 40, 2)
        noisy_img[::4, ::4] = 195  # Faint bleedthrough mesh
        
        cleaner = DocumentCleaner()
        
        bg_clean = cleaner.estimate_background(clean_img)
        ne_clean, dt_clean = cleaner.compute_page_noise_energy(clean_img, bg_clean)
        
        bg_noisy = cleaner.estimate_background(noisy_img)
        ne_noisy, dt_noisy = cleaner.compute_page_noise_energy(noisy_img, bg_noisy)
        
        self.assertLess(ne_clean, ne_noisy, "Clean page must have lower noise energy than heavy page")
        self.assertGreater(dt_noisy, dt_clean, "Heavy page must dynamically trigger a higher threshold")

    def test_pdf_processing_real_document(self):
        """Test full pipeline on real document pages."""
        if not os.path.exists(self.sample_pdf):
            self.skipTest(f"Sample file {self.sample_pdf} not found.")

        cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            adaptive_thresholding=True,
            clean_anomalies=True
        )
        processor = PDFProcessor(cleaner=cleaner, dpi=150)
        out = processor.process_pdf(
            input_pdf_path=self.sample_pdf,
            output_pdf_path=self.output_pdf,
            pages=[1, 9]
        )
        
        self.assertTrue(os.path.exists(out), "Output PDF must exist.")
        
        with fitz.open(out) as doc:
            self.assertEqual(len(doc), 2, "Output PDF must contain exactly 2 pages.")
            pix = doc[0].get_pixmap(colorspace=fitz.csGRAY)
            samples = np.frombuffer(pix.samples, dtype=np.uint8)
            white_ratio = (samples >= 250).mean()
            self.assertGreater(white_ratio, 0.88, "Rendered page must have >88% pure white background.")


if __name__ == "__main__":
    unittest.main()
