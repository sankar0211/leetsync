import sys
from PIL import Image, ImageDraw, ImageFilter

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    padded = Image.new("RGB", (w+2, h+2), (255, 255, 255))
    padded.paste(img.convert("RGB"), (1, 1))
    
    ImageDraw.floodfill(padded, (0, 0), (0, 0, 0), thresh=30)
    
    mask = padded.convert("L")
    mask = mask.point(lambda p: 255 if p > 0 else 0)
    mask = mask.crop((1, 1, w+1, h+1))
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    
    img.putalpha(mask)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

if __name__ == "__main__":
    if len(sys.argv) == 3:
        remove_white_bg(sys.argv[1], sys.argv[2])
