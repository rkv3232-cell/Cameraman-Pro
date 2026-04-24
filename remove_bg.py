import os
import io
import torch
import torch.nn.functional as F
from PIL import Image
from skimage import io as skio
import numpy as np
from transformers import AutoModelForImageSegmentation
from torchvision.transforms.functional import normalize

def preprocess_image(im: np.ndarray, model_input_size: list) -> torch.Tensor:
    if len(im.shape) < 3:
        im = im[:, :, np.newaxis]
    im_tensor = torch.tensor(im, dtype=torch.float32).permute(2,0,1)
    im_tensor = F.interpolate(torch.unsqueeze(im_tensor,0), size=model_input_size, mode='bilinear')
    image = torch.divide(im_tensor,255.0)
    image = normalize(image,[0.5,0.5,0.5],[1.0,1.0,1.0])
    return image

def postprocess_image(result: torch.Tensor, im_size: list)-> np.ndarray:
    result = torch.squeeze(F.interpolate(result, size=im_size, mode='bilinear') ,0)
    ma = torch.max(result)
    mi = torch.min(result)
    result = (result-mi)/(ma-mi)
    im_array = (result*255).permute(1,2,0).cpu().data.numpy().astype(np.uint8)
    im_array = np.squeeze(im_array)
    return im_array

def remove_background(image_path: str, output_path: str):
    print(f"Loading model... (this may take a moment)")
    model = AutoModelForImageSegmentation.from_pretrained("briaai/RMBG-1.4", trust_remote_code=True)
    
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    print(f"Loading image from {image_path}...")
    orig_im = skio.imread(image_path)
    orig_im_size = orig_im.shape[0:2]
    model_input_size = [1024, 1024]
    
    print("Preprocessing image...")
    image = preprocess_image(orig_im, model_input_size).to(device)

    print("Running inference...")
    with torch.no_grad():
        result = model(image)

    print("Postprocessing image...")
    result_image = postprocess_image(result[0][0], orig_im_size)

    # Convert mask to PIL Image
    pil_mask_im = Image.fromarray(result_image)
    
    # Apply mask to original image
    # If using a URL, we need to load it properly with PIL
    import urllib.request
    if image_path.startswith('http'):
        req = urllib.request.Request(image_path, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            orig_image = Image.open(io.BytesIO(response.read())).convert('RGBA')
    else:
        orig_image = Image.open(image_path).convert('RGBA')

    no_bg_image = orig_image.copy()
    no_bg_image.putalpha(pil_mask_im)
    
    no_bg_image.save(output_path, "PNG")
    print(f"Success! Saved background-free image to: {output_path}")

if __name__ == "__main__":
    # Example usage specified by user
    sample_url = "https://farm5.staticflickr.com/4007/4322154488_997e69e4cf_z.jpg"
    output_png = "output_no_bg.png"
    try:
        remove_background(sample_url, output_png)
    except Exception as e:
        print(f"Error: {e}")
