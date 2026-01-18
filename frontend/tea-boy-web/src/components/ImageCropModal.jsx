import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Crop, X, Check, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

const ImageCropModal = ({ image, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );
      onComplete(croppedImage);
    } catch (e) {
      console.error('Error creating cropped image:', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Crop className="w-5 h-5" />
          Crop Image
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          cropShape="round"
          showGrid={false}
        />
      </div>

      {/* Controls */}
      <div className="bg-slate-800 px-4 py-4 space-y-4">
        {/* Zoom Control */}
        <div className="flex items-center gap-3">
          <ZoomOut className="w-5 h-5 text-white" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <ZoomIn className="w-5 h-5 text-white" />
        </div>

        {/* Rotation Control */}
        <div className="flex items-center gap-3">
          <RotateCw className="w-5 h-5 text-white" />
          <input
            type="range"
            value={rotation}
            min={0}
            max={360}
            step={1}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-white text-sm w-12 text-right">{rotation}°</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            onClick={createCroppedImage}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to create cropped image
const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export default ImageCropModal;
