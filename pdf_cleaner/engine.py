"""
Core document cleaning and binarization engine.
Handles non-uniform lighting normalization, adaptive Sauvola binarization,
contrast curves, safe despeckling, and margin crop.
"""

import cv2
import numpy as np
from enum import Enum
from typing import Optional, Union


class CleaningMode(str, Enum):
    LASER = "laser"           # Pure binary (0 or 255) - razor sharp for printing
    SMOOTH = "smooth"         # Pure white background (255) with anti-aliased text
    COLOR = "color"           # Pure white background with original color text/diagrams
    ADAPTIVE = "adaptive"     # Adaptive Gaussian thresholding


class DocumentCleaner:
    def __init__(
        self,
        mode: Union[CleaningMode, str] = CleaningMode.LASER,
        sauvola_k: float = 0.15,
        sauvola_window: int = 31,
        white_cutoff: int = 210,
        black_cutoff: int = 80,
        despeckle: bool = True,
        min_speckle_size: int = 3,
        margin_percent: float = 0.008,
        contrast_boost: float = 1.0,
        deskew: bool = False
    ):
        if isinstance(mode, str):
            mode = CleaningMode(mode.lower())
        self.mode = mode
        self.sauvola_k = sauvola_k
        self.sauvola_window = sauvola_window
        self.white_cutoff = white_cutoff
        self.black_cutoff = black_cutoff
        self.despeckle = despeckle
        self.min_speckle_size = min_speckle_size
        self.margin_percent = margin_percent
        self.contrast_boost = contrast_boost
        self.deskew = deskew

    def estimate_background(self, gray: np.ndarray) -> np.ndarray:
        """
        Estimates the background illumination using morphological closing and Gaussian blur.
        Kernel size adapts automatically to image resolution.
        """
        h, w = gray.shape
        kernel_size = max(21, int(w / 40))
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        bg = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
        bg = cv2.GaussianBlur(bg, (kernel_size, kernel_size), 0)
        return bg

    def normalize_illumination(self, gray: np.ndarray, bg: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Flattens shadows and lighting gradients via division normalization.
        """
        if bg is None:
            bg = self.estimate_background(gray)
        norm = 255.0 * (gray.astype(np.float32) / (bg.astype(np.float32) + 1e-5))
        return np.clip(norm, 0, 255).astype(np.uint8)

    def apply_sauvola(self, norm: np.ndarray) -> np.ndarray:
        """
        High-speed vectorized Sauvola adaptive binarization for document text.
        Formula: T = mean * (1 + k * (std / 128 - 1))
        """
        h, w = norm.shape
        win = max(15, int(w / 50)) if self.sauvola_window <= 0 else self.sauvola_window
        if win % 2 == 0:
            win += 1
            
        norm_f = norm.astype(np.float32)
        mean = cv2.blur(norm_f, (win, win))
        sqmean = cv2.blur(norm_f ** 2, (win, win))
        var = np.maximum(0.0, sqmean - (mean ** 2))
        std = np.sqrt(var)
        
        thresh = mean * (1.0 + self.sauvola_k * (std / 128.0 - 1.0))
        binary = np.where(norm_f < thresh, 0, 255).astype(np.uint8)
        return binary

    def remove_speckles(self, binary: np.ndarray) -> np.ndarray:
        """
        Removes small camera noise / dust artifacts while strictly preserving punctuation & dots.
        """
        inv = 255 - binary
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(inv, connectivity=8)
        clean = np.full_like(binary, 255)
        
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area >= self.min_speckle_size:
                clean[labels == i] = 0
                
        return clean

    def crop_margins(self, img: np.ndarray) -> np.ndarray:
        """
        Cleans extreme outer border shadows by whitening the outer margin edge.
        """
        if self.margin_percent <= 0:
            return img
            
        h, w = img.shape[:2]
        mx = int(w * self.margin_percent)
        my = int(h * self.margin_percent)
        
        if mx <= 0 or my <= 0:
            return img
            
        cleaned = img.copy()
        if len(img.shape) == 2:
            cleaned[:my, :] = 255
            cleaned[-my:, :] = 255
            cleaned[:, :mx] = 255
            cleaned[:, -mx:] = 255
        else:
            cleaned[:my, :] = (255, 255, 255)
            cleaned[-my:, :] = (255, 255, 255)
            cleaned[:, :mx] = (255, 255, 255)
            cleaned[:, -mx:] = (255, 255, 255)
            
        return cleaned

    def apply_smooth_levels(self, norm: np.ndarray) -> np.ndarray:
        """
        Pushes background to pure 255 (#FFFFFF) and text to deep black (#000000)
        with smooth anti-aliased edge transition.
        """
        table = np.zeros(256, dtype=np.uint8)
        b_cut = max(0, min(250, self.black_cutoff))
        w_cut = max(b_cut + 1, min(255, self.white_cutoff))
        
        for i in range(256):
            if i >= w_cut:
                table[i] = 255
            elif i <= b_cut:
                table[i] = 0
            else:
                ratio = (i - b_cut) / float(w_cut - b_cut)
                if self.contrast_boost != 1.0:
                    ratio = ratio ** self.contrast_boost
                table[i] = int(np.clip(ratio * 255.0, 0, 255))
                
        return cv2.LUT(norm, table)

    def clean_image(self, img: np.ndarray) -> np.ndarray:
        """
        Runs the clean Phase 1 pipeline on a single image.
        Preserves authentic page geometry, aspect ratio, and layout naturally.
        """
        is_color = (len(img.shape) == 3 and img.shape[2] == 3)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if is_color else img.copy()

        bg = self.estimate_background(gray)
        norm = self.normalize_illumination(gray, bg)

        if self.mode == CleaningMode.LASER:
            result = self.apply_sauvola(norm)
            if self.despeckle:
                result = self.remove_speckles(result)
            result = self.crop_margins(result)

        elif self.mode == CleaningMode.SMOOTH:
            result = self.apply_smooth_levels(norm)
            result = self.crop_margins(result)

        elif self.mode == CleaningMode.ADAPTIVE:
            win = max(15, int(gray.shape[1] / 60))
            if win % 2 == 0:
                win += 1
            result = cv2.adaptiveThreshold(
                norm, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, win, 12
            )
            if self.despeckle:
                result = self.remove_speckles(result)
            result = self.crop_margins(result)

        elif self.mode == CleaningMode.COLOR and is_color:
            bg_f = bg.astype(np.float32) + 1e-5
            channels = cv2.split(img)
            norm_channels = []

            table = np.zeros(256, dtype=np.uint8)
            for i in range(256):
                if i >= self.white_cutoff:
                    table[i] = 255
                elif i <= self.black_cutoff:
                    table[i] = 0
                else:
                    table[i] = int(255 * (i - self.black_cutoff) / (self.white_cutoff - self.black_cutoff))

            for ch in channels:
                ch_norm = np.clip(255.0 * (ch.astype(np.float32) / bg_f), 0, 255).astype(np.uint8)
                ch_norm = cv2.LUT(ch_norm, table)
                norm_channels.append(ch_norm)
            result = cv2.merge(norm_channels)
            result = self.crop_margins(result)
        else:
            result = self.apply_smooth_levels(norm)
            result = self.crop_margins(result)

        return result
