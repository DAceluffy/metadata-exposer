from PIL import Image, ExifTags

im = Image.new('RGB', (1200, 800), color=(18, 18, 24))
exif = im.getexif()

# Tag IDs
# 0x010f: Make, 0x0110: Model, 0x0131: Software, 0x013b: Artist
exif[0x010F] = "Leica Camera AG"
exif[0x0110] = "Leica Q3 Monochrom"
exif[0x0131] = "EXPOSER Demo 1.0"
exif[0x013B] = "Agentic Minimalist"
exif[0x9003] = "2026:09:22 01:25:00"

# GPS IFD
# 0x8825 is GPSInfo tag in Exif
gps_ifd = {
    1: 'N',
    2: (19.0, 4.0, 33.6),
    3: 'E',
    4: (72.0, 52.0, 39.0),
    6: 15.0
}
exif[0x8825] = gps_ifd

im.save("sample_photo_with_gps.jpg", "JPEG", exif=exif)
print("Successfully generated sample_photo_with_gps.jpg using Pillow native EXIF")
