import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // 1. Clean existing records to make a clean-slate demo
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 2. Create Categories
    const categoriesData = [
      { name: "Microcontrollers" },
      { name: "Sensors & Modules" },
      { name: "Motors & Actuators" },
      { name: "Power & Batteries" }
    ];
    
    const createdCategories = await Category.insertMany(categoriesData);

    const findCatId = (name: string) => {
      const cat = createdCategories.find(c => c.name === name);
      return cat ? cat._id : null;
    };

    // 3. Create Premium Products with real details & local public generated images
    const productsData = [
      {
        name: "Arduino Uno R3 Microcontroller",
        description: "The Arduino Uno R3 is the perfect board to get started with electronics and coding. Featuring the ATmega328P microcontroller, 14 digital input/output pins, and 6 analog inputs, it is reliable, robust, and supported by a massive global developer community.",
        price: 12.50,
        discount: 10,
        stock: 50,
        image: "/images/arduino_uno.png",
        category: findCatId("Microcontrollers")
      },
      {
        name: "ESP32 NodeMCU Development Board",
        description: "The ESP32 is a powerful Wi-Fi and Bluetooth-enabled system-on-chip microcontroller. Excellent for smart home systems, web-connected sensors, robotics projects, and advanced Internet of Things (IoT) applications.",
        price: 8.00,
        discount: 0,
        stock: 120,
        image: "/images/arduino_uno.png",
        category: findCatId("Microcontrollers")
      },
      {
        name: "HC-SR04 Ultrasonic Distance Sensor",
        description: "High-precision HC-SR04 ultrasonic distance sonar module provides non-contact measurement range from 2cm to 400cm. Ideal for robot obstacle avoidance systems, automatic smart trash cans, and fluid level measurement.",
        price: 3.50,
        discount: 0,
        stock: 85,
        image: "/images/ultrasonic_sensor.png",
        category: findCatId("Sensors & Modules")
      },
      {
        name: "DHT22 Temperature & Humidity Sensor",
        description: "The DHT22 is a basic, low-cost digital temperature and humidity sensor. It uses a capacitive humidity sensor and a thermistor to measure the surrounding air, yielding a high-accuracy digital signal on the data pin.",
        price: 4.50,
        discount: 15,
        stock: 60,
        image: "/images/ultrasonic_sensor.png",
        category: findCatId("Sensors & Modules")
      },
      {
        name: "SG90 Micro Servo Motor 9g",
        description: "Lightweight, high-quality, and lightning-fast SG90 micro servo. Rotates 180 degrees (90 in each direction) and is perfect for small robotic arms, animatronics, camera gimbals, and steering mechanisms.",
        price: 2.80,
        discount: 0,
        stock: 150,
        image: "/images/servo_motor.png",
        category: findCatId("Motors & Actuators")
      },
      {
        name: "NEMA 17 Stepper Motor 40mm",
        description: "High-torque NEMA 17 stepper motor, perfect for 3D printers, CNC machines, mechanical arms, and high-precision automation systems. Comes with a detachable 1-meter connection cable.",
        price: 15.00,
        discount: 5,
        stock: 35,
        image: "/images/servo_motor.png",
        category: findCatId("Motors & Actuators")
      },
      {
        name: "18650 Li-ion Battery Pack 3.7V",
        description: "Premium high-capacity rechargeable 18650 lithium-ion cell, perfect for mobile robotics, wearable tech power hubs, and high-drain applications. Features integrated voltage overload protection.",
        price: 6.50,
        discount: 0,
        stock: 90,
        image: "/images/lithium_battery.png",
        category: findCatId("Power & Batteries")
      }
    ];

    const createdProducts = await Product.insertMany(productsData);

    return NextResponse.json({
      message: "Database seeded successfully!",
      categoriesCount: createdCategories.length,
      productsCount: createdProducts.length
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ message: "Seeding failed", error: error.message }, { status: 500 });
  }
}
