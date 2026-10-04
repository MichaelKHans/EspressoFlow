import os
from PIL import Image, ImageDraw

def create_master_icon(size=1024):
    img = Image.new("RGBA", (size, size), (44, 32, 24, 255)) # #2C2018
    draw = ImageDraw.Draw(img)

    # Subtle radial warm glow
    center = size // 2
    for r in range(460, 80, -20):
        intensity = int(18 * (1 - (r / 460)))
        draw.ellipse([center - r, center - r, center + r, center + r], fill=(61 + intensity, 44 + intensity, 34 + intensity, 255))

    scale = size / 1024.0

    # Saucer base line
    s_x1, s_y1, s_x2, s_y2 = int(240 * scale), int(740 * scale), int(720 * scale), int(740 * scale)
    draw.line([s_x1, s_y1, s_x2, s_y2], fill=(250, 247, 242, 255), width=int(28 * scale))

    # Cup bowl
    c_left, c_top, c_right, c_bottom = int(280 * scale), int(420 * scale), int(680 * scale), int(680 * scale)
    draw.pieslice([c_left, c_top - int(60 * scale), c_right, c_bottom], 0, 180, fill=(250, 247, 242, 255))
    # Inner cup cutout (dark coffee surface)
    inner_pad = int(26 * scale)
    draw.pieslice([c_left + inner_pad, c_top - int(40 * scale), c_right - inner_pad, c_bottom - inner_pad], 0, 180, fill=(44, 32, 24, 255))
    # Rich Crema layer inside cup
    crema_pad = int(36 * scale)
    draw.ellipse([c_left + crema_pad, c_top + int(30 * scale), c_right - crema_pad, c_top + int(90 * scale)], fill=(194, 109, 82, 255))
    draw.ellipse([c_left + crema_pad + int(30 * scale), c_top + int(42 * scale), c_right - crema_pad - int(30 * scale), c_top + int(78 * scale)], fill=(218, 140, 100, 255))

    # Handle
    h_box = [int(630 * scale), int(420 * scale), int(770 * scale), int(580 * scale)]
    draw.arc(h_box, 270, 90, fill=(250, 247, 242, 255), width=int(26 * scale))

    # 3 Terracotta Steam Extraction Flow curves (#C26D52)
    steam_color = (194, 109, 82, 255)
    for off_x in [int(370 * scale), int(475 * scale), int(580 * scale)]:
        draw.arc([off_x - int(24 * scale), int(220 * scale), off_x + int(24 * scale), int(340 * scale)], 170, 350, fill=steam_color, width=int(20 * scale))
        draw.arc([off_x - int(24 * scale), int(310 * scale), off_x + int(24 * scale), int(400 * scale)], 0, 180, fill=steam_color, width=int(20 * scale))

    return img

def create_splash_screen(dest_path, master_icon, width=2732, height=2732):
    img = Image.new("RGBA", (width, height), (44, 32, 24, 255)) # #2C2018
    center_x = width // 2
    center_y = height // 2
    icon_resized = master_icon.resize((512, 512), Image.Resampling.LANCZOS)
    paste_pos = (center_x - icon_resized.width // 2, center_y - icon_resized.height // 2)
    img.paste(icon_resized, paste_pos, icon_resized)

    dirname = os.path.dirname(dest_path)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    img.convert("RGB").save(dest_path, "PNG")
    print(f"Generated splash: {dest_path} ({width}x{height})")

if __name__ == "__main__":
    master = create_master_icon(1024)

    # 1. iOS App Icon (1024x1024)
    ios_icon = os.path.join("ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png")
    master.convert("RGB").save(ios_icon, "PNG")
    print(f"Generated iOS icon: {ios_icon}")

    # 2. iOS Splash Screens
    splash_dir = os.path.join("ios", "App", "App", "Assets.xcassets", "Splash.imageset")
    create_splash_screen(os.path.join(splash_dir, "splash-2732x2732.png"), master, 2732, 2732)
    create_splash_screen(os.path.join(splash_dir, "splash-2732x2732-1.png"), master, 2732, 2732)
    create_splash_screen(os.path.join(splash_dir, "splash-2732x2732-2.png"), master, 2732, 2732)

    # 3. Android Splash and Drawables
    android_res = os.path.join("android", "app", "src", "main", "res")
    create_splash_screen(os.path.join(android_res, "drawable", "splash.png"), master, 1080, 1920)

    # Android launcher icons
    icon_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }
    for folder, px in icon_sizes.items():
        resized = master.resize((px, px), Image.Resampling.LANCZOS)
        out_path = os.path.join(android_res, folder, "ic_launcher.png")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        resized.save(out_path, "PNG")
        resized.save(os.path.join(android_res, folder, "ic_launcher_round.png"), "PNG")
        print(f"Generated Android launcher: {folder} ({px}x{px})")

    print("All native icons and splash screens successfully generated!")
