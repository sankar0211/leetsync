from PIL import Image, ImageDraw, ImageFilter

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # Create a padded image to ensure floodfill reaches all edges
    padded = Image.new("RGB", (w+2, h+2), (255, 255, 255))
    padded.paste(img.convert("RGB"), (1, 1))
    
    # Floodfill from top-left (0,0) which is guaranteed to be background
    ImageDraw.floodfill(padded, (0, 0), (0, 0, 0), thresh=30)
    
    # Convert to grayscale mask: background is 0 (black), foreground is >0
    mask = padded.convert("L")
    
    # Threshold mask: anything > 0 becomes 255 (opaque foreground)
    mask = mask.point(lambda p: 255 if p > 0 else 0)
    
    # Crop back to original size
    mask = mask.crop((1, 1, w+1, h+1))
    
    # Apply a tiny blur to anti-alias the harsh mask edges
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    
    # Apply mask to alpha channel
    img.putalpha(mask)
    
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

try:
    remove_white_bg("C:/Users/sanka/.gemini/antigravity-ide/brain/8c7e5fb4-d841-42ce-bb76-e53499bb9f21/media__1786209617253.png", "public/logo-dark.png")
    remove_white_bg("C:/Users/sanka/.gemini/antigravity-ide/brain/8c7e5fb4-d841-42ce-bb76-e53499bb9f21/media__1786209608869.png", "public/logo-light.png")
except Exception as e:
    print(f"Error: {e}")
