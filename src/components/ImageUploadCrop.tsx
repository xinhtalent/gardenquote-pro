import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadCropProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onImageBlobReady?: (blob: Blob) => void;
  uploadMode?: 'immediate' | 'deferred';
}

export function ImageUploadCrop({ currentImage, onImageChange, onImageBlobReady, uploadMode = 'immediate' }: ImageUploadCropProps) {
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

  const getCroppedWebPBlob = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);

    // 1) Draw the cropped area to an intermediate canvas
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) throw new Error('No 2d context');

    cropCanvas.width = pixelCrop.width;
    cropCanvas.height = pixelCrop.height;
    cropCtx.drawImage(
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

    // 2) Resize to max 512px on the longest side for a crisp thumbnail
    const MAX_DIMENSION = 512;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(cropCanvas.width, cropCanvas.height));
    const targetWidth = Math.max(1, Math.round(cropCanvas.width * scale));
    const targetHeight = Math.max(1, Math.round(cropCanvas.height * scale));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = targetWidth;
    outCanvas.height = targetHeight;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('No 2d context');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(cropCanvas, 0, 0, targetWidth, targetHeight);

    // 3) Export as WebP (~0.75 quality)
    const blob: Blob = await new Promise((resolve, reject) => {
      outCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to export image'))), 'image/webp', 0.75);
    });
    return blob;
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      // 1) Build WebP thumbnail blob (max 512px)
      const webpBlob = await getCroppedWebPBlob(imageSrc, croppedAreaPixels);

      if (uploadMode === 'deferred') {
        // Defer upload to parent on final save; provide preview and blob
        const previewUrl = URL.createObjectURL(webpBlob);
        onImageChange(previewUrl);
        onImageBlobReady?.(webpBlob);
      } else {
        // Immediate upload flow (default)
        const fileName = `items/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, webpBlob, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Không thể tải ảnh lên. Vui lòng kiểm tra bucket \'item-images\'.');
          return;
        }

        const { data: pub } = supabase.storage.from('item-images').getPublicUrl(fileName);
        const publicUrl = pub?.publicUrl;
        if (!publicUrl) {
          toast.error('Không thể lấy URL công khai của ảnh.');
          return;
        }

        onImageChange(publicUrl);
      }

      setIsDialogOpen(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      console.error('Error cropping/uploading image:', error);
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
