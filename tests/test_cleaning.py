"""
Test suite for Document PDF Cleaner & AI Anomaly Tracker.
Verifies illumination flattening, Sauvola adaptive binarization,
optical contrast bleed-through gating, and AI spatial anomaly tracking.
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

    def test_ai_spatial_anomaly_tracking(self):
        """Test that anomalies in whitespace are erased while text-line punctuation is preserved."""
        h, w = 500, 500
        canvas = np.full((h, w), 255, dtype=np.uint8)
        
        # Line 1: Text with i-dot
        cv2.putText(canvas, "Probability Theory", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 0, 2)
        canvas[134:137, 85:88] = 0  # i-dot
        
        # Line 2: Text with period
        cv2.putText(canvas, "Chapter 1", (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 0, 2)
        canvas[297:301, 166:170] = 0  # period immediately following "Chapter 1"
        
        # Stray anomalies in inter-line whitespace (y=220) and top/bottom margin
        canvas[48:52, 250:254] = 0
        canvas[218:222, 120:124] = 0
        canvas[430:434, 300:304] = 0
        
        cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            filter_bleedthrough=False,
            clean_anomalies=True
        )
        cleaned = cleaner.track_and_clean_anomalies(canvas)
        
        # Stray anomalies must be erased into 255
        self.assertEqual(cleaned[50, 252], 255, "Top margin anomaly must be erased")
        self.assertEqual(cleaned[220, 122], 255, "Inter-line anomaly must be erased")
        self.assertEqual(cleaned[432, 302], 255, "Bottom margin anomaly must be erased")
        
        # Punctuation inside line envelope must be preserved as 0
        self.assertEqual(cleaned[135, 86], 0, "i-dot inside text line envelope must be preserved")
        self.assertEqual(cleaned[299, 168], 0, "Period inside text line envelope must be preserved")

    def test_pdf_processing_real_document(self):
        """Test full pipeline on real document pages."""
        if not os.path.exists(self.sample_pdf):
            self.skipTest(f"Sample file {self.sample_pdf} not found.")

        cleaner = DocumentCleaner(
            mode=CleaningMode.LASER,
            filter_bleedthrough=True,
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
