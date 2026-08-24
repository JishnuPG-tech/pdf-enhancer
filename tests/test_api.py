"""
Test suite for FastAPI backend and frontend static mounting.
"""

import os
import unittest
from fastapi.testclient import TestClient
from api_server import app

class TestAPIServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.sample_pdf = "RATIO & Proportion.pdf"

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("engine", data)

    def test_upload_and_preview_workflow(self):
        if not os.path.exists(self.sample_pdf):
            self.skipTest("Sample PDF not found")

        with open(self.sample_pdf, "rb") as f:
            res = self.client.post(
                "/api/upload",
                files={"file": ("test.pdf", f, "application/pdf")}
            )

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("session_id", data)
        self.assertGreater(data["total_pages"], 0)
        self.assertGreater(len(data["thumbnails"]), 0)

        session_id = data["session_id"]

        # Test preview endpoint
        prev_res = self.client.post(
            "/api/preview",
            json={
                "session_id": session_id,
                "page": 0,
                "mode": "laser",
                "adaptive": True,
                "word_envelope": True,
                "dpi": 150
            }
        )
        self.assertEqual(prev_res.status_code, 200)
        prev_data = prev_res.json()
        self.assertIn("raw_image", prev_data)
        self.assertIn("clean_image", prev_data)
        self.assertIn("telemetry", prev_data)
        self.assertEqual(prev_data["telemetry"]["char_preservation_rate"], 100.0)

    def test_frontend_static_serving(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("<!doctype html>", res.text.lower())


if __name__ == "__main__":
    unittest.main()
