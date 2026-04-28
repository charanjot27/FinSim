import sys
import glob
from PIL import Image

def remove_bg(img_path):
    print(f"Processing {img_path}...")
    img = Image.open(img_path).convert("RGBA")
    data = img.load()
    width, height = img.size

    # The background color is typically at the corners
    bg_color = data[0, 0]
    
    # We will do a BFS flood fill from the borders to find all background pixels
    # and set them to transparent. We'll use a small tolerance because AI generated
    # backgrounds might have slight noise.
    
    visited = set()
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    
    for start_node in queue:
        if start_node not in visited:
            q = [start_node]
            while q:
                x, y = q.pop(0)
                if (x, y) in visited:
                    continue
                
                visited.add((x, y))
                
                r, g, b, a = data[x, y]
                
                # Check tolerance
                diff = abs(r - bg_color[0]) + abs(g - bg_color[1]) + abs(b - bg_color[2])
                if diff < 30: # tolerance
                    data[x, y] = (r, g, b, 0) # Make transparent
                    
                    # Add neighbors
                    if x > 0: q.append((x-1, y))
                    if x < width-1: q.append((x+1, y))
                    if y > 0: q.append((x, y-1))
                    if y < height-1: q.append((x, y+1))
                    
    img.save(img_path)
    print(f"Saved {img_path}")

if __name__ == "__main__":
    assets = glob.glob('public/assets/*.png')
    for asset in assets:
        remove_bg(asset)
