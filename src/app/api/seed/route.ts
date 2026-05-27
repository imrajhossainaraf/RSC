import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_SEED !== 'true') {
    return NextResponse.json({ message: 'Seed endpoint is disabled in production.' }, { status: 403 });
  }

  try {
    await dbConnect();

    // 1. Clean existing records to make a clean-slate demo
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 2. Define the 23 Categories matching the sidebar
    const categoriesData = [
      { name: "Electronics Components", slug: "electronics-components", icon: "CpuChipIcon", featured: true },
      { name: "Development Boards", slug: "development-boards", icon: "CommandLineIcon", featured: true },
      { name: "Robotics & Automation", slug: "robotics-automation", icon: "CubeTransparentIcon", featured: true },
      { name: "RC Models & Vehicles", slug: "rc-models-vehicles", icon: "TruckIcon" },
      { name: "RC Transmitters & Receivers", slug: "rc-transmitters-receivers", icon: "SignalIcon" },
      { name: "Drones & Accessories", slug: "drones-accessories", icon: "RocketLaunchIcon", featured: true },
      { name: "Power & Batteries", slug: "power-batteries", icon: "BoltIcon" },
      { name: "Tools & Equipment", slug: "tools-equipment", icon: "WrenchScrewdriverIcon" },
      { name: "Test & Measurement Instruments", slug: "test-measurement", icon: "BeakerIcon" },
      { name: "Cables & Connectors", slug: "cables-connectors", icon: "LinkIcon" },
      { name: "Switches & Relays", slug: "switches-relays", icon: "AdjustmentsHorizontalIcon" },
      { name: "Motors & Drivers", slug: "motors-drivers", icon: "Cog6ToothIcon", featured: true },
      { name: "Wireless Communication Modules", slug: "wireless-modules", icon: "WifiIcon" },
      { name: "Solar", slug: "solar", icon: "SunIcon" },
      { name: "PCB & Prototyping", slug: "pcb-prototyping", icon: "CircleStackIcon" },
      { name: "LEDs & Lighting", slug: "leds-lighting", icon: "LightBulbIcon" },
      { name: "Display Modules", slug: "display-modules", icon: "ComputerDesktopIcon" },
      { name: "Audio Components", slug: "audio-components", icon: "SpeakerWaveIcon" },
      { name: "Industrial Electronics", slug: "industrial-electronics", icon: "BuildingOffice2Icon" },
      { name: "IoT Devices", slug: "iot-devices", icon: "GlobeAltIcon" },
      { name: "DIY Electronics Kits", slug: "diy-kits", icon: "PuzzlePieceIcon" },
      { name: "Electronic Gadgets", slug: "electronic-gadgets", icon: "DevicePhoneMobileIcon" },
      { name: "Electrical Accessories", slug: "electrical-accessories", icon: "SparklesIcon" }
    ];
    
    const createdCategories = await Category.insertMany(categoriesData);

    const findCatId = (slug: string) => {
      const cat = createdCategories.find(c => c.slug === slug);
      return cat ? cat._id : null;
    };

    // 3. Create sample premium products linked with new categories
    const productsData = [
      {
        name: "Arduino Uno R3 Microcontroller",
        description: "The classic ATmega328P based microcontroller board. Featuring 14 digital I/O pins, 6 analog inputs, and a robust build quality designed for beginner coding to advanced electronics.",
        price: 24.50,
        discount: 10,
        stock: 45,
        image: "/images/arduino_uno.png",
        featured: true,
        category: findCatId("development-boards"),
        tags: ["arduino", "mcu", "avr", "board"],
        specs: { "MCU": "ATmega328P", "Operating Voltage": "5V", "Flash Memory": "32 KB" }
      },
      {
        name: "Raspberry Pi 4 Model B (8GB)",
        description: "High-performance quad-core 64-bit single board computer. Ideal for IoT projects, edge computing, smart robotics controllers, and media centers.",
        price: 75.00,
        discount: 0,
        stock: 20,
        image: "/images/raspberry_pi.png",
        featured: true,
        category: findCatId("development-boards"),
        tags: ["raspberry", "pi", "rpi", "sbc"],
        specs: { "RAM": "8GB LPDDR4", "SoC": "Broadcom BCM2711", "CPU": "Quad-core Cortex-A72" }
      },
      {
        name: "Brushless DC Motor 400KV",
        description: "High-torque 400KV brushless DC motor built for multirotors, drones, and RC aircraft. Offers high efficiency and long battery life under loads.",
        price: 112.00,
        discount: 5,
        stock: 15,
        image: "/images/brushless_motor.png",
        featured: true,
        category: findCatId("motors-drivers"),
        tags: ["motor", "bldc", "brushless", "drone"],
        specs: { "KV": "400", "Max Power": "1200W", "Weight": "145g" }
      },
      {
        name: "Carbon Fiber Propellers (Set)",
        description: "Rigid, lightweight 10-inch carbon fiber propeller pairs (CW/CCW) designed to minimize vibration and enhance drone stability.",
        price: 45.99,
        discount: 15,
        stock: 30,
        image: "/images/propellers.png",
        featured: true,
        category: findCatId("drones-accessories"),
        tags: ["propeller", "drone", "carbon", "cf"],
        specs: { "Size": "10x4.5", "Material": "Carbon Fiber", "Type": "CW + CCW" }
      },
      {
        name: "LiPo Battery Pack 5000mAh",
        description: "3S 11.1V high-capacity Lithium Polymer battery pack with 50C discharge rate. Includes XT60 connector.",
        price: 89.00,
        discount: 0,
        stock: 25,
        image: "/images/lipo_battery.png",
        featured: true,
        category: findCatId("power-batteries"),
        tags: ["lipo", "battery", "power", "rc"],
        specs: { "Voltage": "11.1V", "Capacity": "5000mAh", "Discharge Rate": "50C" }
      },
      {
        name: "HC-SR04 Ultrasonic Distance Sensor",
        description: "Non-contact ultrasonic distance measuring module providing 2cm to 400cm sensing range. Ideal for obstacle detection in robotics projects.",
        price: 12.50,
        discount: 0,
        stock: 150,
        image: "/images/ultrasonic_sensor.png",
        featured: true,
        category: findCatId("electronics-components"),
        tags: ["sensor", "sonar", "ultrasonic", "distance"],
        specs: { "Sensing Range": "2cm - 400cm", "Operating Current": "15mA", "Supply Voltage": "5V" }
      },
      {
        name: "High-Torque Metal Gear Servo",
        description: "MG996R high torque metal gear dual-ball bearing servo motor for RC cars, robotic joints, and mechanical steering links.",
        price: 32.00,
        discount: 8,
        stock: 40,
        image: "/images/servo_motor.png",
        featured: true,
        category: findCatId("motors-drivers"),
        tags: ["servo", "motor", "robotic", "steering"],
        specs: { "Stall Torque": "12 kg-cm", "Operating Voltage": "4.8V - 7.2V", "Weight": "55g" }
      },
      {
        name: "Pro Jumper Wire Kit (120pcs)",
        description: "Premium selection of male-to-male, female-to-female, and male-to-female breadboard connection jumper wires.",
        price: 18.25,
        discount: 0,
        stock: 200,
        image: "/images/jumper_wires.png",
        featured: true,
        category: findCatId("cables-connectors"),
        tags: ["wire", "jumper", "cable", "breadboard"],
        specs: { "Quantity": "120 pcs", "Length": "20cm", "Types": "M-M, F-F, M-F" }
      }
    ];

    const createdProducts = await Product.insertMany(productsData);

    // Update Category counts
    for (const cat of createdCategories) {
      const count = await Product.countDocuments({ category: cat._id });
      await Category.findByIdAndUpdate(cat._id, { productCount: count });
    }

    return NextResponse.json({
      message: "Robotics Shop CTG Database Seeded Successfully!",
      categoriesCount: createdCategories.length,
      productsCount: createdProducts.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Seeding error:", error);
    return NextResponse.json({ message: "Seeding failed", error: message }, { status: 500 });
  }
}
