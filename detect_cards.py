#!/usr/bin/env python3

import sys
import torch
import json
import platform
import pathlib


def main():
    if len(sys.argv) < 3:
        print("Usage: python detect_cards.py <weights_path> <image_path>")
        sys.exit(1)

    weights_path = sys.argv[1]
    image_path = sys.argv[2]

        
    if platform.system() == 'Windows':
        pathlib.PosixPath = pathlib.WindowsPath
    else:
        pathlib.WindowsPath = pathlib.PosixPath

    model_path = pathlib.Path(weights_path).resolve()
    model_path = str(model_path)

    # Carica il modello
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path, force_reload=False)

    # Inference
    results = model(image_path)

    # results.xyxy[0] contiene i bounding box e le predizioni (x1, y1, x2, y2, conf, class)
    # results.names è l'elenco dei nomi di classe
    preds = results.xyxy[0]

    if len(preds) == 0:
        # Nessun rilevamento
        output = {
            "cardName": None,
            "confidence": 0
        }
        print(json.dumps(output))
        return

    # Trova la detection con confidenza massima
    best_detection = None
    max_conf = -1

    for *box, conf, cls in preds:
        if conf > max_conf:
            max_conf = conf
            best_detection = int(cls.item())

    # Nome della classe corrispondente
    class_name = results.names[best_detection]

    output = {
        "cardName": class_name,
        "confidence": float(max_conf)
    }

    # Stampo in formato JSON
    print(json.dumps(output))

if __name__ == "__main__":
    main()
