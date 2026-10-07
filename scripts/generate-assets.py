import os
import json
from PIL import Image, ImageDraw

def load_master_icon():
    master_path = os.path.join("assets", "flowbean-master-icon.png")
    if not os.path.exists(master_path):
        raise FileNotFoundError(f"Master icon not found at {master_path}")
    img = Image.open(master_path).convert("RGBA")
    return img

def create_splash_screen(dest_path, master_icon, width=2732, height=2732):
    bg_color = (44, 32, 24, 255) # #2C2018
    img = Image.new("RGBA", (width, height), bg_color)
    center_x = width // 2
    center_y = height // 2

    # Scale master icon to ~35% of the shortest dimension
    icon_target_size = int(min(width, height) * 0.35)
    icon_resized = master_icon.resize((icon_target_size, icon_target_size), Image.Resampling.LANCZOS)
    paste_pos = (center_x - icon_resized.width // 2, center_y - icon_resized.height // 2)
    img.paste(icon_resized, paste_pos, icon_resized)

    dirname = os.path.dirname(dest_path)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    img.convert("RGB").save(dest_path, "PNG")
    print(f"Generated splash: {dest_path} ({width}x{height})")

def make_round_icon(icon_img):
    """Creates a circular masked icon for Android round launcher."""
    size = icon_img.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    
    round_img = Image.new('RGBA', size, (0, 0, 0, 0))
    round_img.paste(icon_img, (0, 0))
    round_img.putalpha(mask)
    return round_img

def make_adaptive_foreground(master_icon, fg_size):
    """
    Android adaptive icon foreground is 108dp.
    The safe zone is the central 66dp (~65-70% of canvas).
    """
    bg_color = (44, 32, 24, 255) # #2C2018
    fg = Image.new("RGBA", (fg_size, fg_size), bg_color)
    inner_size = int(fg_size * 0.72)
    inner_icon = master_icon.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    offset = (fg_size - inner_size) // 2
    fg.paste(inner_icon, (offset, offset), inner_icon)
    return fg

def generate_ios_assets(master):
    ios_base = os.path.join("ios", "App", "App", "Assets.xcassets")
    icon_dir = os.path.join(ios_base, "AppIcon.appiconset")
    os.makedirs(icon_dir, exist_ok=True)

    # 1. Master 1024x1024 without alpha (Apple requirement)
    master_rgb = master.convert("RGB")
    ios_master_path = os.path.join(icon_dir, "AppIcon-512@2x.png")
    master_rgb.save(ios_master_path, "PNG")
    print(f"Generated iOS master icon: {ios_master_path}")

    # 2. Detailed iPhone icon sizes for universal compatibility
    ios_sizes = [
        {"size": "20x20", "scale": "2x", "pixels": 40, "name": "AppIcon-20x20@2x.png", "idiom": "iphone"},
        {"size": "20x20", "scale": "3x", "pixels": 60, "name": "AppIcon-20x20@3x.png", "idiom": "iphone"},
        {"size": "29x29", "scale": "2x", "pixels": 58, "name": "AppIcon-29x29@2x.png", "idiom": "iphone"},
        {"size": "29x29", "scale": "3x", "pixels": 87, "name": "AppIcon-29x29@3x.png", "idiom": "iphone"},
        {"size": "40x40", "scale": "2x", "pixels": 80, "name": "AppIcon-40x40@2x.png", "idiom": "iphone"},
        {"size": "40x40", "scale": "3x", "pixels": 120, "name": "AppIcon-40x40@3x.png", "idiom": "iphone"},
        {"size": "60x60", "scale": "2x", "pixels": 120, "name": "AppIcon-60x60@2x.png", "idiom": "iphone"},
        {"size": "60x60", "scale": "3x", "pixels": 180, "name": "AppIcon-60x60@3x.png", "idiom": "iphone"},
    ]

    contents_images = []
    for item in ios_sizes:
        resized = master_rgb.resize((item["pixels"], item["pixels"]), Image.Resampling.LANCZOS)
        out_file = os.path.join(icon_dir, item["name"])
        resized.save(out_file, "PNG")
        contents_images.append({
            "size": item["size"],
            "idiom": item["idiom"],
            "filename": item["name"],
            "scale": item["scale"]
        })

    # Add the App Store / TestFlight 1024x1024 marketing & universal entries
    contents_images.append({
        "size": "1024x1024",
        "idiom": "ios-marketing",
        "filename": "AppIcon-512@2x.png",
        "scale": "1x"
    })
    contents_images.append({
        "size": "1024x1024",
        "idiom": "universal",
        "platform": "ios",
        "filename": "AppIcon-512@2x.png"
    })

    contents_json = {
        "images": contents_images,
        "info": {
            "version": 1,
            "author": "xcode"
        }
    }
    with open(os.path.join(icon_dir, "Contents.json"), "w") as f:
        json.dump(contents_json, f, indent=2)
    print("Updated iOS Contents.json with full iPhone and marketing icons.")

    # 3. iOS Splash Screens
    splash_dir = os.path.join(ios_base, "Splash.imageset")
    for s_name in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
        create_splash_screen(os.path.join(splash_dir, s_name), master, 2732, 2732)

def generate_android_assets(master):
    android_res = os.path.join("android", "app", "src", "main", "res")

    # 1. Ensure ic_launcher_background color is #2C2018
    values_dir = os.path.join(android_res, "values")
    os.makedirs(values_dir, exist_ok=True)
    bg_xml_path = os.path.join(values_dir, "ic_launcher_background.xml")
    with open(bg_xml_path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#2C2018</color>\n</resources>\n')
    print("Updated Android ic_launcher_background.xml to #2C2018")

    # 2. Remove legacy drawable-v24/ic_launcher_foreground.xml if present (it overrides mipmap icons with capacitor robot)
    cap_robot_vector = os.path.join(android_res, "drawable-v24", "ic_launcher_foreground.xml")
    if os.path.exists(cap_robot_vector):
        os.remove(cap_robot_vector)
        print("Removed conflicting drawable-v24/ic_launcher_foreground.xml")

    # 3. Android launcher & adaptive icons
    density_configs = {
        "mipmap-mdpi": {"launcher": 48, "foreground": 108},
        "mipmap-hdpi": {"launcher": 72, "foreground": 162},
        "mipmap-xhdpi": {"launcher": 96, "foreground": 216},
        "mipmap-xxhdpi": {"launcher": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"launcher": 192, "foreground": 432}
    }

    master_rgb = master.convert("RGB")

    for folder, dims in density_configs.items():
        target_dir = os.path.join(android_res, folder)
        os.makedirs(target_dir, exist_ok=True)

        # Standard square launcher
        l_size = dims["launcher"]
        launcher_img = master_rgb.resize((l_size, l_size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")

        # Round launcher
        round_img = make_round_icon(launcher_img)
        round_img.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")

        # Adaptive foreground
        fg_size = dims["foreground"]
        fg_img = make_adaptive_foreground(master, fg_size)
        fg_img.save(os.path.join(target_dir, "ic_launcher_foreground.png"), "PNG")
        print(f"Generated Android icons for {folder}: {l_size}px / fg {fg_size}px")

    # 4. Splash screens
    splash_dir = os.path.join(android_res, "drawable")
    create_splash_screen(os.path.join(splash_dir, "splash.png"), master, 1080, 1920)

    # Portrait splash variations
    port_densities = {
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
    }
    for folder, (w, h) in port_densities.items():
        out_p = os.path.join(android_res, folder, "splash.png")
        create_splash_screen(out_p, master, w, h)

def generate_web_assets(master):
    public_dir = "public"
    os.makedirs(public_dir, exist_ok=True)

    # Flowbean logo PNG for App header & marketing
    logo_512 = master.resize((512, 512), Image.Resampling.LANCZOS)
    logo_512.save(os.path.join(public_dir, "flowbean-logo.png"), "PNG")

    # Apple touch icon
    touch_180 = master.resize((180, 180), Image.Resampling.LANCZOS)
    touch_180.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

    # Favicon PNGs
    fav_64 = master.resize((64, 64), Image.Resampling.LANCZOS)
    fav_64.save(os.path.join(public_dir, "favicon.png"), "PNG")
    fav_32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(public_dir, "favicon-32x32.png"), "PNG")

    print("Generated Web & PWA assets in public/ directory.")

if __name__ == "__main__":
    master = load_master_icon()
    generate_ios_assets(master)
    generate_android_assets(master)
    generate_web_assets(master)
    print("\nAll Flowbean native assets successfully generated across iOS, Android and Web!")
