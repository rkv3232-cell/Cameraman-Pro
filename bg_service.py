import os
import io
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModelForImageSegmentation
from torchvision.transforms.functional import normalize

app = FastAPI(title="Cameraman Pro - Background Removal API")

# Enable CORS for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading RMBG-1.4 Model... Please wait.")
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model = AutoModelForImageSegmentation.from_pretrained("briaai/RMBG-1.4", trust_remote_code=True)
model.to(device)
model.eval()
print("Model loaded successfully on", device)

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

@app.post("/api/remove-bg")
async def remove_bg(image: UploadFile = File(...)):
    """
    Takes an uploaded image, processes it through RMBG-1.4,
    and returns the background-removed transparent PNG.
    """
    try:
        # Read the uploaded image
        contents = await image.read()
        orig_image = Image.open(io.BytesIO(contents)).convert('RGBA')
        
        # Convert to RGB numpy array for the model
        orig_im = np.array(orig_image.convert('RGB'))
        orig_im_size = orig_im.shape[0:2]
        model_input_size = [1024, 1024]
        
        # Preprocess
        img_tensor = preprocess_image(orig_im, model_input_size).to(device)
        
        # Inference
        with torch.no_grad():
            result = model(img_tensor)
            
        # Postprocess
        result_mask = postprocess_image(result[0][0], orig_im_size)
        
        # Apply mask
        pil_mask_im = Image.fromarray(result_mask).convert('L')
        no_bg_image = orig_image.copy()
        no_bg_image.putalpha(pil_mask_im)
        
        # Output to BytesIO
        output_io = io.BytesIO()
        no_bg_image.save(output_io, format="PNG")
        output_io.seek(0)
        
        return Response(content=output_io.getvalue(), media_type="image/png")
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return Response(content=f"Internal Server Error: {str(e)}", status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
