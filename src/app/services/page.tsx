import styles from './page.module.css';
import { 
  WrenchScrewdriverIcon, 
  CpuChipIcon, 
  Cog6ToothIcon, 
  LightBulbIcon, 
  AdjustmentsHorizontalIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ServicesPage() {
  const services = [
    {
      title: "PCB Assembly & Fabrication",
      description: "Quick-turn prototyping and low-volume production runs. Single layer to multi-layer high-precision PCBs with custom SMT stencil placements.",
      icon: CpuChipIcon
    },
    {
      title: "Robotics Hardware Assembly",
      description: "Complete manufacturing options from design drafting to physical assembly. Actuators, frame structure mounting, power line setups, and structural alignment checks.",
      icon: Cog6ToothIcon
    },
    {
      title: "Custom Sourcing & Kitting",
      description: "Need bulk supplies for workshops or classroom bundles? We source components globally and package bespoke educational or industrial DIY kits.",
      icon: AdjustmentsHorizontalIcon
    },
    {
      title: "Engineering Consultancy",
      description: "Technical review, schematic inspections, hardware architecture design, and embedded firmware support for AVR/ESP32/STM32 platforms.",
      icon: WrenchScrewdriverIcon
    },
    {
      title: "Custom Cabling & Harnessing",
      description: "Reliable custom wiring configurations, industrial-grade power connections, sensor harnesses, and high-frequency communication connectors.",
      icon: LightBulbIcon
    },
    {
      title: "Testing & Quality Auditing",
      description: "Rigorous quality test configurations, stress checks, signal tolerance validation, battery load testing, and datasheet reports.",
      icon: ShieldCheckIcon
    }
  ];

  return (
    <div className={styles.servicesContainer}>
      <header className={styles.header}>
        <span className="badge badge-orange">Robotics Shop CTG Services</span>
        <h1>Professional Engineering & Custom Manufacturing</h1>
        <p className={styles.subtext}>
          From individual prototypes to small-batch production, our technical support and manufacturing division is ready to assist.
        </p>
      </header>

      <div className={styles.servicesGrid}>
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <div className={`${styles.serviceCard} glass-card`} key={svc.title}>
              <div className={styles.iconContainer}>
                <Icon width={28} height={28} />
              </div>
              <h3>{svc.title}</h3>
              <p>{svc.description}</p>
            </div>
          );
        })}
      </div>

      <section className={`${styles.ctaSection} glass-card`}>
        <h2>Request a Custom Project Quote</h2>
        <p>
          Send us your design schematics, CAD layouts, or component BOM (Bill of Materials), and our engineers will get back to you with a comprehensive quote within 24-48 hours.
        </p>
        <Link href="/contact" className="btn-orange">
          Contact Our Engineering Team
        </Link>
      </section>
    </div>
  );
}
