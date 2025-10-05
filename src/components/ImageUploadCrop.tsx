import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Check } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadCropProps {
  currentImage?: string;
  onImageChange: (imageDataUrl: string) => void;
}

export function ImageUploadCrop({ currentImage, onImageChange }: ImageUploadCropProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onImageChange(croppedImageDataUrl);
      setIsDialogOpen(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error("Có lỗi khi xử lý ảnh");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Tải ảnh lên
        </Button>
        {currentImage && currentImage !== "/placeholder.svg" && (
          <div className="w-16 h-16 rounded border overflow-hidden shrink-0">
            <img
              src={currentImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cắt ảnh</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[400px] bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phóng to/thu nhỏ</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button type="button" onClick={handleCropSave}>
              <Check className="w-4 h-4 mr-2" />
              Xong
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
