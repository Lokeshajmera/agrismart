import os
import json
import numpy as np
import base64
from io import BytesIO
from PIL import Image, ImageDraw
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def generate_ndvi_raster(width, height, polygon):
    """
    Generates a simulated NDVI raster clipped to the polygon.
    NDVI: -1 to 1 (Typical crops 0.2 to 0.8)
    """
    # Create base noise for plant health
    # Using small scale for blocky "crop" look or large scale for smooth
    x = np.linspace(0, 5, width)
    y = np.linspace(0, 5, height)
    xv, yv = np.meshgrid(x, y)
    
    # Simulate health patterns (higher is healthier)
    raster = 0.4 + 0.3 * np.sin(xv) * np.cos(yv) + 0.1 * np.random.normal(size=(height, width))
    raster = np.clip(raster, -1, 1)
    
    # Map NDVI to RGB
    # NDVI < 0.2: Red/Brown (Unhealthy)
    # 0.2 < NDVI < 0.5: Yellow/Light Green
    # NDVI > 0.5: Deep Green (Healthy)
    
    img_array = np.zeros((height, width, 4), dtype=np.uint8)
    for i in range(height):
        for j in range(width):
            val = raster[i, j]
            if val < 0.2:
                img_array[i, j] = [200, 50, 50, 255] # Reddish
            elif val < 0.5:
                img_array[i, j] = [230, 230, 50, 255] # Yellowish
            else:
                img_array[i, j] = [34, 139, 34, 255] # Forest Green
                
    return img_array

def generate_ndwi_raster(width, height, polygon):
    """
    Generates a simulated NDWI raster clipped to the polygon.
    NDWI: -1 to 1 (Higher is more water)
    """
    x = np.linspace(0, 4, width)
    y = np.linspace(0, 4, height)
    xv, yv = np.meshgrid(x, y)
    
    raster = 0.2 + 0.4 * np.cos(xv) * np.sin(yv) + 0.1 * np.random.normal(size=(height, width))
    raster = np.clip(raster, -1, 1)
    
    img_array = np.zeros((height, width, 4), dtype=np.uint8)
    for i in range(height):
        for j in range(width):
            val = raster[i, j]
            # NDWI Color mapping: Blue scale
            blue_intensity = int(max(0, min(255, (val + 1) * 127)))
            img_array[i, j] = [50, 100, blue_intensity, 255]
            
    return img_array

def clip_to_polygon(img_array, polygon, bbox):
    """
    Masks pixels outside the polygon.
    bbox: [min_lat, min_lng, max_lat, max_lng]
    """
    height, width = img_array.shape[:2]
    min_lat, min_lng, max_lat, max_lng = bbox
    
    # Create alpha mask using PIL
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Project polygon coordinates to pixel space
    pixel_coords = []
    for lat, lng in polygon:
        px = int((lng - min_lng) / (max_lng - min_lng) * width)
        py = int((max_lat - lat) / (max_lat - min_lat) * height)
        pixel_coords.append((px, py))
        
    draw.polygon(pixel_coords, outline=255, fill=255)
    
    mask_np = np.array(mask)
    img_array[:, :, 3] = mask_np # Update Alpha channel
    
    return img_array

@app.route('/api/satellite/analyze', methods=['POST'])
def analyze():
    data = request.json
    if not data or 'coordinates' not in data:
        return jsonify({"error": "Coordinates required"}), 400
        
    polygon = data['coordinates'] # [[lat, lng], ...]
    analysis_type = data.get('type', 'ndvi') # ndvi or ndwi
    
    # 1. Compute Bounding Box
    lats = [c[0] for c in polygon]
    lngs = [c[1] for c in polygon]
    bbox = [min(lats), min(lngs), max(lats), max(lngs)]
    
    # 2. Define Output resolution (simulated)
    width, height = 512, 512
    
    # 3. Generate Analysis Raster
    if analysis_type == 'ndvi':
        img_array = generate_ndvi_raster(width, height, polygon)
    else:
        img_array = generate_ndwi_raster(width, height, polygon)
        
    # 4. Clip to Farm Boundary
    clipped_array = clip_to_polygon(img_array, polygon, bbox)
    
    # 5. Encode to PNG
    img = Image.fromarray(clipped_array)
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return jsonify({
        "image": f"data:image/png;base64,{img_str}",
        "bbox": bbox,
        "type": analysis_type
    })

if __name__ == '__main__':
    print("🛰️ Satellite Analysis Service starting on port 5001...")
    app.run(port=5001, debug=True)
