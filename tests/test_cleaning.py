"""
Test suite for Document PDF Cleaner & Optical Contrast Bleed-Through Filter.
Verifies illumination flattening, Sauvola binarization, bleed-through dot removal,
and high-DPI document PDF compilation.
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

    def test_bleedthrough_dot_removal(self):
        """Test that low-contrast bleed-through dots are removed while high-contrast text is kept."""
        h, w = 300, 300
        # Simulated white paper background
        bg = np.full((h, w), 220, dtype=np.uint8)
        img = bg.copy()
        
        # High contrast real text (intensity 40, contrast = 180)
        cv2.putText(img, "Formula", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.0, 40, 2)
        
        # High contrast i-dot (intensity 40, contrast = 180)
        img[125:128, 70:73] = 40
        
        # Faint low-contrast bleed-through dot in whitespace (intensity 198, contrast = 22)
        img[40:44, 150:154] = 198
        
        cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            filter_bleedthrough=True,
            contrast_threshold=38.0
        )
        cleaned = cleaner.clean_image(img)
        
        # Bleed-through dot at (42, 152) must be pure white 255
        self.assertEqual(cleaned[42, 152], 255, "Faint bleedthrough dot must be erased into pure white")
        
        # Real text and i-dot must be preserved as pure black 0
        self.assertEqual(cleaned[126, 71], 0, "High contrast punctuation/i-dot must be preserved")
        self.assertGreater((cleaned == 0).sum(), 50, "Real text strokes must be preserved")

    def test_pdf_processing_real_document(self):
        """Test full pipeline on real document pages."""
        if not os.path.exists(self.sample_pdf):
            self.skipTest(f"Sample file {self.sample_pdf} not found.")

        cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            filter_bleedthrough=True
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
