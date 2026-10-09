import os
import cv2
import pytest
from routers.model import DATASET_DIR, MODEL_PATH, HAAR

def test_haar_cascade_file_exists():
    assert os.path.exists(HAAR), f"Haar cascade XML not found at {HAAR}"

def test_model_path_resolution():
    assert DATASET_DIR is not None
    assert MODEL_PATH is not None
    assert os.path.exists(os.path.dirname(MODEL_PATH))

def test_lbph_recognizer_creation():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    assert recognizer is not None
    assert hasattr(recognizer, "train")
    assert hasattr(recognizer, "predict")
